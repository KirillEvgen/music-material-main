'use client';

import { Track } from '../types/Track';
import { useMusic } from '../contexts/MusicContext';
import styles from './TrackList.module.css';

interface TrackListProps {
  tracks: Track[];
}

export default function TrackList({ tracks }: TrackListProps) {
  const { playTrack } = useMusic();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (track: Track) => {
    playTrack(track);
  };

  return (
    <div className={styles.centerblock__content}>
      <div className={styles.content__title}>
        <div className={`${styles.playlistTitle__col} ${styles.col01}`}>
          Трек
        </div>
        <div className={`${styles.playlistTitle__col} ${styles.col02}`}>
          Исполнитель
        </div>
        <div className={`${styles.playlistTitle__col} ${styles.col03}`}>
          Альбом
        </div>
        <div className={`${styles.playlistTitle__col} ${styles.col04}`}>
          <svg className={styles.playlistTitle__svg}>
            <use xlinkHref="/img/icon/sprite.svg#icon-watch"></use>
          </svg>
        </div>
      </div>
      <div className={styles.content__playlist}>
        {tracks.map((track) => (
          <div key={track._id} className={styles.playlist__item}>
            <div className={styles.playlist__track}>
              <div className={styles.track__title}>
                <div className={styles.track__titleImage}>
                  <svg className={styles.track__titleSvg}>
                    <use xlinkHref="/img/icon/sprite.svg#icon-note"></use>
                  </svg>
                </div>
                <div className={styles.track__titleText}>
                  <button
                    className={styles.track__titleLink}
                    onClick={() => handlePlay(track)}
                  >
                    {track.name}
                  </button>
                </div>
              </div>
              <div className={styles.track__author}>
                <span className={styles.track__authorLink}>{track.author}</span>
              </div>
              <div className={styles.track__album}>
                <span className={styles.track__albumLink}>{track.album}</span>
              </div>
              <div className={styles.track__time}>
                <svg className={styles.track__timeSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-like"></use>
                </svg>
                <span className={styles.track__timeText}>
                  {formatTime(track.duration_in_seconds)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
