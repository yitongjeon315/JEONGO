import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_BEFORE_JEONGO_URL ?? 'http://localhost:3002';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '성조 퀘스트 | BEFORE JEONGO',
  description: '듣고, 맞히고, 레벨 업! 게임처럼 즐기는 중국어 병음·성조 첫걸음',
  openGraph: {
    title: '성조 퀘스트 | BEFORE JEONGO',
    description: '성조 몬스터를 물리치며 중국어 소리를 익혀보세요.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'BEFORE JEONGO 성조 퀘스트' }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '성조 퀘스트 | BEFORE JEONGO',
    description: '듣고, 맞히고, 레벨 업! 게임처럼 즐기는 중국어 성조 학습',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07101c',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" className="dark"><body>{children}</body></html>;
}
