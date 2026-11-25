// Serve ONNX Runtime Web's WebAssembly from Aura itself (no third-party CDN at runtime).
import fs from 'node:fs';
const src = 'node_modules/onnxruntime-web/dist';
const dst = 'public/ort';
fs.mkdirSync(dst, { recursive: true });
for (const f of fs.readdirSync(src)) if (/^ort-wasm-simd-threaded\.(jsep\.|asyncify\.|jspi\.)?(wasm|mjs)$/.test(f)) fs.copyFileSync(`${src}/${f}`, `${dst}/${f}`);
console.log('ort runtime copied:', fs.readdirSync(dst).join(', '));
