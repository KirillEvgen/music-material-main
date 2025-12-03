'use client';

import React, { useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  togglePlayPause, 
  handleVolumeChange, 
  playNext, 
  playPrevious, 
  setCurrentTime,
  toggleShuffle,
  toggleRepeat,
  setCurrentTrack
} from '../store/musicSlice';
import { useLikeTrack } from '../hooks/useLikeTrack';
import styles from './Player.module.css';

export default function Player() {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.music.currentTrack);
  const isPlaying = useAppSelector((state) => state.music.isPlaying);
  const volume = useAppSelector((state) => state.music.volume);
  const currentTime = useAppSelector((state) => state.music.currentTime);
  const duration = useAppSelector((state) => state.music.duration);
  const isShuffleOn = useAppSelector((state) => state.music.isShuffleOn);
  const isRepeatOn = useAppSelector((state) => state.music.isRepeatOn);

  const { isLoading: isLiking, errorMsg: error, toggleLike, isLiked: isTrackLiked } = useLikeTrack(currentTrack);

  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const likesCount = useMemo(() => {
    if (!currentTrack) return 0;
    return currentTrack.stared_user?.length || 0;
  }, [currentTrack]);

  const handleLikeClick = useCallback(() => {
    toggleLike();
  }, [toggleLike]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration === 0 || isNaN(duration)) {
      console.log(
        'Нет корректной длительности трека, не можем перематывать. Duration:',
        duration,
      );
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = Math.max(
      0,
      Math.min(duration, (clickX / width) * duration),
    );

    // Обновляем время через audio элемент
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = newTime;
      // Принудительно обновляем состояние
      dispatch(setCurrentTime(newTime));
    }
  };

  return (
    <div className={styles.bar}>
      <div className={styles.bar__content}>
        <div
          className={styles.bar__playerProgress}
          onClick={handleProgressClick}
          title={`${formatTime(currentTime)} / ${formatTime(duration)}`}
        >
          <div
            className={styles.bar__playerProgressActive}
            style={{
              width:
                duration && duration > 0
                  ? `${(currentTime / duration) * 100}%`
                  : '0%',
              pointerEvents: 'none',
            }}
          ></div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,255,0.1)',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: '10px',
                position: 'absolute',
                top: '-15px',
                left: '10px',
              }}
            >
              {duration
                ? `${Math.round((currentTime / duration) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
        <div className={styles.bar__playerBlock}>
          <div className={styles.bar__player}>
            <div className={styles.player__controls}>
              <div 
                className={styles.player__btnPrev} 
                onClick={() => dispatch(playPrevious())}
                title="Предыдущий трек"
              >
                <svg className={styles.player__btnPrevSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-prev"></use>
                </svg>
              </div>
              <div 
                className={styles.player__btnPlay} 
                onClick={() => dispatch(togglePlayPause())}
                title={isPlaying ? "Пауза" : "Играть"}
              >
                <svg className={styles.player__btnPlaySvg}>
                  <use
                    xlinkHref={
                      isPlaying
                        ? '/img/icon/sprite.svg#icon-pause'
                        : '/img/icon/sprite.svg#icon-play'
                    }
                  ></use>
                </svg>
              </div>
              <div 
                className={styles.player__btnNext} 
                onClick={() => dispatch(playNext())}
                title="Следующий трек"
              >
                <svg className={styles.player__btnNextSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-next"></use>
                </svg>
              </div>
              <div 
                className={styles.player__btnRepeat}
                onClick={() => dispatch(toggleRepeat())}
                title={isRepeatOn ? "Отключить повтор" : "Повторять трек"}
                style={{ 
                  opacity: isRepeatOn ? 1 : 0.5,
                  cursor: 'pointer'
                }}
              >
                <svg className={styles.player__btnRepeatSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-repeat"></use>
                </svg>
              </div>
              <div 
                className={styles.player__btnShuffle} 
                onClick={() => dispatch(toggleShuffle())}
                title={isShuffleOn ? "Отключить перемешивание" : "Перемешать"}
                style={{ 
                  opacity: isShuffleOn ? 1 : 0.5,
                  cursor: 'pointer'
                }}
              >
                <svg className={styles.player__btnShuffleSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-shuffle"></use>
                </svg>
              </div>
            </div>

            <div className={styles.player__trackPlay}>
              <div className={styles.trackPlay__contain}>
                <div className={styles.trackPlay__image}>
                  <svg className={styles.trackPlay__svg}>
                    <use xlinkHref="/img/icon/sprite.svg#icon-note"></use>
                  </svg>
                </div>
                <div className={styles.trackPlay__author}>
                  <span className={styles.trackPlay__authorLink}>
                    {currentTrack?.name || 'Ты та...'}
                  </span>
                </div>
                <div className={styles.trackPlay__album}>
                  <span className={styles.trackPlay__albumLink}>
                    {currentTrack?.author || 'Баста'}
                  </span>
                </div>
              </div>

              {currentTrack && (
                <div className={styles.trackPlay__dislike}>
                  <button
                    className={`${styles.trackPlay__likeButton} ${isTrackLiked ? styles.trackPlay__likeButtonActive : ''} ${isLiking ? styles.trackPlay__likeButtonLoading : ''}`}
                    onClick={handleLikeClick}
                    disabled={isLiking}
                    title={isTrackLiked ? 'Удалить из избранного' : 'Добавить в избранное'}
                  >
                    <svg className={styles.trackPlay__likeSvg}>
                      <use xlinkHref="/img/icon/sprite.svg#icon-like"></use>
                    </svg>
                    {likesCount > 0 && (
                      <span className={styles.trackPlay__likesCount}>{likesCount}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={styles.bar__volumeBlock}>
            <div className={styles.volume__content}>
              <div className={styles.volume__image}>
                <svg className={styles.volume__svg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-volume"></use>
                </svg>
              </div>
              <div className={styles.volume__progress}>
                <input
                  className={styles.volume__progressLine}
                  type="range"
                  name="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => dispatch(handleVolumeChange(Number(e.target.value)))}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.bar__timeInfo}>
          <span className={styles.bar__timeCurrent}>
            {formatTime(currentTime)}
          </span>
          <span className={styles.bar__timeTotal}>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
