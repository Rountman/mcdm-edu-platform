import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages projektu: https://rountman.github.io/mcdm-edu-platform/
  base: '/mcdm-edu-platform/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          recharts: ['recharts'],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
