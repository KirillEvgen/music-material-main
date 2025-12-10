import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TrackList from '../TrackList';
import musicReducer from '../../store/musicSlice';
import authReducer from '../../store/authSlice';
import { Track } from '../../types/Track';

// Тестовые треки
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
    stared_user: [1],
  },
];

// Создаем мок-стор
const createMockStore = () => {
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
        likedTrackIds: [2],
        filters: {
          searchQuery: '',
          selectedAuthors: [],
          selectedGenres: [],
          selectedYears: [],
          sortOrder: 'default' as const,
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

const renderWithProvider = (tracks: Track[] = mockTracks) => {
  const store = createMockStore();
  return {
    ...render(
      <Provider store={store}>
        <TrackList tracks={tracks} />
      </Provider>
    ),
    store,
  };
};

describe('TrackList Component', () => {
  describe('Рендеринг', () => {
    it('должен отрендерить заголовки колонок', () => {
      renderWithProvider();
      
      expect(screen.getByText('Трек')).toBeInTheDocument();
      expect(screen.getByText('Исполнитель')).toBeInTheDocument();
      expect(screen.getByText('Альбом')).toBeInTheDocument();
    });

    it('должен отрендерить все треки из списка', () => {
      renderWithProvider();
      
      expect(screen.getByText('Track One')).toBeInTheDocument();
      expect(screen.getByText('Track Two')).toBeInTheDocument();
      expect(screen.getByText('Artist A')).toBeInTheDocument();
      expect(screen.getByText('Artist B')).toBeInTheDocument();
    });

    it('должен корректно отображать пустой список', () => {
      renderWithProvider([]);
      
      // Заголовки должны быть
      expect(screen.getByText('Трек')).toBeInTheDocument();
      
      // Треков не должно быть
      expect(screen.queryByText('Track One')).not.toBeInTheDocument();
    });
  });

  describe('Отображение информации о треках', () => {
    it('должен показывать название альбома', () => {
      renderWithProvider();
      
      expect(screen.getByText('Album 1')).toBeInTheDocument();
      expect(screen.getByText('Album 2')).toBeInTheDocument();
    });
  });

  describe('Работа с невалидными данными', () => {
    it('должен обрабатывать undefined как пустой массив', () => {
      // @ts-ignore - намеренно передаем undefined для теста
      const { container } = renderWithProvider(undefined);
      
      // Компонент должен отрендериться без ошибок
      expect(container).toBeInTheDocument();
    });

    it('должен обрабатывать null как пустой массив', () => {
      // @ts-ignore - намеренно передаем null для теста
      const { container } = renderWithProvider(null);
      
      // Компонент должен отрендериться без ошибок
      expect(container).toBeInTheDocument();
    });
  });
});

