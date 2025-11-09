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
    if (!audio) return;

    console.log('useEffect [isPlaying, currentTrack] triggered. isPlaying:', isPlaying, 'track:', currentTrack?.name);

    let intervalId: NodeJS.Timeout | null = null;

    if (isPlaying) {
      const tryPlay = () => {
        if (audio.readyState >= 1) {
          // HAVE_METADATA или выше
          audio
            .play()
            .then(() => {
              // Проверяем duration после начала воспроизведения
              if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                dispatch(setDuration(audio.duration));
                durationSetRef.current = true;
              }
              // Запускаем принудительное обновление времени
              intervalId = setInterval(() => {
                if (audio && !audio.paused) {
                  const currentTime = audio.currentTime;
                  dispatch(setCurrentTime(currentTime));
                  // Проверяем duration только если еще не установлена
                  if (!durationSetRef.current && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                    dispatch(setDuration(audio.duration));
                    durationSetRef.current = true;
                  }
                  
                  // Резервный механизм: если трек закончился (осталось меньше 0.2 сек)
                  if (audio.duration && audio.duration - currentTime < 0.2 && audio.duration - currentTime >= 0 && !trackEndHandledRef.current) {
                    console.log('Трек почти закончился! Осталось:', audio.duration - currentTime, 'сек');
                    console.log('Вызываем переключение трека через резервный механизм');
                    
                    // Отмечаем, что обработали конец трека
                    trackEndHandledRef.current = true;
                    
                    // Останавливаем интервал
                    if (intervalId) {
                      clearInterval(intervalId);
                    }
                    
                    // Вызываем логику переключения
                    if (isRepeatOn) {
                      console.log('Повторяем трек (резервный механизм)');
                      audio.currentTime = 0;
                      dispatch(setCurrentTime(0));
                      trackEndHandledRef.current = false;
                      audio.play().catch(console.error);
                    } else {
                      console.log('Переключаемся на следующий трек (резервный механизм)');
                      dispatch(setCurrentTime(0));
                      dispatch(playNext());
                    }
                  }
                }
              }, 100);
            })
            .catch((error) => {
              console.error('Ошибка воспроизведения:', error);
              dispatch(setIsPlaying(false));
            });
        } else {
          // Ждем события canplay
          const handleCanPlayOnce = () => {
            audio
              .play()
              .then(() => {
                // Проверяем duration после начала воспроизведения
                if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                  dispatch(setDuration(audio.duration));
                  durationSetRef.current = true;
                }
                // Запускаем принудительное обновление времени
                intervalId = setInterval(() => {
                  if (audio && !audio.paused) {
                    const currentTime = audio.currentTime;
                    dispatch(setCurrentTime(currentTime));
                    // Проверяем duration только если еще не установлена
                    if (!durationSetRef.current && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                      dispatch(setDuration(audio.duration));
                      durationSetRef.current = true;
                    }
                    
                    // Резервный механизм: если трек закончился (осталось меньше 0.2 сек)
                    if (audio.duration && audio.duration - currentTime < 0.2 && audio.duration - currentTime >= 0 && !trackEndHandledRef.current) {
                      console.log('Трек почти закончился! Осталось:', audio.duration - currentTime, 'сек');
                      console.log('Вызываем переключение трека через резервный механизм');
                      
                      // Отмечаем, что обработали конец трека
                      trackEndHandledRef.current = true;
                      
                      // Останавливаем интервал
                      if (intervalId) {
                        clearInterval(intervalId);
                      }
                      
                      // Вызываем логику переключения
                      if (isRepeatOn) {
                        console.log('Повторяем трек (резервный механизм)');
                        audio.currentTime = 0;
                        dispatch(setCurrentTime(0));
                        trackEndHandledRef.current = false;
                        audio.play().catch(console.error);
                      } else {
                        console.log('Переключаемся на следующий трек (резервный механизм)');
                        dispatch(setCurrentTime(0));
                        dispatch(playNext());
                      }
                    }
                  }
                }, 100);
              })
              .catch((error) => {
                console.error('Ошибка воспроизведения:', error);
                dispatch(setIsPlaying(false));
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
  }, [isPlaying, dispatch, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Сбрасываем флаги при смене трека
    durationSetRef.current = false;
    trackEndHandledRef.current = false;

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
    dispatch(setCurrentTime(0));
    dispatch(setDuration(0));
  }, [currentTrack, dispatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('loadedmetadata event, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
        durationSetRef.current = true;
      }
    };

    const handleEnded = () => {
      console.log('Трек закончился! isRepeatOn:', isRepeatOn);
      if (isRepeatOn) {
        // Если режим повтора включен, начинаем трек заново
        console.log('Повторяем трек');
        audio.currentTime = 0;
        dispatch(setCurrentTime(0));
        audio.play().catch(console.error);
      } else {
        // Иначе переключаемся на следующий трек
        console.log('Переключаемся на следующий трек');
        dispatch(setCurrentTime(0));
        dispatch(playNext());
      }
    };

    const handleError = (e: Event) => {
      console.error('Ошибка загрузки аудио:', e);
      dispatch(setIsPlaying(false));
    };

    const handleCanPlay = () => {
      // Аудио готово к воспроизведению - проверяем duration еще раз
      console.log('canplay event, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
        durationSetRef.current = true;
      }
    };
    
    const handleLoadedData = () => {
      // Данные загружены - проверяем duration еще раз
      console.log('loadeddata event, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
        durationSetRef.current = true;
      }
    };

    const handleLoadStart = () => {
      // Начало загрузки аудио
    };

    const handleProgress = () => {
      // Прогресс загрузки
    };

    console.log('AudioPlayer: Подписываемся на события audio элемента');
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('progress', handleProgress);
    console.log('AudioPlayer: События подключены, включая ended');

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [dispatch, isRepeatOn, playNext]);

  if (!currentTrack) return null;

  return <audio ref={audioRef} preload="metadata" />;
}
