// Start Aura Studio for everyday use: install once, build the optimized
// production version when the code changed, then serve it (with the Tapstitch
// relay and the headers for multi-threaded on-device AI) and open the browser.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args) => {
  const r = spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`\n"npm ${args.join(' ')}" failed. Send a screenshot of this window for help.`);
    process.exit(1);
  }
};

if (!fs.existsSync('node_modules')) {
  console.log('First start: installing Aura (a few minutes, only once)…\n');
  run(['install']);
}

/** newest modification time under a directory */
const newest = (dir) => {
  let t = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    t = Math.max(t, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs);
  }
  return t;
};
const built = fs.existsSync('dist/index.html') ? fs.statSync('dist/index.html').mtimeMs : 0;
const sources = Math.max(newest('src'), newest('public'), fs.statSync('index.html').mtimeMs, fs.statSync('package.json').mtimeMs);
if (!built || sources > built) {
  console.log('Preparing the fast version of Aura (about a minute, only after updates)…\n');
  run(['run', 'build']);
}

const PORT = 5173;
const url = `http://localhost:${PORT}`;
console.log(`\nAura Studio is running at ${url}\nKeep this window open while you work. Close it to stop Aura.\n`);
const server = spawn(npm, ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], { stdio: 'inherit', shell: process.platform === 'win32' });
setTimeout(() => {
  const opener = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
}, 2500);
server.on('exit', (code) => process.exit(code ?? 0));
