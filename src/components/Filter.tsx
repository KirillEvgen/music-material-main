'use client';

import { useState, useMemo, useCallback } from 'react';
import { Track } from '../types/Track';
import classNames from 'classnames';
import styles from './Filter.module.css';

interface FilterProps {
  tracks: Track[];
}

export default function Filter({ tracks }: FilterProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Убеждаемся, что tracks - это массив
  const safeTracks = useMemo(() => Array.isArray(tracks) ? tracks : [], [tracks]);

  // Получаем уникальные значения для фильтров
  const uniqueArtists = useMemo(() => Array.from(
    new Set(
      safeTracks.map((track) => track.author).filter((author) => author !== '-'),
    ),
  ), [safeTracks]);

  const uniqueGenres = useMemo(() => Array.from(
    new Set(safeTracks.flatMap((track) => track.genre)),
  ), [safeTracks]);

  const uniqueYears = useMemo(() => Array.from(
    new Set(
      safeTracks
        .map((track) => new Date(track.release_date).getFullYear())
        .sort((a, b) => b - a),
    ),
  ), [safeTracks]);

  const handleFilterClick = useCallback((filterType: string) => {
    setActiveFilter((prev) => prev === filterType ? null : filterType);
  }, []);

  return (
    <div className={styles.centerblock__filter}>
      <div className={styles.filter__title}>Искать по:</div>

      <div className={styles.filter__wrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.filter__button_active]: activeFilter === 'artist',
          })}
          onClick={() => handleFilterClick('artist')}
        >
          исполнителю
        </div>
        {activeFilter === 'artist' && (
          <div className={styles.filter__list}>
            {uniqueArtists.map((artist, index) => (
              <div key={index} className={styles.filter__item}>
                {artist}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.filter__wrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.filter__button_active]: activeFilter === 'year',
          })}
          onClick={() => handleFilterClick('year')}
        >
          году выпуска
        </div>
        {activeFilter === 'year' && (
          <div className={styles.filter__list}>
            {uniqueYears.map((year, index) => (
              <div key={index} className={styles.filter__item}>
                {year}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.filter__wrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.filter__button_active]: activeFilter === 'genre',
          })}
          onClick={() => handleFilterClick('genre')}
        >
          жанру
        </div>
        {activeFilter === 'genre' && (
          <div className={styles.filter__list}>
            {uniqueGenres.map((genre, index) => (
              <div key={index} className={styles.filter__item}>
                {genre}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
