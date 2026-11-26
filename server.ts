import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeAndAnonymize, analyzeBatchFiles } from './src/engine/anonymizer.ts';
import type { BatchFileInput, ScanOptions } from './src/engine/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const MAX_INPUT_CHARS = 1_500_000;
const MAX_BATCH_FILES = 100;

app.use(express.json({ limit: '5mb' }));

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

app.post('/api/anonymize-batch', (req, res) => {
  try {
    const body = req.body as {
      files?: unknown;
      options?: Omit<ScanOptions, 'format'>;
    };

    if (!Array.isArray(body?.files) || body.files.length === 0) {
      res.status(400).json({ error: 'At least one file is required for batch processing.' });
      return;
    }

    if (body.files.length > MAX_BATCH_FILES) {
      res.status(413).json({
        error: `Batch exceeds maximum ephemeral limit of ${MAX_BATCH_FILES} files.`,
      });
      return;
    }

    const options = body.options;
    if (!options || typeof options !== 'object' || !options.categories || !options.technique) {
      res.status(400).json({ error: 'Valid scan options are required.' });
      return;
    }

    const validFiles: BatchFileInput[] = [];
    let totalChars = 0;

    for (const item of body.files) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as BatchFileInput).content === 'string' &&
        (item as BatchFileInput).content.trim().length > 0
      ) {
        const f = item as BatchFileInput;
        totalChars += f.content.length;
        if (totalChars > MAX_INPUT_CHARS * 2) {
          res.status(413).json({
            error: 'Combined batch size exceeds the ephemeral demo character limit.',
          });
          return;
        }
        validFiles.push({
          id: String(f.id || validFiles.length + 1),
          fileName: String(f.fileName || `file_${validFiles.length + 1}.txt`),
          relativePath: String(f.relativePath || f.fileName || `file_${validFiles.length + 1}.txt`),
          format: f.format === 'csv' ? 'csv' : 'text',
          content: f.content,
          sizeBytes: typeof f.sizeBytes === 'number' ? f.sizeBytes : f.content.length,
        });
      }
    }

    if (validFiles.length === 0) {
      res.status(400).json({ error: 'No non-empty CSV or TXT files found in batch.' });
      return;
    }

    const summary = analyzeBatchFiles(validFiles, options);
    res.json(summary);
  } catch {
    res.status(500).json({ error: 'Failed to process batch anonymization request.' });
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
