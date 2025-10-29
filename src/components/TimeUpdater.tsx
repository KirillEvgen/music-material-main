'use client';

import { useEffect, useRef } from 'react';
import { useMusic } from '../contexts/MusicContext';

export default function TimeUpdater() {
  const { isPlaying, setCurrentTime } = useMusic();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const audio = document.querySelector('audio');
      if (audio) {
        const currentTime = audio.currentTime;
        setCurrentTime(currentTime);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [setCurrentTime]);

  return null;
}
