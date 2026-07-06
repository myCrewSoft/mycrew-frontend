import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  server: {
    port: 5173,
    proxy: {
      // 💡 프론트에서 /api로 시작하는 요청을 보내면 백엔드 주소로 가로채서 전달합니다.
      '/api': {
        target: 'http://localhost:80', // 👈 백엔드(스프링) 실제 포트 번호로 적어주세요!
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
