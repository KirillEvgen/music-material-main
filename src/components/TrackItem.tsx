'use client';

import { useCallback, useMemo } from 'react';
import { Track } from '../types/Track';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { playTrack } from '../store/musicSlice';
import { useLikeTrack } from '../hooks/useLikeTrack';
import styles from './TrackList.module.css';

interface TrackItemProps {
  track: Track;
  onTrackUpdate?: (updatedTrack: Track) => void;
}

export default function TrackItem({ track, onTrackUpdate }: TrackItemProps) {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.music.currentTrack);
  const isPlaying = useAppSelector((state) => state.music.isPlaying);
  
  const { isLoading, errorMsg, toggleLike, isLiked } = useLikeTrack(track);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handlePlay = useCallback(() => {
    dispatch(playTrack(track));
  }, [dispatch, track]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike();
    // Обновляем трек в родительском компоненте после успешного лайка
    // Это будет сделано через Redux updateTrack, но для совместимости
    // можно также вызвать onTrackUpdate, если он предоставлен
  }, [toggleLike]);

  const isCurrentTrack = useMemo(() => currentTrack?._id === track._id, [currentTrack, track]);
  const likesCount = useMemo(() => track.stared_user?.length || 0, [track]);

  return (
    <div
      className={`${styles.playlist__item} ${isCurrentTrack ? styles.playlist__itemActive : ''}`}
    >
      {errorMsg && (
        <div className={styles.errorMessage} style={{ 
          color: '#ff6b6b', 
          padding: '10px', 
          marginBottom: '10px',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '4px'
        }}>
          {errorMsg}
        </div>
      )}
      <div className={styles.playlist__track}>
        <div className={styles.track__title}>
          <div className={styles.track__titleImage}>
            {isCurrentTrack ? (
              <div className={`${styles.track__currentIndicator} ${isPlaying ? styles.track__currentIndicatorPulsing : ''}`}></div>
            ) : (
              <svg className={styles.track__titleSvg}>
                <use xlinkHref="/img/icon/sprite.svg#icon-note"></use>
              </svg>
            )}
          </div>
          <div className={styles.track__titleText}>
            <button
              className={styles.track__titleLink}
              onClick={handlePlay}
            >
              {track.name}
            </button>
          </div>
        </div>
        <div className={styles.track__author}>
          <span className={styles.track__authorLink}>
            {track.author}
          </span>
        </div>
        <div className={styles.track__album}>
          <span className={styles.track__albumLink}>{track.album}</span>
        </div>
        <div className={styles.track__time}>
          <button
            className={`${styles.track__likeButton} ${isLiked ? styles.track__likeButtonActive : ''} ${isLoading ? styles.track__likeButtonLoading : ''}`}
            onClick={handleLikeClick}
            disabled={isLoading}
            title={isLiked ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <svg className={styles.track__timeSvg}>
              <use xlinkHref="/img/icon/sprite.svg#icon-like"></use>
            </svg>
            {likesCount > 0 && (
              <span className={styles.track__likesCount}>{likesCount}</span>
            )}
          </button>
          <span className={styles.track__timeText}>
            {formatTime(track.duration_in_seconds)}
          </span>
        </div>
      </div>
    </div>
  );
}

