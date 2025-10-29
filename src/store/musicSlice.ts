import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types/Track';

interface MusicState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  tracks: Track[];
}

const initialState: MusicState = {
  currentTrack: null,
  isPlaying: false,
  volume: 50,
  currentTime: 0,
  duration: 0,
  tracks: [],
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
      console.log('Redux - setTracks вызван с треками:', action.payload.length);
      state.tracks = action.payload;
    },
    playTrack: (state, action: PayloadAction<Track>) => {
      console.log('Redux - playTrack вызван с треком:', action.payload.name);
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
      
      const currentIndex = state.tracks.findIndex(
        (track) => track._id === state.currentTrack!._id,
      );
      const nextIndex = (currentIndex + 1) % state.tracks.length;
      const nextTrack = state.tracks[nextIndex];
      
      state.currentTrack = nextTrack;
      state.currentTime = 0;
      state.duration = 0;
      state.isPlaying = true;
    },
    playPrevious: (state) => {
      if (!state.currentTrack || state.tracks.length === 0) return;
      
      const currentIndex = state.tracks.findIndex(
        (track) => track._id === state.currentTrack!._id,
      );
      const prevIndex = currentIndex === 0 ? state.tracks.length - 1 : currentIndex - 1;
      const prevTrack = state.tracks[prevIndex];
      
      state.currentTrack = prevTrack;
      state.currentTime = 0;
      state.duration = 0;
      state.isPlaying = true;
    },
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
} = musicSlice.actions;

export default musicSlice.reducer;
