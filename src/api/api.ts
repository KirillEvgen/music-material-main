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
    
    if (response.status === 401 && clearAuthOn401) {
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
  let loginResponse: Response;
  let useCredentials = true;
  
  try {
    loginResponse = await fetch(`${API_BASE_URL}/user/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
  } catch (fetchError) {
    if (fetchError instanceof TypeError || (fetchError as Error)?.message?.includes('Failed to fetch')) {
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
  
  const loginData = await handleResponse<Record<string, unknown>>(loginResponse, false);
  
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
  } catch {
    throw new ApiError('Ошибка при получении токена', 500);
  }
  
  const tokenData = await handleResponse<Record<string, unknown>>(tokenResponse, false);
  
  const accessToken = (tokenData.access || tokenData.token || tokenData.access_token || tokenData.accessToken || '') as string;
  const refreshToken = (tokenData.refresh || tokenData.refresh_token || tokenData.refreshToken || '') as string;
  
  if (!accessToken) {
    throw new ApiError('Не удалось получить токен авторизации', 500);
  }
  
  const normalizedResponse: AuthResponse = {
    access: accessToken,
    refresh: refreshToken,
    username: (loginData.username || (loginData.user as Record<string, unknown>)?.username || credentials.email.split('@')[0]) as string,
    email: (loginData.email || (loginData.user as Record<string, unknown>)?.email || credentials.email) as string,
  };
  
  return normalizedResponse;
}

export async function signup(userData: SignupRequest): Promise<AuthResponse> {
  let signupResponse: Response;
  let useCredentials = true;
  
  try {
    signupResponse = await fetch(`${API_BASE_URL}/user/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });
  } catch (fetchError) {
    if (fetchError instanceof TypeError || (fetchError as Error)?.message?.includes('Failed to fetch')) {
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
  
  const signupData = await handleResponse<Record<string, unknown>>(signupResponse, false);
  
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
  } catch {
    throw new ApiError('Ошибка при входе после регистрации', 500);
  }
  
  const loginData = await handleResponse<Record<string, unknown>>(loginResponse, false);
  
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
  } catch {
    throw new ApiError('Ошибка при получении токена', 500);
  }
  
  const tokenData = await handleResponse<Record<string, unknown>>(tokenResponse, false);
  
  const accessToken = (tokenData.access || tokenData.token || tokenData.access_token || tokenData.accessToken || '') as string;
  const refreshToken = (tokenData.refresh || tokenData.refresh_token || tokenData.refreshToken || '') as string;
  
  if (!accessToken) {
    throw new ApiError('Не удалось получить токен авторизации', 500);
  }
  
  const normalizedResponse: AuthResponse = {
    access: accessToken,
    refresh: refreshToken,
    username: (signupData.username || loginData.username || (signupData.user as Record<string, unknown>)?.username || (loginData.user as Record<string, unknown>)?.username || userData.username) as string,
    email: (signupData.email || loginData.email || (signupData.user as Record<string, unknown>)?.email || (loginData.user as Record<string, unknown>)?.email || userData.email) as string,
  };
  
  return normalizedResponse;
}

export async function getTracks(token?: string | null): Promise<Track[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/catalog/track/all/`, {
    method: 'GET',
    headers,
  });
  
  const data = await handleResponse<Track[] | { results?: Track[]; items?: Track[]; data?: Track[]; tracks?: Track[] }>(response);
  
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
    }
  }
  return [];
}

export async function getPlaylistTracks(
  playlistId: number,
  token?: string | null
): Promise<Track[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(
    `${API_BASE_URL}/catalog/selection/${playlistId}/track/`,
    {
      method: 'GET',
      headers,
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
  
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/catalog/track/${trackId}/favorite/`,
    {
      method: 'POST',
      headers,
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
  
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/catalog/track/${trackId}/favorite/`,
    {
      method: 'DELETE',
      headers,
    }
  );
  
  return handleResponse<Track>(response);
}

export async function getFavoriteTracks(
  token: string
): Promise<Track[]> {
  if (!token || token.trim() === '') {
    throw new ApiError('Токен не предоставлен', 401);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/catalog/track/favorite/all/`,
    {
      method: 'GET',
      headers,
    }
  );
  
  const data = await handleResponse<Track[] | { results?: Track[]; items?: Track[]; data?: Track[]; tracks?: Track[] }>(response);
  
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
    }
  }
  return [];
}

export { ApiError };
