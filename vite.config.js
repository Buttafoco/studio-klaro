import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        om: resolve(__dirname, 'Om.html'),
        caseStudioNord: resolve(__dirname, 'Case-StudioNord.html'),
      },
    },
  },
});
