import { Track } from '../types/Track';

const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  username: string;
  email: string;
}

export interface ApiErrorResponse {
  detail?: string;
  email?: string[];
  password?: string[];
  username?: string[];
  non_field_errors?: string[];
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: ApiErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response, clearAuthOn401: boolean = true): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    let errorMessage = `Ошибка: ${response.status}`;
    
    if (isJson) {
      if (data.detail) {
        errorMessage = data.detail;
      } else if (data.non_field_errors && Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
        errorMessage = data.non_field_errors[0];
      } else if (typeof data === 'string') {
        errorMessage = data;
      }
    } else if (typeof data === 'string') {
      errorMessage = data;
    }
    
    // Специальная обработка для 401 ошибок
    // clearAuthOn401 = false для login/signup, чтобы не очищать токен при неверных учетных данных
    if (response.status === 401 && clearAuthOn401) {
      // Очищаем токен из localStorage, если он там есть
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      errorMessage = 'Сессия истекла. Пожалуйста, войдите снова.';
    }
    
    throw new ApiError(errorMessage, response.status, isJson ? data : undefined);
  }
  
  return data;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  // Шаг 1: Выполняем вход через /user/login/
  let loginResponse: Response;
  let useCredentials = true;
  
  try {
    loginResponse = await fetch(`${API_BASE_URL}/user/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Пробуем с credentials для установки cookies
    });
  } catch (fetchError) {
    // Если CORS ошибка, пробуем без credentials
    if (fetchError instanceof TypeError || (fetchError as Error)?.message?.includes('Failed to fetch')) {
      console.warn('CORS ошибка с credentials при логине, пробуем без credentials');
      useCredentials = false;
      loginResponse = await fetch(`${API_BASE_URL}/user/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    } else {
      throw fetchError;
    }
  }
  
  // clearAuthOn401 = false, так как при логине 401 означает неверные учетные данные, а не истекшую сессию
  const loginData = await handleResponse<any>(loginResponse, false);
  
  // Логируем ответ для отладки
  console.log('Ответ от API login:', loginData);
  
  // Шаг 2: Получаем токен через /user/token/ (передаем email и password)
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(`${API_BASE_URL}/user/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
      ...(useCredentials ? { credentials: 'include' as RequestCredentials } : {}),
    });
  } catch (fetchError) {
    console.error('Ошибка при запросе токена:', fetchError);
    throw new ApiError('Ошибка при получении токена', 500);
  }
  
  // Обрабатываем ответ (handleResponse сам проверит статус и выбросит ошибку если нужно)
  const tokenData = await handleResponse<any>(tokenResponse, false);
  console.log('Ответ от API token:', tokenData);
  
  // Извлекаем токен из ответа
  const accessToken = tokenData.access || tokenData.token || tokenData.access_token || tokenData.accessToken || '';
  const refreshToken = tokenData.refresh || tokenData.refresh_token || tokenData.refreshToken || '';
  
  if (!accessToken) {
    console.error('Токен не найден в ответе /user/token/. Полный ответ:', JSON.stringify(tokenData, null, 2));
    throw new ApiError('Не удалось получить токен авторизации', 500);
  }
  
  // Нормализуем ответ, объединяя данные пользователя из login и токен из token
  const normalizedResponse: AuthResponse = {
    access: accessToken,
    refresh: refreshToken,
    username: loginData.username || loginData.user?.username || credentials.email.split('@')[0],
    email: loginData.email || loginData.user?.email || credentials.email,
  };
  
  console.log('Нормализованный ответ:', normalizedResponse);
  
  return normalizedResponse;
}

export async function signup(userData: SignupRequest): Promise<AuthResponse> {
  // Шаг 1: Выполняем регистрацию через /user/signup/
  let signupResponse: Response;
  let useCredentials = true;
  
  try {
    signupResponse = await fetch(`${API_BASE_URL}/user/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Для установки cookies
    });
  } catch (fetchError) {
    // Если CORS ошибка, пробуем без credentials
    if (fetchError instanceof TypeError || (fetchError as Error)?.message?.includes('Failed to fetch')) {
      console.warn('CORS ошибка с credentials при регистрации, пробуем без credentials');
      useCredentials = false;
      signupResponse = await fetch(`${API_BASE_URL}/user/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
    } else {
      throw fetchError;
    }
  }
  
  // clearAuthOn401 = false, так как при регистрации 401 означает ошибку регистрации, а не истекшую сессию
  const signupData = await handleResponse<any>(signupResponse, false);
  
  console.log('Ответ от API signup:', signupData);
  
  // Шаг 2: После регистрации нужно сначала войти через /user/login/
  // Это необходимо для установки сессии перед получением токена
  let loginResponse: Response;
  try {
    loginResponse = await fetch(`${API_BASE_URL}/user/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
      }),
      ...(useCredentials ? { credentials: 'include' as RequestCredentials } : {}),
    });
  } catch (fetchError) {
    console.error('Ошибка при входе после регистрации:', fetchError);
    throw new ApiError('Ошибка при входе после регистрации', 500);
  }
  
  const loginData = await handleResponse<any>(loginResponse, false);
  console.log('Ответ от API login после регистрации:', loginData);
  
  // Шаг 3: Получаем токен через /user/token/ (передаем email и password)
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(`${API_BASE_URL}/user/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
      }),
      ...(useCredentials ? { credentials: 'include' as RequestCredentials } : {}),
    });
  } catch (fetchError) {
    console.error('Ошибка при запросе токена:', fetchError);
    throw new ApiError('Ошибка при получении токена', 500);
  }
  
  // Обрабатываем ответ (handleResponse сам проверит статус и выбросит ошибку если нужно)
  const tokenData = await handleResponse<any>(tokenResponse, false);
  console.log('Ответ от API token:', tokenData);
  
  // Извлекаем токен из ответа
  const accessToken = tokenData.access || tokenData.token || tokenData.access_token || tokenData.accessToken || '';
  const refreshToken = tokenData.refresh || tokenData.refresh_token || tokenData.refreshToken || '';
  
  if (!accessToken) {
    console.error('Токен не найден в ответе /user/token/. Полный ответ:', JSON.stringify(tokenData, null, 2));
    throw new ApiError('Не удалось получить токен авторизации', 500);
  }
  
  // Нормализуем ответ, объединяя данные пользователя из signup/login и токен из token
  const normalizedResponse: AuthResponse = {
    access: accessToken,
    refresh: refreshToken,
    username: signupData.username || loginData.username || signupData.user?.username || loginData.user?.username || userData.username,
    email: signupData.email || loginData.email || signupData.user?.email || loginData.user?.email || userData.email,
  };
  
  console.log('Нормализованный ответ:', normalizedResponse);
  
  return normalizedResponse;
}

export async function getTracks(token?: string | null): Promise<Track[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Если токен есть и это не маркер отсутствия токена, добавляем Authorization header
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Если токен = NO_TOKEN, не добавляем Authorization header
  // Браузер автоматически отправит cookies, если они есть
  
  const response = await fetch(`${API_BASE_URL}/catalog/track/all/`, {
    method: 'GET',
    headers,
    // Не используем credentials из-за CORS проблем
  });
  
  const data = await handleResponse<any>(response);
  
  // API может возвращать массив напрямую или объект с полем results/items/data
  if (Array.isArray(data)) {
    return data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.results)) {
      return data.results;
    } else if (Array.isArray(data.items)) {
      return data.items;
    } else if (Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data.tracks)) {
      return data.tracks;
    } else {
      console.warn('Неожиданный формат ответа API:', data);
      return [];
    }
  } else {
    console.warn('Неожиданный формат ответа API:', data);
    return [];
  }
}

export async function getPlaylistTracks(
  playlistId: number,
  token?: string | null
): Promise<Track[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Если токен есть и это не маркер отсутствия токена, добавляем Authorization header
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Если токен = NO_TOKEN, не добавляем Authorization header
  // Браузер автоматически отправит cookies, если они есть
  
  const response = await fetch(
    `${API_BASE_URL}/catalog/selection/${playlistId}/track/`,
    {
      method: 'GET',
      headers,
      // Не используем credentials из-за CORS проблем
    }
  );
  
  return handleResponse<Track[]>(response);
}

export async function likeTrack(
  trackId: number,
  token: string
): Promise<Track> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Если токен есть и это не маркер отсутствия токена, добавляем Authorization header
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/catalog/track/${trackId}/favorite/`,
    {
      method: 'POST',
      headers,
      // Не используем credentials из-за CORS проблем
    }
  );
  
  return handleResponse<Track>(response);
}

