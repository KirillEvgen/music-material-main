import {
  filterBySearchQuery,
  filterByAuthors,
  filterByGenres,
  filterByYears,
  sortByReleaseDate,
  applyFilters,
  getUniqueAuthors,
  getUniqueGenres,
  getUniqueYears,
  hasActiveFilters,
} from '../filterUtils';
import { Track } from '../../types/Track';
import { FilterState } from '../../store/musicSlice';

// Тестовые данные
const mockTracks: Track[] = [
  {
    _id: 1,
    name: 'Track One',
    author: 'Artist A',
    release_date: '2023-01-15',
    genre: ['Rock', 'Pop'],
    duration_in_seconds: 180,
    album: 'Album 1',
    logo: null,
    track_file: 'track1.mp3',
    stared_user: [],
  },
  {
    _id: 2,
    name: 'Track Two',
    author: 'Artist B',
    release_date: '2022-06-20',
    genre: ['Jazz'],
    duration_in_seconds: 240,
    album: 'Album 2',
    logo: null,
    track_file: 'track2.mp3',
    stared_user: [],
  },
  {
    _id: 3,
    name: 'Another Song',
    author: 'Artist A',
    release_date: '2021-03-10',
    genre: ['Rock'],
    duration_in_seconds: 200,
    album: 'Album 3',
    logo: null,
    track_file: 'track3.mp3',
    stared_user: [],
  },
  {
    _id: 4,
    name: 'Special Track',
    author: '-',
    release_date: '2020-12-01',
    genre: ['Electronic', 'Pop'],
    duration_in_seconds: 300,
    album: 'Album 4',
    logo: null,
    track_file: 'track4.mp3',
    stared_user: [],
  },
];

const defaultFilters: FilterState = {
  searchQuery: '',
  selectedAuthors: [],
  selectedGenres: [],
  selectedYears: [],
  sortOrder: 'default',
};

