import { app, BrowserWindow, session } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'node:http';
import fsp from 'node:fs/promises';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.VITE_DEV === '1';
const isDebug = process.env.ELECTRON_DEBUG === '1';

const resolveFromRoot = (...parts) => path.join(__dirname, '..', ...parts);

/** Tipo de arquivo estático; `.wasm` é necessário para o MediaPipe. */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' blob:",
  "connect-src 'self' https: blob: data:",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline'",
  "media-src 'self' blob: mediastream: https: data:",
  "worker-src 'self' blob:",
].join('; ');

/**
 * Sobe um HTTP local com origem clara, permitindo `webSecurity: true` e
 * `fetch` HTTPS (modelo + WASM) sem o modo inseguro de `file://`.
 */
function startStaticDistServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      void (async () => {
        try {
          const url = new URL(req.url ?? '/', 'http://127.0.0.1');
          const root = path.resolve(rootDir);
          const pathname = url.pathname || '/';
          const rel = pathname === '/' || pathname === '' ? 'index.html' : pathname.replace(/^\/+/, '');
          const filePath = path.join(root, rel);
          const resolved = path.resolve(filePath);
          if (resolved !== root && !resolved.startsWith(root + path.sep)) {
            res.writeHead(403);
            res.end();
            return;
          }

          let st = null;
          try {
            st = await fsp.stat(resolved);
          } catch {
            st = null;
          }

          if (st == null || !st.isFile()) {
            if (path.extname(resolved) === '' && existsSync(path.join(root, 'index.html'))) {
              const html = await fsp.readFile(path.join(root, 'index.html'));
              res.setHeader('Content-Security-Policy', PROD_CSP);
              res.setHeader('X-Content-Type-Options', 'nosniff');
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.writeHead(200);
              res.end(html);
              return;
            }
            res.writeHead(404);
            res.end();
            return;
          }

          const ext = path.extname(resolved);
          const type = MIME[ext] || 'application/octet-stream';
          if (ext === '.html') {
            res.setHeader('Content-Security-Policy', PROD_CSP);
          }
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Content-Type', type);
          const body = await fsp.readFile(resolved);
          res.writeHead(200);
          res.end(body);
        } catch {
          if (!res.headersSent) {
            res.writeHead(500);
          }
          res.end();
        }
      })();
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const a = server.address();
      if (a == null || typeof a === 'string') {
        server.close();
        reject(new Error('endereço do servidor indisponível'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${a.port}/` });
    });
  });
}

let distServer = null;
/** URL do build em produção (HTTP local); reutilizado em `activate` (macOS). */
let prodAppUrl = null;

function createWindow(loadUrl) {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    show: true,
    backgroundColor: '#0f1216',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  if (isDebug) {
    void win.webContents.openDevTools({ mode: 'right' });
  }

  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[did-fail-load]', { code, desc, url });
  });
  win.webContents.on('console-message', (_e, level, message) => {
    if (isDev || isDebug) {
      const tag = level === 0 ? 'log' : level === 1 ? 'warn' : 'error';
      console[tag](`[renderer] ${message}`);
    }
  });

  void win.loadURL(loadUrl);
}

app.whenReady().then(() => {
  void session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(false);
  });

  void (async () => {
    let loadUrl = 'http://127.0.0.1:5173';
    if (isDev) {
      void createWindow(loadUrl);
    } else {
      const root = path.normalize(resolveFromRoot('dist'));
      if (!existsSync(path.join(root, 'index.html'))) {
        console.error('Execute "npm run build" antes de "npm start" (falta dist/index.html).');
        app.quit();
        return;
      }
      const { server, url } = await startStaticDistServer(root);
      distServer = server;
      prodAppUrl = url;
      void createWindow(url);
    }
  })();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (isDev) void createWindow('http://127.0.0.1:5173');
    else if (prodAppUrl != null) void createWindow(prodAppUrl);
  }
});

app.on('before-quit', () => {
  if (distServer != null) {
    distServer.close();
    distServer = null;
    prodAppUrl = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
