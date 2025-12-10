'use client';

import { ReduxProvider } from './ReduxProvider';
import AudioPlayer from './AudioPlayer';
import TimeUpdater from './TimeUpdater';
import FilterReset from './FilterReset';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <FilterReset />
      {children}
      <AudioPlayer />
      <TimeUpdater />
    </ReduxProvider>
  );
}
