'use client';

import { useState } from 'react';
import { data } from '../../src/data';
import { Track } from '../../src/types/Track';
import { MusicProvider } from '../../src/contexts/MusicContext';
import Header from '../../src/components/Header';
import Search from '../../src/components/Search';
import Filter from '../../src/components/Filter';
import TrackList from '../../src/components/TrackList';
import Sidebar from '../../src/components/Sidebar';
import Player from '../../src/components/Player';
import styles from './page.module.css';

export default function Playlist() {
  const [tracks, setTracks] = useState<Track[]>(data);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <MusicProvider>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <main className={styles.main}>
            <Header isMenuOpen={isMenuOpen} onMenuToggle={handleMenuToggle} />
            <div className={styles.centerblock}>
              <Search />
              <h2 className={styles.centerblock__h2}>Мой плейлист</h2>
              <Filter tracks={tracks} />
              <TrackList tracks={tracks} />
            </div>
            <Sidebar />
          </main>
          <Player />
          <footer className={styles.footer}></footer>
        </div>
      </div>
    </MusicProvider>
  );
}
