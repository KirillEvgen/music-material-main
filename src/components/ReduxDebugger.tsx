'use client';

import { useAppSelector } from '../store/hooks';

export default function ReduxDebugger() {
  const musicState = useAppSelector((state) => state.music);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Redux Debug:</h4>
      <div>Треков в store: {musicState.tracks.length}</div>
      <div>Текущий трек: {musicState.currentTrack?.name || 'Нет'}</div>
      <div>Играет: {musicState.isPlaying ? 'Да' : 'Нет'}</div>
      <div>Громкость: {musicState.volume}</div>
      <div>Время: {musicState.currentTime.toFixed(1)}s</div>
      <div>Длительность: {musicState.duration.toFixed(1)}s</div>
    </div>
  );
}
