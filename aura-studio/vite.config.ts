import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * ONNX Runtime loads its WebAssembly glue (`/ort/*.mjs`) with a dynamic import.
 * Vite's dev server refuses to transform files in /public, so serve them raw.
 * (Production builds copy /public verbatim and need nothing special.)
 */
function serveOrt(): Plugin {
  return {
    name: 'aura-serve-ort',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/ort/')) return next();
        const file = path.join(server.config.publicDir, url);
        if (!file.startsWith(server.config.publicDir) || !fs.existsSync(file)) return next();
        res.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : 'text/javascript');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [serveOrt(), react()],
  server: { port: 5173, host: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
