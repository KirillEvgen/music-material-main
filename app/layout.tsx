import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { MusicProvider } from '../src/contexts/MusicContext';
import AudioPlayer from '../src/components/AudioPlayer';

const montserrat = Montserrat({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'SkyPro Music',
  description: 'Музыкальное приложение',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={montserrat.className}>
        <MusicProvider>
          {children}
          <AudioPlayer />
        </MusicProvider>
      </body>
    </html>
  );
}
