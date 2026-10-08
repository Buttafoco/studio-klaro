import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';

// Guiderna genereras av scripts/build-guides.mjs till guider/*.html och tas med automatiskt.
const guidePages = existsSync(resolve(__dirname, 'guider'))
  ? Object.fromEntries(readdirSync(resolve(__dirname, 'guider'))
      .filter((f) => f.endsWith('.html'))
      .map((f) => ['guider-' + f.replace(/\.html$/, ''), resolve(__dirname, 'guider', f)]))
  : {};

// Lokalt (vite dev/preview): /guider ska ge guider/index.html som på Vercel, inte startsidan.
const guideIndex = (req, res, next) => {
  if (/^\/guider\/?(\?|#|$)/.test(req.url)) req.url = req.url.replace(/^\/guider\/?/, '/guider/index.html');
  next();
};
const guideRoutes = {
  name: 'guide-routes',
  configureServer(server) { server.middlewares.use(guideIndex); },
  configurePreviewServer(server) { server.middlewares.use(guideIndex); },
};

export default defineConfig({
  plugins: [guideRoutes],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        om: resolve(__dirname, 'om.html'),
        frisor: resolve(__dirname, 'hemsida-frisor-stockholm.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        caseGalleri86: resolve(__dirname, 'case-galleri86.html'),
        caseSkikt: resolve(__dirname, 'case-skikt.html'),
        priser: resolve(__dirname, 'priser.html'),
        restaurang: resolve(__dirname, 'hemsida-restaurang-stockholm.html'),
        fotograf: resolve(__dirname, 'hemsida-fotograf.html'),
        skonhetssalong: resolve(__dirname, 'hemsida-skonhetssalong-stockholm.html'),
        seoKoll: resolve(__dirname, 'seo-koll.html'),
        seraDemo: resolve(__dirname, 'demo/sera.html'),
        ...guidePages,
      },
    },
  },
});
