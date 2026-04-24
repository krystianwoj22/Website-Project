/**
 * Production server for the Claude Creator Catalyst app.
 *
 * What it does:
 *   1. Serves the compiled React/Vite build from the /dist folder.
 *   2. Falls back to index.html for any unknown route (SPA routing).
 *   3. Optional: proxies Gemini API calls through /api/gemini so the
 *      GEMINI_API_KEY stays on the server and is never shipped to the
 *      browser. Safer than embedding it in the client build.
 *
 * Use this when hosting on:
 *   - Hostinger VPS / Cloud Hosting (Node.js enabled)
 *   - Hostinger's Node.js app in hPanel
 *   - Any Node host (Render, Railway, Fly.io, a self-managed server, etc.)
 *
 * Shared-hosting-only Hostinger plans CANNOT run this file — on those,
 * just upload /dist contents directly and ignore server.js.
 *
 * Run locally:
 *   npm run build
 *   node server.js
 */

import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({path: '.env.local'});
dotenv.config(); // fallback to .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

// --- Middleware ---
app.use(express.json({limit: '1mb'}));

// Basic request logger (comment out if noisy)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Health check (useful for Hostinger monitoring) ---
app.get('/api/health', (_req, res) => {
  res.json({status: 'ok', timestamp: new Date().toISOString()});
});

// --- Optional server-side Gemini proxy ---
// Call this from the client instead of using the key client-side.
// Example client: fetch('/api/gemini', { method: 'POST', body: JSON.stringify({prompt}) })
const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey) {
  const ai = new GoogleGenAI({apiKey: geminiKey});

  app.post('/api/gemini', async (req, res) => {
    try {
      const {prompt, model = 'gemini-2.5-flash'} = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({error: 'Missing "prompt" string in body.'});
      }

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      res.json({text: result.text});
    } catch (err) {
      console.error('Gemini proxy error:', err);
      res.status(500).json({error: 'Gemini request failed.'});
    }
  });
} else {
  console.warn(
    '[server] GEMINI_API_KEY not set — /api/gemini proxy is disabled. ' +
      'Set it in .env.local or your hosting env vars to enable.',
  );
}

// --- Static assets from the Vite build ---
app.use(
  express.static(DIST_DIR, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
      // index.html should never be cached long — it references hashed assets.
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }),
);

// --- SPA fallback: any non-API GET goes to index.html ---
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({error: 'Internal server error.'});
});

// --- Start ---
app.listen(PORT, HOST, () => {
  console.log(`\n  Claude Creator Catalyst server`);
  console.log(`  Listening on http://${HOST}:${PORT}`);
  console.log(`  Serving static files from: ${DIST_DIR}\n`);
});
