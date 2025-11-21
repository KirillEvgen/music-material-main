'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setTracks } from '../store/musicSlice';
import { Track } from '../types/Track';

interface MusicInitializerProps {
  tracks: Track[];
}

export default function MusicInitializer({ tracks }: MusicInitializerProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Убеждаемся, что tracks - это массив
    const safeTracks = Array.isArray(tracks) ? tracks : [];
    dispatch(setTracks(safeTracks));
  }, [tracks, dispatch]);

  return null;
}
