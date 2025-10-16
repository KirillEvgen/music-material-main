'use client';

import { useEffect, useRef } from 'react';
import { useMusic } from '../contexts/MusicContext';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTrack, isPlaying, volume } = useMusic();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.track_file;
    audio.load();
  }, [currentTrack]);

  if (!currentTrack) return null;

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      onEnded={() => {
        // Можно добавить логику для следующего трека
      }}
    />
  );
}
