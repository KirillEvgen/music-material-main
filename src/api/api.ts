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
  // Пробуем сначала с credentials, чтобы установить cookies
  let response: Response;
  let useCredentials = true;
  
  try {
    response = await fetch(`${API_BASE_URL}/user/login/`, {
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
      response = await fetch(`${API_BASE_URL}/user/login/`, {
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
  
  // Проверяем заголовки ответа - возможно токен там
  const authHeader = response.headers.get('Authorization');
  const setCookieHeader = response.headers.get('Set-Cookie');
  
  console.log('Заголовки ответа:');
  console.log('Authorization:', authHeader);
  console.log('Set-Cookie:', setCookieHeader);
  console.log('Все заголовки:', Object.fromEntries(response.headers.entries()));
  
  // clearAuthOn401 = false, так как при логине 401 означает неверные учетные данные, а не истекшую сессию
  const data = await handleResponse<any>(response, false);
  
  // Логируем ответ для отладки
  console.log('Сырой ответ от API login:', data);
  
  // Пробуем найти токен в различных местах
  let accessToken = '';
  let refreshToken = '';
  
  // 1. В теле ответа
  accessToken = data.access || data.token || data.access_token || data.accessToken || '';
  refreshToken = data.refresh || data.refresh_token || data.refreshToken || '';
  
  // 2. В заголовке Authorization
  if (!accessToken && authHeader) {
    // Может быть "Bearer token" или просто "token"
    accessToken = authHeader.replace('Bearer ', '').trim();
  }
  
  // 3. В cookies (если есть)
  if (!accessToken && setCookieHeader) {
    const cookies = setCookieHeader.split(';');
    for (const cookie of cookies) {
      if (cookie.includes('access') || cookie.includes('token')) {
        const match = cookie.match(/(?:access|token)=([^;]+)/i);
        if (match) {
          accessToken = match[1];
        }
      }
    }
  }
  
  // 4. Проверяем cookies в браузере напрямую
  if (!accessToken && typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.includes('access') || trimmed.includes('token') || trimmed.includes('auth')) {
        const parts = trimmed.split('=');
        if (parts.length === 2 && parts[1]) {
          console.log('Найден токен в cookies браузера:', parts[0]);
          accessToken = parts[1];
          break;
        }
      }
    }
  }
  
  // 5. Если токена все еще нет, пробуем получить его через отдельный запрос
  if (!accessToken) {
    console.warn('Токен не найден в ответе API и cookies. Пробуем получить через отдельный запрос...');
    console.log('Полный ответ API:', JSON.stringify(data, null, 2));
    
    // Пробуем сделать запрос к защищенному эндпоинту, чтобы проверить, работает ли авторизация через cookies
    try {
      const testResponse = await fetch(`${API_BASE_URL}/catalog/track/favorite/all/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        ...(useCredentials ? { credentials: 'include' as RequestCredentials } : {}),
      });
      
      if (testResponse.ok) {
        console.log('Запрос к избранным трекам успешен без токена - используем сессионную авторизацию');
        accessToken = 'SESSION_AUTH';
      } else if (testResponse.status === 401) {
        console.warn('Запрос к избранным трекам вернул 401 - токен действительно нужен');
        // Проверяем, может быть токен в заголовках ответа
        const testAuthHeader = testResponse.headers.get('Authorization');
        if (testAuthHeader) {
          accessToken = testAuthHeader.replace('Bearer ', '').trim();
          console.log('Токен найден в заголовке ответа тестового запроса');
        } else {
          accessToken = useCredentials ? 'SESSION_AUTH' : 'NO_TOKEN';
        }
      } else {
        accessToken = useCredentials ? 'SESSION_AUTH' : 'NO_TOKEN';
      }
    } catch (testError) {
      console.warn('Тестовый запрос не удался:', testError);
      accessToken = useCredentials ? 'SESSION_AUTH' : 'NO_TOKEN';
    }
  }
  
  // Нормализуем ответ
  const normalizedResponse: AuthResponse = {
    access: accessToken,
    refresh: refreshToken,
    username: data.username || data.user?.username || credentials.email.split('@')[0],
    email: data.email || data.user?.email || credentials.email,
  };
  
  console.log('Нормализованный ответ:', normalizedResponse);
  
  return normalizedResponse;
}

export async function signup(userData: SignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/user/signup/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  // clearAuthOn401 = false, так как при регистрации 401 означает ошибку регистрации, а не истекшую сессию
  return handleResponse<AuthResponse>(response, false);
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

