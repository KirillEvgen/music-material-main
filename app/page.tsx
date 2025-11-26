'use client';

import { useState, useEffect, useCallback } from 'react';
import { Track } from '../src/types/Track';
import MainLayout from '../src/components/MainLayout';
import { getTracks, ApiError } from '../src/api/api';
import { useAppSelector } from '../src/store/hooks';
import { data as fallbackData } from '../src/data';

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getTracks(token);
        console.log('Загружено треков:', data.length);
        
        // Если API вернул пустой массив, используем fallback данные
        if (data.length === 0) {
          console.log('API вернул пустой массив, используем fallback данные');
          setTracks(fallbackData);
        } else {
          setTracks(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки треков:', err);
        // При ошибке используем fallback данные
        console.log('Используем fallback данные из-за ошибки API');
        setTracks(fallbackData);
        setError(null); // Не показываем ошибку, так как используем fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [token]);

  const handleTracksChange = useCallback((updatedTracks: Track[]) => {
    setTracks(updatedTracks);
  }, []);

  return (
    <MainLayout
      title="Треки"
      tracks={tracks}
      error={error}
      isLoading={isLoading}
      onTracksChange={handleTracksChange}
    />
  );
}
