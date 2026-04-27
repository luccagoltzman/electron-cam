/**
 * Copia o diretório `wasm` do pacote npm para `static/wasm`, servido pelo Vite
 * e empacotado em `dist/wasm` (mesma origem que o app — evita GL/CORS no Electron).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const from = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const to = path.join(root, 'static', 'wasm');

await fs.mkdir(path.dirname(to), { recursive: true });
await fs.rm(to, { recursive: true, force: true });
await fs.cp(from, to, { recursive: true });
console.log('[copy-mediapipe-wasm]', to);
