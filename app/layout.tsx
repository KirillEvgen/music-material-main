import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import Providers from '../src/components/Providers';

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
