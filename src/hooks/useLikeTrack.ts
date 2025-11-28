import { useState, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateTrack } from '../store/musicSlice';
import { likeTrack, unlikeTrack, ApiError } from '../api/api';
import { Track } from '../types/Track';

type UseLikeTrackReturn = {
  isLoading: boolean;
  errorMsg: string | null;
  toggleLike: () => void;
  isLiked: boolean;
};

export const useLikeTrack = (track: Track | null): UseLikeTrackReturn => {
  const dispatch = useAppDispatch();
  const favoriteTracks = useAppSelector((state) => state.music.favoriteTracks);
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentTrack = useAppSelector((state) => state.music.currentTrack);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Проверяем, лайкнут ли трек
  const isLiked = useMemo(() => {
    if (!track || !isAuthenticated) return false;
    // Проверяем, есть ли трек в избранных
    const inFavorites = favoriteTracks.some((t) => t._id === track._id);
    // Также проверяем stared_user в самом треке
    const hasLikes = track.stared_user && track.stared_user.length > 0;
    return inFavorites || hasLikes;
  }, [track, favoriteTracks, isAuthenticated]);

  const toggleLike = useCallback(() => {
    if (!track) {
      setErrorMsg('Трек не выбран');
      return;
    }

    if (!isAuthenticated || !token) {
      setErrorMsg('Необходимо войти в систему для добавления в избранное');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    // Проверяем, не является ли токен маркером отсутствия токена
    if (token === 'NO_TOKEN' || token === 'SESSION_AUTH') {
      setErrorMsg('Токен авторизации не получен. Попробуйте войти снова.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const actionApi = isLiked ? unlikeTrack : likeTrack;

    actionApi(track._id, token)
      .then((updatedTrack) => {
        // Обновляем трек в Redux
        // updateTrack автоматически обновит currentTrack, если это он
        dispatch(updateTrack(updatedTrack));
      })
      .catch((error) => {
        console.error('Ошибка при изменении статуса лайка:', error);
        if (error instanceof ApiError) {
          if (error.status === 401) {
            // Проверяем, не является ли это маркером отсутствия токена
            if (token === 'NO_TOKEN' || token === 'SESSION_AUTH') {
              setErrorMsg('Не удалось изменить статус лайка. API может требовать токен авторизации.');
            } else {
              setErrorMsg('Сессия истекла. Пожалуйста, войдите снова.');
            }
          } else {
            setErrorMsg(error.message || 'Произошла ошибка при изменении статуса лайка');
          }
        } else {
          setErrorMsg('Произошла ошибка при изменении статуса лайка');
        }
        setTimeout(() => setErrorMsg(null), 3000);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [track, isLiked, token, isAuthenticated, currentTrack, dispatch]);

  return {
    isLoading,
    errorMsg,
    toggleLike,
    isLiked,
  };
};

