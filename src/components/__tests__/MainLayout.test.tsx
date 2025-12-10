import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import musicReducer from '../../store/musicSlice';
import authReducer from '../../store/authSlice';
import { Track } from '../../types/Track';

// Мокаем next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Импортируем MainLayout после мока
import MainLayout from '../MainLayout';

const mockTracks: Track[] = [
  {
    _id: 1,
    name: 'Track One',
    author: 'Artist A',
    release_date: '2023-01-15',
    genre: ['Rock'],
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
];

const createMockStore = (filtersOverride = {}) => {
  return configureStore({
    reducer: {
      music: musicReducer,
      auth: authReducer,
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
          ...filtersOverride,
        },
      },
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
      },
    },
  });
};

describe('MainLayout Component', () => {
  describe('Сообщение "Нет подходящих треков"', () => {
    it('должен показывать "Нет подходящих треков" когда фильтры активны и ничего не найдено', () => {
      const store = createMockStore({
        searchQuery: 'несуществующий трек xyz123',
      });

      render(
        <Provider store={store}>
          <MainLayout title="Треки" tracks={mockTracks} />
        </Provider>
      );

      expect(screen.getByTestId('no-results-message')).toBeInTheDocument();
      expect(screen.getByText('Нет подходящих треков')).toBeInTheDocument();
    });

    it('должен показывать "Нет подходящих треков" при фильтрации по автору без результатов', () => {
      const store = createMockStore({
        selectedAuthors: ['Несуществующий Автор'],
      });

      render(
        <Provider store={store}>
          <MainLayout title="Треки" tracks={mockTracks} />
        </Provider>
      );

      expect(screen.getByTestId('no-results-message')).toBeInTheDocument();
    });

    it('должен показывать "Нет подходящих треков" при фильтрации по году без результатов', () => {
      const store = createMockStore({
        selectedYears: [1999],
      });

      render(
        <Provider store={store}>
          <MainLayout title="Треки" tracks={mockTracks} />
        </Provider>
      );

      expect(screen.getByTestId('no-results-message')).toBeInTheDocument();
    });

    it('НЕ должен показывать сообщение когда треки найдены', () => {
      const store = createMockStore({
        searchQuery: 'Track',
      });

      render(
        <Provider store={store}>
          <MainLayout title="Треки" tracks={mockTracks} />
        </Provider>
      );

      expect(screen.queryByTestId('no-results-message')).not.toBeInTheDocument();
    });

    it('НЕ должен показывать сообщение когда фильтры не активны', () => {
      const store = createMockStore();

      render(
        <Provider store={store}>
          <MainLayout title="Треки" tracks={mockTracks} />
        </Provider>
      );

      expect(screen.queryByTestId('no-results-message')).not.toBeInTheDocument();
    });

    it('должен показывать "Треки не найдены" когда изначально нет треков (без фильтров)', () => {
      const store = createMockStore();

      render(
        <Provider store={store}>
          <MainLayout title="Треки" tracks={[]} />
        </Provider>
      );

      expect(screen.getByText('Треки не найдены')).toBeInTheDocument();
      expect(screen.queryByTestId('no-results-message')).not.toBeInTheDocument();
    });
  });
});


