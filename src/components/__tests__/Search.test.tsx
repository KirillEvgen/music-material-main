import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Search from '../Search';
import musicReducer from '../../store/musicSlice';

// Создаем мок-стор
const createMockStore = (initialState = {}) => {
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
        tracks: [],
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
        },
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('Search Component', () => {
  it('должен отрендериться с пустым полем поиска', () => {
    renderWithProvider(<Search />);
    
    const input = screen.getByPlaceholderText('Поиск');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('должен отображать текущее значение из Redux', () => {
    renderWithProvider(<Search />, {
      filters: {
        searchQuery: 'test query',
        selectedAuthors: [],
        selectedGenres: [],
        selectedYears: [],
        sortOrder: 'default',
      },
    });
    
    const input = screen.getByPlaceholderText('Поиск');
    expect(input).toHaveValue('test query');
  });

  it('должен обновлять состояние при вводе текста', () => {
    const { store } = renderWithProvider(<Search />);
    
    const input = screen.getByPlaceholderText('Поиск');
    fireEvent.change(input, { target: { value: 'новый запрос' } });
    
    expect(store.getState().music.filters.searchQuery).toBe('новый запрос');
  });

  it('должен очищать поле при вводе пустой строки', () => {
    const { store } = renderWithProvider(<Search />, {
      filters: {
        searchQuery: 'existing',
        selectedAuthors: [],
        selectedGenres: [],
        selectedYears: [],
        sortOrder: 'default',
      },
    });
    
    const input = screen.getByPlaceholderText('Поиск');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(store.getState().music.filters.searchQuery).toBe('');
  });

  it('должен иметь корректный тип input', () => {
    renderWithProvider(<Search />);
    
    const input = screen.getByPlaceholderText('Поиск');
    expect(input).toHaveAttribute('type', 'search');
  });
});

