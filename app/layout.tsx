import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DailyMind Challenge',
  description: 'Tantangan harian adaptif untuk melatih logika dan pola pikir',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark h-full">
      <body className={`${inter.className} bg-[#020617] text-[#f8fafc] antialiased h-full m-0 p-0`}>
        <NextTopLoader color="#3b82f6" showSpinner={false} speed={200} shadow="0 0 10px #3b82f6,0 0 5px #3b82f6" />
        <div className="app-shell mx-auto">
          <div className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar scroll-smooth">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
