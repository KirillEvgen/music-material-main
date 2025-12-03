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

    console.log('useEffect [isPlaying, currentTrack] triggered. isPlaying:', isPlaying, 'track:', currentTrack?.name);

    let intervalId: NodeJS.Timeout | null = null;

    const startPlayback = () => {
      // Проверяем, что трек загружен
      if (!audio.src || audio.readyState === 0) {
        console.log('Трек еще не загружен, ждем...');
        return;
      }

      audio
        .play()
        .then(() => {
          console.log('Воспроизведение началось');
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
    };

    if (isPlaying) {
      // Если трек уже готов, начинаем воспроизведение сразу
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA или выше
        startPlayback();
      } else {
        // Ждем события canplay или canplaythrough
        const handleCanPlay = () => {
          console.log('Трек готов к воспроизведению');
          startPlayback();
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('canplaythrough', handleCanPlay);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('canplaythrough', handleCanPlay);
        
        // Если трек уже загружается, но событие еще не произошло, пробуем через небольшую задержку
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
      // Останавливаем обновление времени при паузе
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

    // Проверяем, что у трека есть track_file
    if (!currentTrack.track_file) {
      console.error('Трек не имеет track_file:', currentTrack);
      dispatch(setIsPlaying(false));
      return;
    }

    // Сбрасываем флаги при смене трека
    durationSetRef.current = false;
    trackEndHandledRef.current = false;

    // Останавливаем текущее воспроизведение
    audio.pause();
    audio.currentTime = 0;

    // Очищаем предыдущий src перед установкой нового
    audio.src = '';
    audio.load();

    // Устанавливаем новый src
    console.log('Загружаем трек:', currentTrack.name, currentTrack.track_file);

    // Устанавливаем src напрямую - браузер сам загрузит трек
    audio.src = currentTrack.track_file;
    audio.preload = 'auto';
    audio.load();

    // Сбрасываем время при загрузке нового трека
    dispatch(setCurrentTime(0));
    dispatch(setDuration(0));
  }, [currentTrack, dispatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Используем ref для хранения текущего значения isPlaying в обработчиках
    const isPlayingRef = { current: isPlaying };

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
      // Если isPlaying уже true и трек не играет, начинаем воспроизведение
      if (isPlayingRef.current && audio.src && audio.paused) {
        console.log('Автоматически начинаем воспроизведение после загрузки');
        audio.play().catch((error) => {
          console.error('Ошибка автовоспроизведения после загрузки:', error);
          dispatch(setIsPlaying(false));
        });
      }
    };
    
    // Обновляем ref при изменении isPlaying
    isPlayingRef.current = isPlaying;
    
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
  }, [dispatch, isRepeatOn, isPlaying, playNext]);

  if (!currentTrack) return null;

  return <audio ref={audioRef} preload="metadata" />;
}
