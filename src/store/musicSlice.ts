import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types/Track';
import { logout } from './authSlice';

// Типы для фильтров
export type SortOrder = 'default' | 'newest' | 'oldest';

export interface FilterState {
  searchQuery: string;
  selectedAuthors: string[];
  selectedGenres: string[];
  selectedYears: number[];
  sortOrder: SortOrder;
}

interface MusicState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  tracks: Track[];
  isShuffleOn: boolean;
  isRepeatOn: boolean;
  shuffledTracks: Track[];
  favoriteTracks: Track[];
  likedTrackIds: number[];
  filters: FilterState;
}

const initialFilterState: FilterState = {
  searchQuery: '',
  selectedAuthors: [],
  selectedGenres: [],
  selectedYears: [],
  sortOrder: 'default',
};

const initialState: MusicState = {
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
  filters: initialFilterState,
};

const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track | null>) => {
      state.currentTrack = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setTracks: (state, action: PayloadAction<Track[]>) => {
      state.tracks = action.payload;
    },
    playTrack: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
      state.currentTime = 0;
      state.duration = 0;
      state.isPlaying = true;
    },
    pauseTrack: (state) => {
      state.isPlaying = false;
    },
    togglePlayPause: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    handleVolumeChange: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    playNext: (state) => {
      if (!state.currentTrack || state.tracks.length === 0) return;
      
      const trackList = state.isShuffleOn && state.shuffledTracks.length > 0 
        ? state.shuffledTracks 
        : state.tracks;
      
      if (trackList.length === 0) return;
      
      const currentIndex = trackList.findIndex(
        (track) => track._id === state.currentTrack!._id,
      );
      
      const nextIndex = currentIndex === -1 
        ? 0 
        : (currentIndex + 1) % trackList.length;
      const nextTrack = trackList[nextIndex];
      
      state.currentTrack = nextTrack;
      state.currentTime = 0;
      state.duration = 0;
      state.isPlaying = true;
    },
    playPrevious: (state) => {
      if (!state.currentTrack || state.tracks.length === 0) return;
      
      const trackList = state.isShuffleOn && state.shuffledTracks.length > 0 
        ? state.shuffledTracks 
        : state.tracks;
      
      if (trackList.length === 0) return;
      
      const currentIndex = trackList.findIndex(
        (track) => track._id === state.currentTrack!._id,
      );
      
      const prevIndex = currentIndex === -1 
        ? trackList.length - 1 
        : (currentIndex === 0 ? trackList.length - 1 : currentIndex - 1);
      const prevTrack = trackList[prevIndex];
      
      state.currentTrack = prevTrack;
      state.currentTime = 0;
      state.duration = 0;
      state.isPlaying = true;
    },
    toggleShuffle: (state) => {
      state.isShuffleOn = !state.isShuffleOn;
      
      if (state.isShuffleOn) {
        const shuffled = [...state.tracks];
        
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        if (state.currentTrack) {
          const currentIndex = shuffled.findIndex(
            (track) => track._id === state.currentTrack!._id,
          );
          if (currentIndex > 0) {
            const currentTrack = shuffled[currentIndex];
            shuffled.splice(currentIndex, 1);
            shuffled.unshift(currentTrack);
          }
        }
        
        state.shuffledTracks = shuffled;
      } else {
        state.shuffledTracks = [];
      }
    },
    toggleRepeat: (state) => {
      state.isRepeatOn = !state.isRepeatOn;
    },
    setFavoriteTracks: (state, action: PayloadAction<Track[]>) => {
      state.favoriteTracks = action.payload;
      state.likedTrackIds = action.payload.map((track) => track._id);
    },
    addFavoriteTrack: (state, action: PayloadAction<Track>) => {
      const track = action.payload;
      if (!state.favoriteTracks.find((t) => t._id === track._id)) {
        state.favoriteTracks.push(track);
      }
    },
    removeFavoriteTrack: (state, action: PayloadAction<number>) => {
      state.favoriteTracks = state.favoriteTracks.filter((t) => t._id !== action.payload);
    },
    updateTrack: (state, action: PayloadAction<Track>) => {
      const updatedTrack = action.payload;
      
      const trackIndex = state.tracks.findIndex((t) => t._id === updatedTrack._id);
      if (trackIndex !== -1) {
        const originalTrack = state.tracks[trackIndex];
        state.tracks[trackIndex] = {
          ...originalTrack,
          ...updatedTrack,
          track_file: updatedTrack.track_file || originalTrack.track_file,
        };
      }
      
      if (state.currentTrack?._id === updatedTrack._id) {
        const originalTrack = state.currentTrack;
        state.currentTrack = {
          ...originalTrack,
          ...updatedTrack,
          track_file: updatedTrack.track_file || originalTrack.track_file,
        };
      }
      
      const favoriteIndex = state.favoriteTracks.findIndex((t) => t._id === updatedTrack._id);
      if (favoriteIndex !== -1) {
        if (!updatedTrack.stared_user || updatedTrack.stared_user.length === 0) {
          state.favoriteTracks.splice(favoriteIndex, 1);
        } else {
          const originalTrack = state.favoriteTracks[favoriteIndex];
          state.favoriteTracks[favoriteIndex] = {
            ...originalTrack,
            ...updatedTrack,
            track_file: updatedTrack.track_file || originalTrack.track_file,
          };
        }
      } else {
        if (updatedTrack.stared_user && updatedTrack.stared_user.length > 0) {
          state.favoriteTracks.push(updatedTrack);
        }
      }
      
      const shuffledIndex = state.shuffledTracks.findIndex((t) => t._id === updatedTrack._id);
      if (shuffledIndex !== -1) {
        const originalTrack = state.shuffledTracks[shuffledIndex];
        state.shuffledTracks[shuffledIndex] = {
          ...originalTrack,
          ...updatedTrack,
          track_file: updatedTrack.track_file || originalTrack.track_file,
        };
      }
    },
    setLikedTrackIds: (state, action: PayloadAction<number[]>) => {
      state.likedTrackIds = action.payload;
    },
    // Редьюсеры для фильтров и поиска
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },
    toggleAuthor: (state, action: PayloadAction<string>) => {
      const author = action.payload;
      const index = state.filters.selectedAuthors.indexOf(author);
      if (index === -1) {
        state.filters.selectedAuthors.push(author);
      } else {
        state.filters.selectedAuthors.splice(index, 1);
      }
    },
    toggleGenre: (state, action: PayloadAction<string>) => {
      const genre = action.payload;
      const index = state.filters.selectedGenres.indexOf(genre);
      if (index === -1) {
        state.filters.selectedGenres.push(genre);
      } else {
        state.filters.selectedGenres.splice(index, 1);
      }
    },
    toggleYear: (state, action: PayloadAction<number>) => {
      const year = action.payload;
      const index = state.filters.selectedYears.indexOf(year);
      if (index === -1) {
        state.filters.selectedYears.push(year);
      } else {
        state.filters.selectedYears.splice(index, 1);
      }
    },
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.filters.sortOrder = action.payload;
    },
    resetFilters: (state) => {
      state.filters = initialFilterState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.likedTrackIds = [];
      state.favoriteTracks = [];
    });
  },
});

export const {
  setCurrentTrack,
  setIsPlaying,
  setVolume,
  setCurrentTime,
  setDuration,
  setTracks,
  playTrack,
  pauseTrack,
  togglePlayPause,
  handleVolumeChange,
  playNext,
  playPrevious,
  toggleShuffle,
  toggleRepeat,
  setFavoriteTracks,
  addFavoriteTrack,
  removeFavoriteTrack,
  updateTrack,
  setLikedTrackIds,
  setSearchQuery,
  toggleAuthor,
  toggleGenre,
  toggleYear,
  setSortOrder,
  resetFilters,
} = musicSlice.actions;

export default musicSlice.reducer;
