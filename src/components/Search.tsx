'use client';

import { useCallback, ChangeEvent } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSearchQuery } from '../store/musicSlice';
import styles from './Search.module.css';

export default function Search() {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector((state) => state.music.filters.searchQuery);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchQuery(e.target.value));
    },
    [dispatch]
  );

  return (
    <div className={styles.centerblock__search}>
      <svg className={styles.search__svg}>
        <use xlinkHref="/img/icon/sprite.svg#icon-search"></use>
      </svg>
      <input
        className={styles.search__text}
        type="search"
        placeholder="Поиск"
        name="search"
        value={searchQuery}
        onChange={handleSearchChange}
      />
    </div>
  );
}
