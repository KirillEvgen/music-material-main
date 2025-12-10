'use client';

import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCurrentTime, setDuration, setIsPlaying, playNext } from '../store/musicSlice';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const durationSetRef = useRef<boolean>(false);
  const trackEndHandledRef = useRef<boolean>(false);
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.music.currentTrack);
  const isPlaying = useAppSelector((state) => state.music.isPlaying);
  const volume = useAppSelector((state) => state.music.volume);
  const isRepeatOn = useAppSelector((state) => state.music.isRepeatOn);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startPlayback = () => {
      if (!audio.src || audio.readyState === 0) {
        return;
      }

      audio
        .play()
        .then(() => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            dispatch(setDuration(audio.duration));
            durationSetRef.current = true;
          }
          intervalId = setInterval(() => {
            if (audio && !audio.paused) {
              const currentTime = audio.currentTime;
              dispatch(setCurrentTime(currentTime));
              if (!durationSetRef.current && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                dispatch(setDuration(audio.duration));
                durationSetRef.current = true;
              }
              
              if (audio.duration && audio.duration - currentTime < 0.2 && audio.duration - currentTime >= 0 && !trackEndHandledRef.current) {
                trackEndHandledRef.current = true;
                
                if (intervalId) {
                  clearInterval(intervalId);
                }
                
                if (isRepeatOn) {
                  audio.currentTime = 0;
                  dispatch(setCurrentTime(0));
                  trackEndHandledRef.current = false;
                  audio.play().catch(() => {});
                } else {
                  dispatch(setCurrentTime(0));
                  dispatch(playNext());
                }
              }
            }
          }, 100);
        })
        .catch(() => {
          dispatch(setIsPlaying(false));
        });
    };

    if (isPlaying) {
      if (audio.readyState >= 2) {
        startPlayback();
      } else {
        const handleCanPlay = () => {
          startPlayback();
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('canplaythrough', handleCanPlay);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('canplaythrough', handleCanPlay);
        
        if (audio.readyState >= 1) {
          setTimeout(() => {
            if (audio.readyState >= 2 && isPlaying) {
              startPlayback();
              audio.removeEventListener('canplay', handleCanPlay);
              audio.removeEventListener('canplaythrough', handleCanPlay);
            }
          }, 100);
        }
      }
    } else {
      audio.pause();
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, dispatch, currentTrack, isRepeatOn]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (!currentTrack.track_file) {
      dispatch(setIsPlaying(false));
      return;
    }

    durationSetRef.current = false;
    trackEndHandledRef.current = false;

    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    audio.load();
    audio.src = currentTrack.track_file;
    audio.preload = 'auto';
    audio.load();

    dispatch(setCurrentTime(0));
    dispatch(setDuration(0));
  }, [currentTrack, dispatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const isPlayingRef = { current: isPlaying };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
        durationSetRef.current = true;
      }
    };

    const handleEnded = () => {
      if (isRepeatOn) {
        audio.currentTime = 0;
        dispatch(setCurrentTime(0));
        audio.play().catch(() => {});
      } else {
        dispatch(setCurrentTime(0));
        dispatch(playNext());
      }
    };

    const handleError = () => {
      dispatch(setIsPlaying(false));
    };

    const handleCanPlay = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
        durationSetRef.current = true;
      }
      if (isPlayingRef.current && audio.src && audio.paused) {
        audio.play().catch(() => {
          dispatch(setIsPlaying(false));
        });
      }
    };
    
    isPlayingRef.current = isPlaying;
    
    const handleLoadedData = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
        durationSetRef.current = true;
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isRepeatOn, isPlaying]);

  if (!currentTrack) return null;

  return <audio ref={audioRef} preload="metadata" />;
}
