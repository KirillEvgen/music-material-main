'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Track } from '../../src/types/Track';
import MainLayout from '../../src/components/MainLayout';
import { getPlaylistTracks, ApiError } from '../../src/api/api';
import { useAppSelector } from '../../src/store/hooks';

function PlaylistContent() {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('id');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      if (!playlistId) {
        setError('ID подборки не указан');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const playlistIdNum = parseInt(playlistId, 10);
        if (isNaN(playlistIdNum)) {
          setError('Неверный ID подборки');
          setIsLoading(false);
          return;
        }

        const data = await getPlaylistTracks(playlistIdNum, token);
        setTracks(data);
      } catch (err) {
        if (err instanceof ApiError) {
          // Если подборка не найдена (404), показываем пустой список
          if (err.status === 404) {
            setTracks([]);
            setError(null);
          } else {
            setError(err.message);
          }
        } else {
          setError('Произошла ошибка при загрузке треков подборки');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylistTracks();
  }, [playlistId, token]);

  return (
    <MainLayout
      title="Мой плейлист"
      tracks={tracks}
      error={error}
      isLoading={isLoading}
    />
  );
}

export default function Playlist() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>}>
      <PlaylistContent />
    </Suspense>
  );
}
