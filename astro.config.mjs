// @ts-check
import { defineConfig } from 'astro/config';
import { createReadStream, statSync, cpSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

/** @type {Record<string, string>} */
const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

/** Vite plugin: serves src/data/website/ at /data/website/ during dev */
const serveWebsiteImages = /** @type {import('vite').Plugin} */ ({
  name: 'serve-website-images',
  configureServer(server) {
    server.middlewares.use('/data/website/', (req, res, next) => {
      const filename = decodeURIComponent((req.url ?? '').replace(/^\//, '').split('?')[0]);
      const filePath = resolve(process.cwd(), 'src/data/website', filename);
      try {
        const stats = statSync(filePath);
        if (!stats.isFile()) return next();
        const ext = extname(filePath).toLowerCase().slice(1);
        res.setHeader('Content-Type', MIME_TYPES[ext] ?? 'application/octet-stream');
        res.setHeader('Content-Length', stats.size);
        createReadStream(filePath).pipe(res);
      } catch {
        next();
      }
    });
  },
});

/** Astro integration: copies src/data/website/ into the build output */
const copyWebsiteImages = /** @type {import('astro').AstroIntegration} */ ({
  name: 'copy-website-images',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const dest = fileURLToPath(new URL('data/website', dir));
      mkdirSync(dest, { recursive: true });
      cpSync(resolve(process.cwd(), 'src/data/website'), dest, { recursive: true });
    },
  },
});

export default defineConfig({
  integrations: [react(), copyWebsiteImages],

  vite: {
    plugins: [tailwindcss(), serveWebsiteImages],
    optimizeDeps: {
      exclude: ['@astrojs/cloudflare'],
    },
  },

  adapter: cloudflare(),
});
