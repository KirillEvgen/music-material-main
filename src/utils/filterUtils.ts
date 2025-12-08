import { Track } from '../types/Track';
import { FilterState, SortOrder } from '../store/musicSlice';

/**
 * Фильтрует треки по поисковому запросу (по названию и автору)
 */
export function filterBySearchQuery(tracks: Track[], query: string): Track[] {
  if (!query.trim()) return tracks;
  
  const lowerQuery = query.toLowerCase().trim();
  return tracks.filter(
    (track) =>
      track.name.toLowerCase().includes(lowerQuery) ||
      track.author.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Фильтрует треки по выбранным авторам
 */
export function filterByAuthors(tracks: Track[], authors: string[]): Track[] {
  if (authors.length === 0) return tracks;
  
  return tracks.filter((track) => authors.includes(track.author));
}

/**
 * Фильтрует треки по выбранным жанрам
 */
export function filterByGenres(tracks: Track[], genres: string[]): Track[] {
  if (genres.length === 0) return tracks;
  
  return tracks.filter((track) =>
    track.genre.some((g) => genres.includes(g))
  );
}

/**
 * Фильтрует треки по выбранным годам
 */
export function filterByYears(tracks: Track[], years: number[]): Track[] {
  if (years.length === 0) return tracks;
  
  return tracks.filter((track) => {
    const trackYear = new Date(track.release_date).getFullYear();
    return years.includes(trackYear);
  });
}

/**
 * Сортирует треки по дате выпуска
 */
export function sortByReleaseDate(tracks: Track[], order: SortOrder): Track[] {
  if (order === 'default') return tracks;
  
  return [...tracks].sort((a, b) => {
    const dateA = new Date(a.release_date).getTime();
    const dateB = new Date(b.release_date).getTime();
    
    if (order === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });
}

/**
 * Применяет все фильтры и сортировку к списку треков
 */
export function applyFilters(tracks: Track[], filters: FilterState): Track[] {
  let result = tracks;
  
  // Применяем поиск
  result = filterBySearchQuery(result, filters.searchQuery);
  
  // Применяем фильтр по авторам
  result = filterByAuthors(result, filters.selectedAuthors);
  
  // Применяем фильтр по жанрам
  result = filterByGenres(result, filters.selectedGenres);
  
  // Применяем фильтр по годам
  result = filterByYears(result, filters.selectedYears);
  
  // Применяем сортировку
  result = sortByReleaseDate(result, filters.sortOrder);
  
  return result;
}

/**
 * Получает уникальных авторов из списка треков
 */
export function getUniqueAuthors(tracks: Track[]): string[] {
  const authors = new Set<string>();
  tracks.forEach((track) => {
    if (track.author && track.author !== '-') {
      authors.add(track.author);
    }
  });
  return Array.from(authors).sort();
}

/**
 * Получает уникальные жанры из списка треков
 */
export function getUniqueGenres(tracks: Track[]): string[] {
  const genres = new Set<string>();
  tracks.forEach((track) => {
    track.genre.forEach((g) => genres.add(g));
  });
  return Array.from(genres).sort();
}

/**
 * Получает уникальные годы из списка треков (отсортированные по убыванию)
 */
export function getUniqueYears(tracks: Track[]): number[] {
  const years = new Set<number>();
  tracks.forEach((track) => {
    const year = new Date(track.release_date).getFullYear();
    if (!isNaN(year)) {
      years.add(year);
    }
  });
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Проверяет, активен ли хотя бы один фильтр
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.searchQuery.trim() !== '' ||
    filters.selectedAuthors.length > 0 ||
    filters.selectedGenres.length > 0 ||
    filters.selectedYears.length > 0 ||
    filters.sortOrder !== 'default'
  );
}

