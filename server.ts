import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeAndAnonymize } from './src/engine/anonymizer.ts';
import type { ScanOptions } from './src/engine/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const MAX_INPUT_CHARS = 250_000;

app.use(express.json({ limit: '2mb' }));

// Security headers for defense-in-depth
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'PrivacyGuard AI Ephemeral Engine',
    persistence: 'none',
  });
});

// Ephemeral in-memory anonymization API — never logs or persists raw text/PII
app.post('/api/anonymize', (req, res) => {
  try {
    const body = req.body as { input?: unknown; options?: ScanOptions };

    if (typeof body?.input !== 'string' || body.input.trim().length === 0) {
      res.status(400).json({ error: 'Input data must be a non-empty string.' });
      return;
    }

    if (body.input.length > MAX_INPUT_CHARS) {
      res.status(413).json({
        error: `Input exceeds maximum ephemeral demo limit of ${MAX_INPUT_CHARS.toLocaleString()} characters.`,
      });
      return;
    }

    const options = body.options;
    if (!options || typeof options !== 'object' || !options.categories || !options.technique) {
      res.status(400).json({ error: 'Valid scan options are required.' });
      return;
    }

    const result = analyzeAndAnonymize(body.input, options);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to process anonymization request.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrivacyGuard AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
