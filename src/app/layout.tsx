import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  themeColor: '#07090e',
};

export const metadata: Metadata = {
  title: 'JEONGO - 중국어 RPG 학습 웹앱',
  description: '게임하듯 즐겁게 배우고 현실 보상까지 받는 스마트 중국어 학습기',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JEONGO',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased dark">
      <body className="h-full bg-[#07090e] text-white flex flex-col justify-start overflow-hidden">
        <AppProvider>
          <div className="w-full max-w-md md:max-w-4xl xl:max-w-6xl mx-auto h-dvh flex flex-col bg-dark-bg sm:border-x sm:border-white/5 relative shadow-2xl overflow-hidden">
            <Header />
            <main className="flex-1 min-h-0 px-3 py-3 sm:px-4 sm:py-4 overflow-y-auto overscroll-contain scroll-pb-5">
              {children}
            </main>
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
