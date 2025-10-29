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
    dispatch(setTracks(tracks));
  }, [tracks, dispatch]);

  return null;
}
