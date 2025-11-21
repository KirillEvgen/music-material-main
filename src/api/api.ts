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

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    const errorMessage = isJson && data.detail 
      ? data.detail 
      : isJson && data.non_field_errors 
      ? data.non_field_errors[0]
      : `Ошибка: ${response.status}`;
    
    throw new ApiError(errorMessage, response.status, isJson ? data : undefined);
  }
  
  return data;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/user/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  return handleResponse<AuthResponse>(response);
}

export async function signup(userData: SignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/user/signup/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  return handleResponse<AuthResponse>(response);
}

export async function getTracks(token?: string | null): Promise<Track[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/catalog/track/all/`, {
    method: 'GET',
    headers,
  });
  
  const data = await handleResponse<any>(response);
  
  // API может возвращать массив напрямую или объект с полем results
  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.results)) {
    return data.results;
  } else if (data && Array.isArray(data.items)) {
    return data.items;
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
  
  if (token) {
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

export { ApiError };

