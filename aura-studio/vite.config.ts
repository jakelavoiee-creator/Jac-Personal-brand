import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
 * Same-origin relay for the Tapstitch Open Platform API, which does not allow
 * browser (CORS) requests. Only /v1/ API paths are forwarded, only to
 * openapi.tapstitch.com, with the user's own token from the request.
 * Production equivalents: functions/tapstitch/[[path]].js (Cloudflare Pages)
 * and public/_redirects (Netlify).
 */
const TAPSTITCH = 'openapi.tapstitch.com';
function tapstitchRelay(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (!req.url?.startsWith('/tapstitch/')) return next();
  const rest = req.url.slice('/tapstitch'.length);
  if (!rest.startsWith('/v1/') || !['GET', 'POST', 'PUT', 'DELETE'].includes(req.method ?? '')) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const up = https.request(
    {
      host: TAPSTITCH,
      path: rest,
      method: req.method,
      headers: {
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] } : {}),
        accept: 'application/json',
      },
      agent: proxy ? new HttpsProxyAgent(proxy) : undefined,
    },
    (r) => {
      res.statusCode = r.statusCode ?? 502;
      res.setHeader('content-type', r.headers['content-type'] ?? 'application/json');
      res.setHeader('cache-control', 'no-store');
      r.pipe(res);
    },
  );
  up.on('error', (e) => {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ title: 'Relay error', detail: e.message }));
  });
  req.pipe(up);
}
function relay(): Plugin {
  return {
    name: 'aura-tapstitch-relay',
    configureServer: (s) => void s.middlewares.use(tapstitchRelay),
    configurePreviewServer: (s) => void s.middlewares.use(tapstitchRelay),
  };
}

/**
 * Cross-origin isolation unlocks SharedArrayBuffer, which lets ONNX Runtime run
 * the AI models on all CPU cores. `credentialless` keeps cross-origin images,
 * fonts and model downloads working without each host opting in.
 * Production hosts must send the same headers — see public/_headers.
 */

export default defineConfig({
  plugins: [serveOrt(), relay(), react()],
  server: { port: 5173, host: true, headers: isolation },
  preview: { headers: isolation },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
