'use client';

import { useState, ReactNode } from 'react';
import Header from './Header';
import Search from './Search';
import Filter from './Filter';
import TrackList from './TrackList';
import Sidebar from './Sidebar';
import Player from './Player';
import MusicInitializer from './MusicInitializer';
import { Track } from '../types/Track';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children?: ReactNode;
  title: string;
  tracks: Track[];
  error?: string | null;
  isLoading?: boolean;
}

export default function MainLayout({
  children,
  title,
  tracks,
  error,
  isLoading,
}: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Убеждаемся, что tracks - это массив
  const safeTracks = Array.isArray(tracks) ? tracks : [];

  return (
    <>
      <MusicInitializer tracks={safeTracks} />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <main className={styles.main}>
            <Header isMenuOpen={isMenuOpen} onMenuToggle={handleMenuToggle} />
            <div className={styles.centerblock}>
              <Search />
              <h2 className={styles.centerblock__h2}>{title}</h2>
              {error ? (
                <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                  {error}
                </div>
              ) : isLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
              ) : safeTracks.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  Треки не найдены
                </div>
              ) : (
                <>
                  <Filter tracks={safeTracks} />
                  <TrackList tracks={safeTracks} />
                </>
              )}
              {children}
            </div>
            <Sidebar />
          </main>
          <Player />
          <footer className={styles.footer}></footer>
        </div>
      </div>
    </>
  );
}

