import { useState, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setLikedTrackIds } from '../store/musicSlice';
import { likeTrack, unlikeTrack, getFavoriteTracks, ApiError } from '../api/api';
import { Track } from '../types/Track';

type UseLikeTrackReturn = {
  isLoading: boolean;
  errorMsg: string | null;
  toggleLike: () => void;
  isLiked: boolean;
};

export const useLikeTrack = (track: Track | null): UseLikeTrackReturn => {
  const dispatch = useAppDispatch();
  const likedTrackIds = useAppSelector((state) => state.music.likedTrackIds);
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Проверяем, лайкнут ли трек по массиву ID из Redux
  const isLiked = useMemo(() => {
    if (!track || !isAuthenticated) return false;
    return likedTrackIds.includes(track._id);
  }, [track, likedTrackIds, isAuthenticated]);

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
      .then(() => {
        // После успешного лайка/дизлайка получаем обновленный список избранных треков
        return getFavoriteTracks(token);
      })
      .then((favoriteTracks) => {
        // Извлекаем массив ID из избранных треков и обновляем Redux
        const favoriteTrackIds = favoriteTracks.map((t) => t._id);
        dispatch(setLikedTrackIds(favoriteTrackIds));
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
  }, [track, isLiked, token, isAuthenticated, dispatch]);

  return {
    isLoading,
    errorMsg,
    toggleLike,
    isLiked,
  };
};