export async function unlikeTrack(
  trackId: number,
  token: string
): Promise<Track> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Если токен есть и это не маркер отсутствия токена, добавляем Authorization header
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/catalog/track/${trackId}/favorite/`,
    {
      method: 'DELETE',
      headers,
      // Не используем credentials из-за CORS проблем
    }
  );
  
  return handleResponse<Track>(response);
}

export async function getFavoriteTracks(
  token: string
): Promise<Track[]> {
  // Проверяем, что токен не пустой
  if (!token || token.trim() === '') {
    throw new ApiError('Токен не предоставлен', 401);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Если токен есть и это не маркер отсутствия токена, добавляем Authorization header
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  // Если токен = NO_TOKEN или SESSION_AUTH, не добавляем Authorization header
  // Браузер автоматически отправит cookies, если они есть (как в likeTrack/unlikeTrack)

  const response = await fetch(
    `${API_BASE_URL}/catalog/track/favorite/all/`,
    {
      method: 'GET',
      headers,
      // Не используем credentials из-за CORS проблем (как в likeTrack/unlikeTrack)
      // Браузер автоматически отправит cookies для same-origin запросов
    }
  );
  
  const data = await handleResponse<any>(response);
  
  // API может возвращать массив напрямую или объект с полем results/items/data
  if (Array.isArray(data)) {
    return data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.results)) {
      return data.results;
    } else if (Array.isArray(data.items)) {
      return data.items;
    } else if (Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data.tracks)) {
      return data.tracks;
    } else {
      console.warn('Неожиданный формат ответа API:', data);
      return [];
    }
  } else {
    console.warn('Неожиданный формат ответа API:', data);
    return [];
  }
}

export { ApiError };

