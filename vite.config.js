import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        om: resolve(__dirname, 'om.html'),
        frisor: resolve(__dirname, 'hemsida-frisor-stockholm.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        mallar: resolve(__dirname, 'mallar.html'),
        priser: resolve(__dirname, 'priser.html'),
        restaurang: resolve(__dirname, 'hemsida-restaurang-stockholm.html'),
        fotograf: resolve(__dirname, 'hemsida-fotograf.html'),
        skonhetssalong: resolve(__dirname, 'hemsida-skonhetssalong-stockholm.html'),
      },
    },
  },
});
