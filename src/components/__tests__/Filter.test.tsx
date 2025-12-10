import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Filter from '../Filter';
import musicReducer from '../../store/musicSlice';
import { Track } from '../../types/Track';

// Тестовые треки
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
    author: 'Artist C',
    release_date: '2021-03-10',
    genre: ['Electronic'],
    duration_in_seconds: 200,
    album: 'Album 3',
    logo: null,
    track_file: 'track3.mp3',
    stared_user: [],
  },
];

// Создаем мок-стор
const createMockStore = (initialFilters = {}) => {
  return configureStore({
    reducer: {
      music: musicReducer,
    },
    preloadedState: {
      music: {
        currentTrack: null,
        isPlaying: false,
        volume: 50,
        currentTime: 0,
        duration: 0,
        tracks: mockTracks,
        isShuffleOn: false,
        isRepeatOn: false,
        shuffledTracks: [],
        favoriteTracks: [],
        likedTrackIds: [],
        filters: {
          searchQuery: '',
          selectedAuthors: [],
          selectedGenres: [],
          selectedYears: [],
          sortOrder: 'default' as const,
          ...initialFilters,
        },
      },
    },
  });
};

const renderWithProvider = (tracks: Track[] = mockTracks, initialFilters = {}) => {
  const store = createMockStore(initialFilters);
  return {
    ...render(
      <Provider store={store}>
        <Filter tracks={tracks} />
      </Provider>
    ),
    store,
  };
};

describe('Filter Component', () => {
  describe('Рендеринг', () => {
    it('должен отрендерить все кнопки фильтров', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('filter-author')).toBeInTheDocument();
      expect(screen.getByTestId('filter-year')).toBeInTheDocument();
      expect(screen.getByTestId('filter-genre')).toBeInTheDocument();
    });

    it('должен показывать текст "Искать по:"', () => {
      renderWithProvider();
      
      expect(screen.getByText('Искать по:')).toBeInTheDocument();
    });
  });

  describe('Фильтр по исполнителю', () => {
    it('должен показывать список авторов при клике', () => {
      renderWithProvider();
      
      const authorButton = screen.getByTestId('filter-author');
      fireEvent.click(authorButton);
      
      expect(screen.getByTestId('filter-author-list')).toBeInTheDocument();
      expect(screen.getByText('Artist A')).toBeInTheDocument();
      expect(screen.getByText('Artist B')).toBeInTheDocument();
      expect(screen.getByText('Artist C')).toBeInTheDocument();
    });

    it('должен скрывать список при повторном клике', () => {
      renderWithProvider();
      
      const authorButton = screen.getByTestId('filter-author');
      fireEvent.click(authorButton);
      expect(screen.getByTestId('filter-author-list')).toBeInTheDocument();
      
      fireEvent.click(authorButton);
      expect(screen.queryByTestId('filter-author-list')).not.toBeInTheDocument();
    });

    it('должен добавлять автора в выбранные при клике', () => {
      const { store } = renderWithProvider();
      
      fireEvent.click(screen.getByTestId('filter-author'));
      fireEvent.click(screen.getByText('Artist A'));
      
      expect(store.getState().music.filters.selectedAuthors).toContain('Artist A');
    });

    it('должен убирать автора из выбранных при повторном клике', () => {
      const { store } = renderWithProvider(mockTracks, {
        selectedAuthors: ['Artist A'],
      });
      
      fireEvent.click(screen.getByTestId('filter-author'));
      fireEvent.click(screen.getByText('Artist A'));
      
      expect(store.getState().music.filters.selectedAuthors).not.toContain('Artist A');
    });

    it('должен показывать счетчик выбранных авторов', () => {
      renderWithProvider(mockTracks, {
        selectedAuthors: ['Artist A', 'Artist B'],
      });
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Фильтр по жанру', () => {
    it('должен показывать список жанров при клике', () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByTestId('filter-genre'));
      
      expect(screen.getByTestId('filter-genre-list')).toBeInTheDocument();
      expect(screen.getByText('Rock')).toBeInTheDocument();
      expect(screen.getByText('Pop')).toBeInTheDocument();
      expect(screen.getByText('Jazz')).toBeInTheDocument();
      expect(screen.getByText('Electronic')).toBeInTheDocument();
    });

    it('должен добавлять жанр в выбранные при клике', () => {
      const { store } = renderWithProvider();
      
      fireEvent.click(screen.getByTestId('filter-genre'));
      fireEvent.click(screen.getByText('Rock'));
      
      expect(store.getState().music.filters.selectedGenres).toContain('Rock');
    });
  });

  describe('Сортировка по году', () => {
    it('должен показывать опции сортировки при клике', () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByTestId('filter-year'));
      
      expect(screen.getByTestId('filter-year-list')).toBeInTheDocument();
      expect(screen.getByText('По умолчанию')).toBeInTheDocument();
      expect(screen.getByText('Сначала новые')).toBeInTheDocument();
      expect(screen.getByText('Сначала старые')).toBeInTheDocument();
    });

    it('должен устанавливать сортировку "сначала новые"', () => {
      const { store } = renderWithProvider();
      
      fireEvent.click(screen.getByTestId('filter-year'));
      fireEvent.click(screen.getByText('Сначала новые'));
      
      expect(store.getState().music.filters.sortOrder).toBe('newest');
    });

    it('должен устанавливать сортировку "сначала старые"', () => {
      const { store } = renderWithProvider();
      
      fireEvent.click(screen.getByTestId('filter-year'));
      fireEvent.click(screen.getByText('Сначала старые'));
      
      expect(store.getState().music.filters.sortOrder).toBe('oldest');
    });

    it('должен показывать индикатор активной сортировки', () => {
      renderWithProvider(mockTracks, {
        sortOrder: 'newest',
      });
      
      expect(screen.getByText('↓')).toBeInTheDocument();
    });
  });

  describe('Переключение фильтров', () => {
    it('должен закрывать предыдущий фильтр при открытии нового', () => {
      renderWithProvider();
      
      // Открываем фильтр по автору
      fireEvent.click(screen.getByTestId('filter-author'));
      expect(screen.getByTestId('filter-author-list')).toBeInTheDocument();
      
      // Открываем фильтр по жанру
      fireEvent.click(screen.getByTestId('filter-genre'));
      expect(screen.queryByTestId('filter-author-list')).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-genre-list')).toBeInTheDocument();
    });
  });

  describe('Пустой список треков', () => {
    it('должен корректно работать с пустым списком треков', () => {
      renderWithProvider([]);
      
      fireEvent.click(screen.getByTestId('filter-author'));
      
      // Список должен быть пустым
      const list = screen.getByTestId('filter-author-list');
      expect(list.children.length).toBe(0);
    });
  });
});


