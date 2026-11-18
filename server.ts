import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LinkStore } from './server/linkStore';
import { inspectUrlSafety } from './src/utils/urlValidator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, 'data', 'links.json');
const store = new LinkStore(DATA_FILE);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNotFoundPage(code: string): string {
  const safeCode = escapeHtml(code);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link Not Found — PrismLink</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: radial-gradient(circle at 20% 20%, #151a26 0%, #07090d 70%); color: #f5f4f0; }
    .card { max-width: 440px; width: 100%; background: linear-gradient(145deg, rgba(28,33,45,0.62), rgba(13,16,23,0.48)); backdrop-filter: blur(26px) saturate(180%); border: 1px solid rgba(255,255,255,0.14); border-radius: 24px; padding: 32px; box-shadow: 0 24px 56px -18px rgba(0,0,0,0.72), inset 0 1px 1px rgba(255,255,255,0.22); }
    h1 { margin: 0 0 8px; font-size: 24px; font-family: Georgia, serif; }
    p { margin: 0 0 24px; color: #cbd5e1; line-height: 1.6; font-size: 15px; }
    code { font-family: ui-monospace, monospace; background: rgba(255,255,255,0.08); color: #fcd34d; padding: 2px 6px; border-radius: 6px; }
    a { display: inline-block; padding: 10px 18px; border-radius: 14px; background: linear-gradient(180deg, rgba(251,191,36,0.96), rgba(217,119,6,0.9)); border: 1px solid rgba(253,230,138,0.58); color: #090b10; text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: inset 0 1px 1px rgba(255,255,255,0.72); }
  </style>
</head>
<body>
  <main class="card">
    <h1>Short link not found</h1>
    <p>No active destination exists for <code>/s/${safeCode}</code>. Check the alias spelling or create a new shortened link.</p>
    <a href="/">Return to PrismLink</a>
  </main>
</body>
</html>`;
}

function renderDeepLinkHandoffPage(targetUrl: string, protocolLabel: string): string {
  const safeUrl = escapeHtml(targetUrl);
  const safeLabel = escapeHtml(protocolLabel);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Opening ${safeLabel} — PrismLink</title>
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: radial-gradient(circle at 20% 20%, #151a26 0%, #07090d 70%); color: #f5f4f0; }
    .card { max-width: 480px; width: 100%; background: linear-gradient(145deg, rgba(28,33,45,0.62), rgba(13,16,23,0.48)); backdrop-filter: blur(26px) saturate(180%); border: 1px solid rgba(255,255,255,0.14); border-radius: 24px; padding: 32px; box-shadow: 0 24px 56px -18px rgba(0,0,0,0.72), inset 0 1px 1px rgba(255,255,255,0.22); }
    h1 { margin: 0 0 8px; font-size: 24px; font-family: Georgia, serif; }
    p { margin: 0 0 16px; color: #cbd5e1; line-height: 1.6; font-size: 14px; word-break: break-all; font-family: ui-monospace, monospace; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
    .btn { display: inline-block; padding: 10px 18px; border-radius: 14px; background: linear-gradient(180deg, rgba(251,191,36,0.96), rgba(217,119,6,0.9)); border: 1px solid rgba(253,230,138,0.58); color: #090b10; text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: inset 0 1px 1px rgba(255,255,255,0.72); }
    .btn-secondary { background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.18); color: #f5f4f0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.24); }
  </style>
</head>
<body>
  <main class="card">
    <h1>Opening ${safeLabel}</h1>
    <p>${safeUrl}</p>
    <div class="actions">
      <a class="btn" href="${safeUrl}">Open Destination</a>
      <a class="btn btn-secondary" href="/">Back to PrismLink</a>
    </div>
  </main>
  <script>
    window.location.href = ${JSON.stringify(targetUrl)};
  </script>
</body>
</html>`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/shorten', (req, res) => {
    const { url, alias } = req.body ?? {};
    if (typeof url !== 'string') {
      res.status(400).json({ error: 'URL must be a string.' });
      return;
    }

    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const currentOrigin = `${proto}://${host}`;

    const result = store.create(
      url,
      typeof alias === 'string' ? alias : undefined,
      currentOrigin
    );

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(201).json({ link: result.link });
  });

  app.get('/api/links', (req, res) => {
    const rawCodes = typeof req.query.codes === 'string' ? req.query.codes : '';
    if (!rawCodes.trim()) {
      res.json({ links: [] });
      return;
    }
    const codes = rawCodes
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 50);
    const links = store.getMany(codes);
    res.json({ links });
  });

  app.get('/api/links/:code', (req, res) => {
    const link = store.get(req.params.code);
    if (!link) {
      res.status(404).json({ error: 'Short link not found.' });
      return;
    }
    res.json({ link });
  });

  app.post('/api/inspect', (req, res) => {
    const { input } = req.body ?? {};
    if (typeof input !== 'string' || !input.trim()) {
      res.status(400).json({ error: 'Provide a URL or short code to inspect.' });
      return;
    }

    const trimmed = input.trim();
    // Allow checking either a short code / /s/code or a full URL
    let targetToInspect = trimmed;
    let matchedShortLink = null;

    const shortPathMatch = trimmed.match(/^(?:https?:\/\/[^/]+)?\/s\/([a-zA-Z0-9_-]+)\/?$/);
    const bareCodeMatch = /^[a-zA-Z0-9_-]{3,36}$/.test(trimmed) ? trimmed : null;

    const lookupCode = shortPathMatch ? shortPathMatch[1] : bareCodeMatch;
    if (lookupCode) {
      const found = store.get(lookupCode);
      if (found) {
        matchedShortLink = found;
        targetToInspect = found.originalUrl;
      }
    }

    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const inspection = inspectUrlSafety(targetToInspect, `${proto}://${host}`);

    res.json({
      inspection,
      matchedShortLink,
    });
  });

  app.get('/s/:code', (req, res) => {
    const record = store.recordClick(req.params.code);
    if (!record) {
      res.status(404).type('html').send(renderNotFoundPage(req.params.code));
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (record.protocol === 'http' || record.protocol === 'https') {
      res.redirect(302, record.originalUrl);
      return;
    }

    res
      .status(200)
      .type('html')
      .send(renderDeepLinkHandoffPage(record.originalUrl, record.protocolLabel));
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build artifacts not found.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`PrismLink server running on http://0.0.0.0:${port}`);
  });
}

startServer();
