'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Track } from '../../src/types/Track';
import MainLayout from '../../src/components/MainLayout';
import { getFavoriteTracks, ApiError } from '../../src/api/api';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { logout } from '../../src/store/authSlice';
import { setFavoriteTracks } from '../../src/store/musicSlice';
import styles from './favorites.module.css';

export default function Favorites() {
  const dispatch = useAppDispatch();
  const favoriteTracks = useAppSelector((state) => state.music.favoriteTracks);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = useAppSelector((state) => state.auth.token);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Проверяем авторизацию через localStorage и Redux
    if (typeof window === 'undefined') {
      return;
    }
    
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      
      // Сначала проверяем localStorage
      let localToken = localStorage.getItem('token');
      let localUser = localStorage.getItem('user');
      
      // Если в localStorage нет данных, проверяем Redux (может быть еще не инициализирован)
      if (!localToken || !localUser) {
        // Даем Redux время инициализироваться (до 1 секунды)
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 100; // 100ms
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          
          // Проверяем Redux состояние
          if (isAuthenticated && token) {
            // Redux инициализирован, используем его
            localToken = token;
            break;
          }
          
          // Проверяем localStorage снова (может быть обновлен)
          const newLocalToken = localStorage.getItem('token');
          const newLocalUser = localStorage.getItem('user');
          if (newLocalToken && newLocalUser) {
            // localStorage обновлен, используем его
            localToken = newLocalToken;
            localUser = newLocalUser;
            break;
          }
          
          attempts++;
        }
        
        // Финальная проверка - используем Redux или localStorage
        const finalToken = token || localStorage.getItem('token');
        const finalUser = localStorage.getItem('user');
        
        console.log('Проверка авторизации:');
        console.log('  finalToken:', finalToken ? `${finalToken.substring(0, 20)}...` : 'null');
        console.log('  finalUser:', finalUser ? 'есть' : 'null');
        console.log('  isAuthenticated (Redux):', isAuthenticated);
        console.log('  token (Redux):', token ? `${token.substring(0, 20)}...` : 'null');
        
        // Проверяем, что есть хотя бы токен или авторизация в Redux
        // Если токен есть (даже NO_TOKEN или SESSION_AUTH) или isAuthenticated = true, считаем авторизованным
        const hasAuth = (finalToken && finalToken.trim() !== '') || isAuthenticated;
        
        if (!hasAuth) {
          console.log('Пользователь не авторизован, редирект на вход');
          sessionStorage.setItem('redirectAfterLogin', '/favorites');
          setIsCheckingAuth(false);
          router.push('/auth/signin');
          return;
        }
        
        console.log('Пользователь авторизован, загружаем треки');
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [router, isAuthenticated, token]);

  useEffect(() => {
    // Загружаем треки только после проверки авторизации
    if (isCheckingAuth) {
      return;
    }
    
    if (typeof window === 'undefined') {
      return;
    }
    
    // Используем токен из Redux (как в useLikeTrack), если он есть, иначе из localStorage
    const localToken = token || localStorage.getItem('token');
    
    if (!localToken) {
      return;
    }

    // Загружаем треки
    const fetchFavoriteTracks = async () => {
      setIsLoading(true);
      setError(null);

      // Используем тот же подход, что и в useLikeTrack
      // Если токен = 'NO_TOKEN' или 'SESSION_AUTH', не пытаемся загрузить
      if (!localToken || localToken.trim() === '' || localToken === 'NO_TOKEN' || localToken === 'SESSION_AUTH') {
        console.log('Токен отсутствует или невалидный:', localToken);
        if (localToken === 'NO_TOKEN' || localToken === 'SESSION_AUTH') {
          console.log('Токен не получен при входе. Показываем сообщение об ошибке.');
          setError('SESSION_REFRESH_NEEDED');
          setTracks([]);
          setIsLoading(false);
          return;
        } else {
          console.error('Токен пустой или невалидный');
          sessionStorage.setItem('redirectAfterLogin', '/favorites');
          router.push('/auth/signin');
          return;
        }
      }

      try {
        console.log('Загружаем избранные треки с токеном длиной:', localToken.length);
        console.log('Токен (первые 20 символов):', localToken.substring(0, 20));
        const data = await getFavoriteTracks(localToken);
        console.log('Загружено избранных треков:', data.length);
        setTracks(data);
        // Сохраняем в Redux
        dispatch(setFavoriteTracks(data));
      } catch (err) {
        console.error('Ошибка загрузки избранных треков:', err);
        console.error('Тип ошибки:', err?.constructor?.name);
        console.error('Использованный токен:', localToken ? `${localToken.substring(0, 20)}...` : 'null');
        console.error('Токен из Redux:', token ? `${token.substring(0, 20)}...` : 'null');
        console.error('Токен из localStorage:', localStorage.getItem('token') ? `${localStorage.getItem('token')?.substring(0, 20)}...` : 'null');
        console.error('Детали ошибки:', {
          message: err instanceof Error ? err.message : String(err),
          name: err instanceof Error ? err.name : 'Unknown',
          stack: err instanceof Error ? err.stack : undefined
        });
        
        if (err instanceof ApiError) {
          if (err.status === 401) {
            // Проверяем, не является ли это маркером отсутствия токена
            // В этом случае не разлогиниваем, а просто показываем ошибку
            if (localToken === 'NO_TOKEN' || localToken === 'SESSION_AUTH') {
              console.log('Используется сессионная авторизация, но сервер вернул 401');
              console.log('Возможно, API требует токен в заголовке Authorization');
              console.log('Попробуйте выйти и войти снова, чтобы получить токен');
              setError('SESSION_REFRESH_NEEDED');
              // Не вызываем logout, так как пользователь может быть авторизован через cookies
              // Показываем пустой список вместо редиректа
              setTracks([]);
            } else {
              // Токен истек или невалиден - но если лайки работают, возможно проблема в другом
              console.log('Токен невалиден (401), но лайки работают - возможно проблема в эндпоинте');
              console.log('Пробуем использовать токен из Redux напрямую');
              
              // Если токен из Redux отличается от localToken, пробуем его
              if (token && token !== localToken && token !== 'NO_TOKEN' && token !== 'SESSION_AUTH') {
                console.log('Пробуем загрузить с токеном из Redux');
                try {
                  const retryData = await getFavoriteTracks(token);
                  console.log('Успешно загружено с токеном из Redux:', retryData.length);
                  setTracks(retryData);
                  dispatch(setFavoriteTracks(retryData));
                  setError(null);
                  return;
                } catch (retryErr) {
                  console.error('Повторная попытка тоже не удалась:', retryErr);
                }
              }
              
              // Если повторная попытка не помогла, показываем ошибку
              setError('SESSION_REFRESH_NEEDED');
              setTracks([]);
            }
          } else {
            setError(err.message || `Ошибка сервера: ${err.status}`);
          }
        } else {
          // Проверяем, не является ли это CORS ошибкой
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            console.error('CORS или сетевая ошибка. Попробуем без credentials: include');
            // Если это CORS ошибка из-за credentials, попробуем еще раз без credentials
            if (localToken === 'NO_TOKEN' || localToken === 'SESSION_AUTH') {
              setError('SESSION_REFRESH_NEEDED');
              setTracks([]);
            } else {
              setError('Ошибка подключения к серверу. Проверьте подключение к интернету или попробуйте позже.');
            }
          } else {
            // Для других ошибок показываем более информативное сообщение
            setError(`Произошла ошибка: ${errorMessage || 'Неизвестная ошибка'}. Проверьте подключение к интернету.`);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteTracks();
  }, [isCheckingAuth, token, router, dispatch]);

  // Используем favoriteTracks из Redux, если они есть
  useEffect(() => {
    if (favoriteTracks.length > 0 && tracks.length === 0 && !isLoading) {
      setTracks(favoriteTracks);
    }
  }, [favoriteTracks, tracks.length, isLoading]);

  const handleTracksChange = useCallback((updatedTracks: Track[]) => {
    // Фильтруем треки, оставляя только те, которые все еще в избранном
    const stillFavorite = updatedTracks.filter((track) => 
      track.stared_user && track.stared_user.length > 0
    );
    setTracks(stillFavorite);
    // Обновляем Redux
    dispatch(setFavoriteTracks(stillFavorite));
  }, [dispatch]);

  // Функция для перезагрузки избранных треков
  const reloadFavorites = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const localToken = localStorage.getItem('token');
    if (!localToken) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getFavoriteTracks(localToken);
      console.log('Перезагружено избранных треков:', data.length);
      setTracks(data);
      // Сохраняем в Redux
      dispatch(setFavoriteTracks(data));
    } catch (err) {
      console.error('Ошибка перезагрузки избранных треков:', err);
      // Не показываем ошибку при перезагрузке, чтобы не мешать пользователю
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Обновляем список при изменении трека
  const handleTracksChangeWithReload = useCallback((updatedTracks: Track[]) => {
    // Фильтруем треки, оставляя только те, которые все еще в избранном
    const stillFavorite = updatedTracks.filter((track) => 
      track.stared_user && track.stared_user.length > 0
    );
    setTracks(stillFavorite);
    
    // Если трек был добавлен в избранное, перезагружаем список
    // (на случай, если трек был добавлен на другой странице)
    if (stillFavorite.length > tracks.length) {
      reloadFavorites();
    }
  }, [tracks.length, reloadFavorites]);

  // Обработчик для обновления сессии (должен быть до условных возвратов)
  const handleRefreshSession = useCallback(() => {
    dispatch(logout());
    sessionStorage.setItem('redirectAfterLogin', '/favorites');
    router.push('/auth/signin');
  }, [dispatch, router]);

  // Форматируем ошибку для отображения (должно быть до условных возвратов)
  const displayError = error === 'SESSION_REFRESH_NEEDED' 
    ? null // Будем показывать кастомное сообщение
    : error;

  // Показываем загрузку во время проверки авторизации
  if (isCheckingAuth) {
    return (
      <MainLayout
        title="Мои треки"
        tracks={[]}
        error={null}
        isLoading={true}
      />
    );
  }
  
  // Проверяем наличие токена в localStorage или Redux, или isAuthenticated
  const hasToken = typeof window !== 'undefined' 
    ? !!(localStorage.getItem('token') || token || isAuthenticated) 
    : !!(token || isAuthenticated);
  
  // Если токена нет и не авторизован, показываем загрузку (будет редирект через useEffect)
  if (!hasToken && !isAuthenticated) {
    return (
      <MainLayout
        title="Мои треки"
        tracks={[]}
        error={null}
        isLoading={true}
      />
    );
  }

  return (
    <>
      {error === 'SESSION_REFRESH_NEEDED' && (
        <div style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ff6b6b', marginBottom: '15px' }}>
            Не удалось загрузить избранные треки. API требует токен авторизации, который не был получен при входе.
          </p>
          <button
            onClick={handleRefreshSession}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Выйти и войти снова
          </button>
        </div>
      )}
      <MainLayout
        title="Мои треки"
        tracks={tracks}
        error={displayError}
        isLoading={isLoading}
        onTracksChange={handleTracksChangeWithReload}
      />
    </>
  );
}

