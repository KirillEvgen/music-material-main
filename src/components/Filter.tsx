'use client';

import { useState, useMemo, useCallback } from 'react';
import { Track } from '../types/Track';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  toggleAuthor,
  toggleGenre,
  toggleYear,
  setSortOrder,
  SortOrder,
} from '../store/musicSlice';
import {
  getUniqueAuthors,
  getUniqueGenres,
  getUniqueYears,
} from '../utils/filterUtils';
import classNames from 'classnames';
import styles from './Filter.module.css';

type FilterType = 'artist' | 'year' | 'genre' | null;

interface FilterProps {
  tracks: Track[];
}

export default function Filter({ tracks }: FilterProps) {
  const dispatch = useAppDispatch();
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  
  // Получаем состояние фильтров из Redux
  const filters = useAppSelector((state) => state.music.filters);
  const { selectedAuthors, selectedGenres, selectedYears, sortOrder } = filters;

  // Убеждаемся, что tracks - это массив
  const safeTracks = useMemo(() => Array.isArray(tracks) ? tracks : [], [tracks]);

  // Получаем уникальные значения для фильтров из чистых функций
  const uniqueArtists = useMemo(() => getUniqueAuthors(safeTracks), [safeTracks]);
  const uniqueGenres = useMemo(() => getUniqueGenres(safeTracks), [safeTracks]);
  const uniqueYears = useMemo(() => getUniqueYears(safeTracks), [safeTracks]);

  const handleFilterClick = useCallback((filterType: FilterType) => {
    setActiveFilter((prev) => prev === filterType ? null : filterType);
  }, []);

  const handleAuthorClick = useCallback((author: string) => {
    dispatch(toggleAuthor(author));
  }, [dispatch]);

  const handleGenreClick = useCallback((genre: string) => {
    dispatch(toggleGenre(genre));
  }, [dispatch]);

  const handleSortChange = useCallback((order: SortOrder) => {
    dispatch(setSortOrder(order));
  }, [dispatch]);

  const handleYearClick = useCallback((year: number) => {
    dispatch(toggleYear(year));
  }, [dispatch]);

  // Определяем количество активных фильтров для каждой категории
  const authorCount = selectedAuthors.length;
  const genreCount = selectedGenres.length;
  const yearCount = selectedYears.length;
  const isYearActive = sortOrder !== 'default' || yearCount > 0;

  return (
    <div className={styles.centerblock__filter}>
      <div className={styles.filter__title}>Искать по:</div>

      {/* Фильтр по исполнителю */}
      <div className={styles.filter__wrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.filter__button_active]: activeFilter === 'artist' || authorCount > 0,
          })}
          onClick={() => handleFilterClick('artist')}
          data-testid="filter-author"
        >
          исполнителю
          {authorCount > 0 && (
            <span className={styles.filter__count}>{authorCount}</span>
          )}
        </div>
        {activeFilter === 'artist' && (
          <div className={styles.filter__list} data-testid="filter-author-list">
            {uniqueArtists.map((artist, index) => (
              <div
                key={index}
                className={classNames(styles.filter__item, {
                  [styles.filter__item_active]: selectedAuthors.includes(artist),
                })}
                onClick={() => handleAuthorClick(artist)}
              >
                {artist}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Фильтр/сортировка по году выпуска */}
      <div className={styles.filter__wrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.filter__button_active]: activeFilter === 'year' || isYearActive,
          })}
          onClick={() => handleFilterClick('year')}
          data-testid="filter-year"
        >
          году выпуска
          {(yearCount > 0 || sortOrder !== 'default') && (
            <span className={styles.filter__count}>
              {yearCount > 0 ? yearCount : (sortOrder === 'newest' ? '↓' : '↑')}
            </span>
          )}
        </div>
        {activeFilter === 'year' && (
          <div className={styles.filter__list} data-testid="filter-year-list">
            <div className={styles.filter__sortOptions}>
              <div
                className={classNames(styles.filter__item, {
                  [styles.filter__item_active]: sortOrder === 'default',
                })}
                onClick={() => handleSortChange('default')}
              >
                По умолчанию
              </div>
              <div
                className={classNames(styles.filter__item, {
                  [styles.filter__item_active]: sortOrder === 'newest',
                })}
                onClick={() => handleSortChange('newest')}
              >
                Сначала новые
              </div>
              <div
                className={classNames(styles.filter__item, {
                  [styles.filter__item_active]: sortOrder === 'oldest',
                })}
                onClick={() => handleSortChange('oldest')}
              >
                Сначала старые
              </div>
            </div>
            <div className={styles.filter__divider}></div>
            <div className={styles.filter__yearsList}>
              {uniqueYears.map((year) => (
                <div
                  key={year}
                  className={classNames(styles.filter__item, {
                    [styles.filter__item_active]: selectedYears.includes(year),
                  })}
                  onClick={() => handleYearClick(year)}
                >
                  {year}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Фильтр по жанру */}
      <div className={styles.filter__wrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.filter__button_active]: activeFilter === 'genre' || genreCount > 0,
          })}
          onClick={() => handleFilterClick('genre')}
          data-testid="filter-genre"
        >
          жанру
          {genreCount > 0 && (
            <span className={styles.filter__count}>{genreCount}</span>
          )}
        </div>
        {activeFilter === 'genre' && (
          <div className={styles.filter__list} data-testid="filter-genre-list">
            {uniqueGenres.map((genre, index) => (
              <div
                key={index}
                className={classNames(styles.filter__item, {
                  [styles.filter__item_active]: selectedGenres.includes(genre),
                })}
                onClick={() => handleGenreClick(genre)}
              >
                {genre}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
