import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types/Track';

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
}

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
      console.log('Redux - playNext вызван');
      if (!state.currentTrack || state.tracks.length === 0) {
        console.log('Redux - playNext: нет текущего трека или треков в списке');
        return;
      }
      
      const trackList = state.isShuffleOn && state.shuffledTracks.length > 0 
        ? state.shuffledTracks 
        : state.tracks;
      
      if (trackList.length === 0) {
        console.log('Redux - playNext: список треков пуст');
        return;
      }
      
      const currentIndex = trackList.findIndex(
        (track) => track._id === state.currentTrack!._id,
      );
      
      console.log('Redux - playNext: текущий индекс:', currentIndex, 'из', trackList.length);
      
      // Если трек не найден, начинаем с первого
      const nextIndex = currentIndex === -1 
        ? 0 
        : (currentIndex + 1) % trackList.length;
      const nextTrack = trackList[nextIndex];
      
      console.log('Redux - playNext: следующий трек:', nextTrack.name, 'индекс:', nextIndex);
      
      state.currentTrack = nextTrack;
      state.currentTime = 0;
      state.duration = 0;
      state.isPlaying = true;
      
      console.log('Redux - playNext: isPlaying установлен в true');
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
      
      // Если трек не найден, начинаем с последнего
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
        // Создаем перемешанный плейлист
        const shuffled = [...state.tracks];
        
        // Перемешиваем с помощью алгоритма Фишера-Йейтса
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Если есть текущий трек, перемещаем его в начало списка
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
      // Обновляем трек в списке tracks
      const trackIndex = state.tracks.findIndex((t) => t._id === updatedTrack._id);
      if (trackIndex !== -1) {
        state.tracks[trackIndex] = updatedTrack;
      }
      // Обновляем текущий трек, если это он
      if (state.currentTrack?._id === updatedTrack._id) {
        state.currentTrack = updatedTrack;
      }
      // Обновляем в избранных треках
      const favoriteIndex = state.favoriteTracks.findIndex((t) => t._id === updatedTrack._id);
      if (favoriteIndex !== -1) {
        // Если трек больше не в избранном, удаляем его
        if (!updatedTrack.stared_user || updatedTrack.stared_user.length === 0) {
          state.favoriteTracks.splice(favoriteIndex, 1);
        } else {
          state.favoriteTracks[favoriteIndex] = updatedTrack;
        }
      } else {
        // Если трек добавлен в избранное, добавляем его
        if (updatedTrack.stared_user && updatedTrack.stared_user.length > 0) {
          state.favoriteTracks.push(updatedTrack);
        }
      }
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
  toggleShuffle,
  toggleRepeat,
  setFavoriteTracks,
  addFavoriteTrack,
  removeFavoriteTrack,
  updateTrack,
} = musicSlice.actions;

export default musicSlice.reducer;
