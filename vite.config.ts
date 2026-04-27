import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fsp from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const __configDir = path.dirname(fileURLToPath(import.meta.url));

/** Garante `dist/wasm` (Vite com `root: src` nem sempre emite o `publicDir` como esperado). */
function copyMediaPipeWasmToDist() {
  return {
    name: 'copy-mediapipe-wasm-to-dist',
    async writeBundle() {
      const from = path.join(__configDir, 'static', 'wasm');
      const to = path.join(__configDir, 'dist', 'wasm');
      if (!fss.existsSync(from)) {
        console.warn('[vite] static/wasm ausente. Execute: node scripts/copy-mediapipe-wasm.mjs');
        return;
      }
      await fsp.rm(to, { recursive: true, force: true });
      await fsp.cp(from, to, { recursive: true });
    },
  };
}

export default defineConfig({
  // Necessário para `BrowserWindow.loadFile('dist/index.html')`: com `file://`
  // caminhos absolutos `/assets/...` não resolvem; `./assets/...` sim.
  base: './',
  plugins: [react(), copyMediaPipeWasmToDist()],
  root: 'src',
  /** Em dev, serve `static/` em `/` (WASM acessível em `/wasm/...`). */
  publicDir: path.join(__configDir, 'static'),
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
    },
  },
});
