'use client';

import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCurrentTime } from '../store/musicSlice';

export default function TimeUpdater() {
  const dispatch = useAppDispatch();
  const isPlaying = useAppSelector((state) => state.music.isPlaying);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const audio = document.querySelector('audio');
      if (audio) {
        const currentTime = audio.currentTime;
        dispatch(setCurrentTime(currentTime));
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispatch]);

  return null;
}
