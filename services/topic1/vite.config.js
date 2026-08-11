import { defineConfig } from 'vite';

export default defineConfig({
  // yitongjeon315.github.io/topic 이나 aina365.com/topic 같은 서브디렉토리 경로 배포를 위해 base 경로를 설정합니다.
  base: '/topic/',
  build: {
    outDir: 'dist'
  }
});
