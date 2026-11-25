import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * ONNX Runtime loads its WebAssembly glue (`/ort/*.mjs`) with a dynamic import.
 * Vite's dev server refuses to transform files in /public, so serve them raw.
 * (Production builds copy /public verbatim and need nothing special.)
 */
const isolation = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' };

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
        // worker scripts must carry the isolation headers too, or threads can't start
        for (const [k, v] of Object.entries(isolation)) res.setHeader(k, v);
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

/**
 * Cross-origin isolation unlocks SharedArrayBuffer, which lets ONNX Runtime run
 * the AI models on all CPU cores. `credentialless` keeps cross-origin images,
 * fonts and model downloads working without each host opting in.
 * Production hosts must send the same headers — see public/_headers.
 */

export default defineConfig({
  plugins: [serveOrt(), react()],
  server: { port: 5173, host: true, headers: isolation },
  preview: { headers: isolation },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
