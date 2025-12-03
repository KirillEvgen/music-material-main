'use client';

import { useMemo } from 'react';
import { Track } from '../types/Track';
import TrackItem from './TrackItem';
import styles from './TrackList.module.css';

interface TrackListProps {
  tracks: Track[];
  onTrackUpdate?: (updatedTrack: Track) => void;
}

export default function TrackList({ tracks, onTrackUpdate }: TrackListProps) {
  // Убеждаемся, что tracks - это массив
  const safeTracks = useMemo(() => Array.isArray(tracks) ? tracks : [], [tracks]);

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
        {safeTracks.map((track) => (
          <TrackItem
            key={track._id}
            track={track}
            onTrackUpdate={onTrackUpdate}
          />
        ))}
      </div>
    </div>
  );
}