describe('filterUtils', () => {
  describe('filterBySearchQuery', () => {
    it('должен возвращать все треки при пустом запросе', () => {
      const result = filterBySearchQuery(mockTracks, '');
      expect(result).toHaveLength(4);
    });

    it('должен фильтровать по названию трека', () => {
      const result = filterBySearchQuery(mockTracks, 'Track');
      expect(result).toHaveLength(3);
      expect(result.map(t => t.name)).toContain('Track One');
      expect(result.map(t => t.name)).toContain('Track Two');
      expect(result.map(t => t.name)).toContain('Special Track');
    });

    it('должен фильтровать по имени исполнителя', () => {
      const result = filterBySearchQuery(mockTracks, 'Artist A');
      expect(result).toHaveLength(2);
    });

    it('должен быть регистронезависимым', () => {
      const result = filterBySearchQuery(mockTracks, 'track one');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Track One');
    });

    it('должен обрезать пробелы в запросе', () => {
      const result = filterBySearchQuery(mockTracks, '  Track  ');
      expect(result).toHaveLength(3);
    });
  });

  describe('filterByAuthors', () => {
    it('должен возвращать все треки при пустом массиве авторов', () => {
      const result = filterByAuthors(mockTracks, []);
      expect(result).toHaveLength(4);
    });

    it('должен фильтровать по одному автору', () => {
      const result = filterByAuthors(mockTracks, ['Artist A']);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.author === 'Artist A')).toBe(true);
    });

    it('должен фильтровать по нескольким авторам', () => {
      const result = filterByAuthors(mockTracks, ['Artist A', 'Artist B']);
      expect(result).toHaveLength(3);
    });
  });

  describe('filterByGenres', () => {
    it('должен возвращать все треки при пустом массиве жанров', () => {
      const result = filterByGenres(mockTracks, []);
      expect(result).toHaveLength(4);
    });

    it('должен фильтровать по одному жанру', () => {
      const result = filterByGenres(mockTracks, ['Rock']);
      expect(result).toHaveLength(2);
    });

    it('должен фильтровать по нескольким жанрам (OR логика)', () => {
      const result = filterByGenres(mockTracks, ['Jazz', 'Electronic']);
      expect(result).toHaveLength(2);
    });

    it('должен находить треки с несколькими жанрами', () => {
      const result = filterByGenres(mockTracks, ['Pop']);
      expect(result).toHaveLength(2);
      expect(result.map(t => t._id)).toContain(1);
      expect(result.map(t => t._id)).toContain(4);
    });
  });

  describe('filterByYears', () => {
    it('должен возвращать все треки при пустом массиве годов', () => {
      const result = filterByYears(mockTracks, []);
      expect(result).toHaveLength(4);
    });

    it('должен фильтровать по одному году', () => {
      const result = filterByYears(mockTracks, [2023]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Track One');
    });

    it('должен фильтровать по нескольким годам', () => {
      const result = filterByYears(mockTracks, [2022, 2023]);
      expect(result).toHaveLength(2);
    });

    it('должен возвращать пустой массив если год не найден', () => {
      const result = filterByYears(mockTracks, [1999]);
      expect(result).toHaveLength(0);
    });
  });

  describe('sortByReleaseDate', () => {
    it('должен возвращать треки без изменений при sortOrder = default', () => {
      const result = sortByReleaseDate(mockTracks, 'default');
      expect(result).toEqual(mockTracks);
    });

    it('должен сортировать от новых к старым', () => {
      const result = sortByReleaseDate(mockTracks, 'newest');
      expect(result[0].name).toBe('Track One'); // 2023
      expect(result[1].name).toBe('Track Two'); // 2022
      expect(result[2].name).toBe('Another Song'); // 2021
      expect(result[3].name).toBe('Special Track'); // 2020
    });

    it('должен сортировать от старых к новым', () => {
      const result = sortByReleaseDate(mockTracks, 'oldest');
      expect(result[0].name).toBe('Special Track'); // 2020
      expect(result[3].name).toBe('Track One'); // 2023
    });

    it('не должен изменять оригинальный массив', () => {
      const original = [...mockTracks];
      sortByReleaseDate(mockTracks, 'newest');
      expect(mockTracks).toEqual(original);
    });
  });

  describe('applyFilters', () => {
    it('должен применять все фильтры последовательно', () => {
      const filters: FilterState = {
        searchQuery: 'Track',
        selectedAuthors: ['Artist A'],
        selectedGenres: [],
        selectedYears: [],
        sortOrder: 'default',
      };
      const result = applyFilters(mockTracks, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Track One');
    });

    it('должен применять поиск и сортировку вместе', () => {
      const filters: FilterState = {
        searchQuery: '',
        selectedAuthors: [],
        selectedGenres: ['Rock'],
        selectedYears: [],
        sortOrder: 'oldest',
      };
      const result = applyFilters(mockTracks, filters);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Another Song'); // 2021
      expect(result[1].name).toBe('Track One'); // 2023
    });

    it('должен возвращать пустой массив если ничего не найдено', () => {
      const filters: FilterState = {
        searchQuery: 'Nonexistent',
        selectedAuthors: [],
        selectedGenres: [],
        selectedYears: [],
        sortOrder: 'default',
      };
      const result = applyFilters(mockTracks, filters);
      expect(result).toHaveLength(0);
    });

    it('должен применять фильтр по годам', () => {
      const filters: FilterState = {
        searchQuery: '',
        selectedAuthors: [],
        selectedGenres: [],
        selectedYears: [2023, 2022],
        sortOrder: 'default',
      };
      const result = applyFilters(mockTracks, filters);
      expect(result).toHaveLength(2);
      expect(result.map(t => t.name)).toContain('Track One');
      expect(result.map(t => t.name)).toContain('Track Two');
    });

    it('должен комбинировать фильтр по годам с другими фильтрами', () => {
      const filters: FilterState = {
        searchQuery: '',
        selectedAuthors: ['Artist A'],
        selectedGenres: [],
        selectedYears: [2023],
        sortOrder: 'default',
      };
      const result = applyFilters(mockTracks, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Track One');
    });
  });

  describe('getUniqueAuthors', () => {
    it('должен возвращать уникальных авторов', () => {
      const result = getUniqueAuthors(mockTracks);
      expect(result).toHaveLength(2);
      expect(result).toContain('Artist A');
      expect(result).toContain('Artist B');
    });

    it('должен исключать авторов с "-"', () => {
      const result = getUniqueAuthors(mockTracks);
      expect(result).not.toContain('-');
    });

    it('должен возвращать отсортированный массив', () => {
      const result = getUniqueAuthors(mockTracks);
      expect(result).toEqual(['Artist A', 'Artist B']);
    });

    it('должен возвращать пустой массив для пустого списка треков', () => {
      const result = getUniqueAuthors([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getUniqueGenres', () => {
    it('должен возвращать уникальные жанры', () => {
      const result = getUniqueGenres(mockTracks);
      expect(result).toHaveLength(4);
      expect(result).toContain('Rock');
      expect(result).toContain('Pop');
      expect(result).toContain('Jazz');
      expect(result).toContain('Electronic');
    });

    it('должен возвращать отсортированный массив', () => {
      const result = getUniqueGenres(mockTracks);
      expect(result).toEqual(['Electronic', 'Jazz', 'Pop', 'Rock']);
    });
  });

  describe('getUniqueYears', () => {
    it('должен возвращать уникальные годы', () => {
      const result = getUniqueYears(mockTracks);
      expect(result).toHaveLength(4);
      expect(result).toContain(2020);
      expect(result).toContain(2021);
      expect(result).toContain(2022);
      expect(result).toContain(2023);
    });

    it('должен возвращать годы отсортированные по убыванию', () => {
      const result = getUniqueYears(mockTracks);
      expect(result).toEqual([2023, 2022, 2021, 2020]);
    });
  });

  describe('hasActiveFilters', () => {
    it('должен возвращать false для дефолтных фильтров', () => {
      const result = hasActiveFilters(defaultFilters);
      expect(result).toBe(false);
    });

    it('должен возвращать true при активном поиске', () => {
      const filters = { ...defaultFilters, searchQuery: 'test' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('должен возвращать true при выбранных авторах', () => {
      const filters = { ...defaultFilters, selectedAuthors: ['Artist A'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('должен возвращать true при выбранных жанрах', () => {
      const filters = { ...defaultFilters, selectedGenres: ['Rock'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('должен возвращать true при активной сортировке', () => {
      const filters = { ...defaultFilters, sortOrder: 'newest' as const };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('должен возвращать true при выбранных годах', () => {
      const filters = { ...defaultFilters, selectedYears: [2023] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('должен игнорировать пустые строки с пробелами', () => {
      const filters = { ...defaultFilters, searchQuery: '   ' };
      expect(hasActiveFilters(filters)).toBe(false);
    });
  });
});

