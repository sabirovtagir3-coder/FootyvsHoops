import { defineConfig } from 'vite';

export default defineConfig({
  base: '/FootyvsHoops/',
  server: {
    host: true,
    port: 3000
  },
  build: {
    target: 'esnext'
  }
});