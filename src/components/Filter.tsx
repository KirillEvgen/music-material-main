'use client';

import { useState } from 'react';
import { Track } from '../types/Track';
import classNames from 'classnames';
import styles from './Filter.module.css';

interface FilterProps {
  tracks: Track[];
}

export default function Filter({ tracks }: FilterProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Получаем уникальные значения для фильтров
  const uniqueArtists = Array.from(
    new Set(
      tracks.map((track) => track.author).filter((author) => author !== '-'),
    ),
  );
  const uniqueGenres = Array.from(
    new Set(tracks.flatMap((track) => track.genre)),
  );
  const uniqueYears = Array.from(
    new Set(
      tracks
        .map((track) => new Date(track.release_date).getFullYear())
        .sort((a, b) => b - a),
    ),
  );

  const handleFilterClick = (filterType: string) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  const getFilterData = (filterType: string) => {
    switch (filterType) {
      case 'artist':
        return uniqueArtists;
      case 'genre':
        return uniqueGenres;
      case 'year':
        return uniqueYears;
      default:
        return [];
    }
  };

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
