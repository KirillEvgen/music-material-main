'use client';

import { useEffect } from 'react';
import { useMusic } from '../contexts/MusicContext';
import { Track } from '../types/Track';

interface MusicInitializerProps {
  tracks: Track[];
}

export default function MusicInitializer({ tracks }: MusicInitializerProps) {
  const { setTracks } = useMusic();

  useEffect(() => {
    setTracks(tracks);
  }, [tracks, setTracks]);

  return null;
}
