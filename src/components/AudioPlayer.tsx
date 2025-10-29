'use client';

import { useEffect, useRef } from 'react';
import { useMusic } from '../contexts/MusicContext';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
  } = useMusic();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let intervalId: NodeJS.Timeout | null = null;

    if (isPlaying) {
      const tryPlay = () => {
        if (audio.readyState >= 1) {
          // HAVE_METADATA или выше
          audio
            .play()
            .then(() => {
              // Запускаем принудительное обновление времени
              intervalId = setInterval(() => {
                if (audio && !audio.paused) {
                  const currentTime = audio.currentTime;
                  setCurrentTime(currentTime);
                }
              }, 100);
            })
            .catch((error) => {
              console.error('Ошибка воспроизведения:', error);
              setIsPlaying(false);
            });
        } else {
          // Ждем события canplay
          const handleCanPlayOnce = () => {
            audio
              .play()
              .then(() => {
                // Запускаем принудительное обновление времени
                intervalId = setInterval(() => {
                  if (audio && !audio.paused) {
                    const currentTime = audio.currentTime;
                    setCurrentTime(currentTime);
                  }
                }, 100);
              })
              .catch((error) => {
                console.error('Ошибка воспроизведения:', error);
                setIsPlaying(false);
              });
            audio.removeEventListener('canplay', handleCanPlayOnce);
          };
          audio.addEventListener('canplay', handleCanPlayOnce);
        }
      };

      // Задержка для загрузки аудио
      setTimeout(tryPlay, 500);
    } else {
      audio.pause();
      // Останавливаем обновление времени при паузе
      if (intervalId) {
        clearInterval(intervalId);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, setIsPlaying, setCurrentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Очищаем предыдущий src перед установкой нового
    audio.src = '';
    audio.load();

    // Устанавливаем новый src
    console.log('Загружаем трек:', currentTrack.name, currentTrack.track_file);

    // Проверяем URL на доступность
    fetch(currentTrack.track_file, { method: 'HEAD' })
      .then((response) => {
        console.log('URL доступен, статус:', response.status);
        if (response.ok) {
          audio.src = currentTrack.track_file;
          audio.preload = 'auto';
          audio.load();
        } else {
          console.error('URL недоступен, статус:', response.status);
        }
      })
      .catch((error) => {
        console.error('Ошибка проверки URL:', error);
        // Все равно пытаемся загрузить
        audio.src = currentTrack.track_file;
        audio.preload = 'auto';
        audio.load();
      });

    // Сбрасываем время при загрузке нового трека
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrack, setCurrentTime, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setCurrentTime(0);
      // Можно добавить логику для следующего трека
    };

    const handleError = (e: Event) => {
      console.error('Ошибка загрузки аудио:', e);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      // Аудио готово к воспроизведению
    };

    const handleLoadStart = () => {
      // Начало загрузки аудио
    };

    const handleProgress = () => {
      // Прогресс загрузки
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('progress', handleProgress);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  if (!currentTrack) return null;

  return <audio ref={audioRef} preload="metadata" />;
}
