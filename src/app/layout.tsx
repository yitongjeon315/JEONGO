import type { Metadata, Viewport } from 'next';
import { Outfit, Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSc = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-kr',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    <html
      lang="ko"
      className={`${outfit.variable} ${inter.variable} ${notoSc.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-[#07090e] text-white flex flex-col justify-start overflow-hidden">
        <AppProvider>
          {/* Mobile-first Mock Shell Container (Fixed viewport height & scrollable main) */}
          <div className="w-full max-w-md md:max-w-2xl mx-auto h-[100dvh] flex flex-col bg-dark-bg border-x border-white/5 relative shadow-2xl overflow-hidden">
            <Header />
            <main className="flex-1 px-4 py-4 overflow-y-auto pb-28">
              {children}
            </main>
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
