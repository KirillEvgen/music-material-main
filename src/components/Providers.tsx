'use client';

import { ReduxProvider } from './ReduxProvider';
import AudioPlayer from './AudioPlayer';
import TimeUpdater from './TimeUpdater';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      {children}
      <AudioPlayer />
      <TimeUpdater />
    </ReduxProvider>
  );
}

