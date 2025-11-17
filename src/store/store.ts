import { configureStore } from '@reduxjs/toolkit';
import musicReducer from './musicSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    music: musicReducer,
    auth: authReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
