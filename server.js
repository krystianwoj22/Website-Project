import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API Route for AI Synthesis
  app.post('/api/synthesize', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are the Claude Creator Catalyst AI. The user will provide a trend, topic, or concept. You must synthesize it into two short paragraphs (max 3 sentences each):
      1. Audience Blueprint: Identify the primary demographic and how they resonate with this concept. Focus on "shift detected" or "high resonance".
      2. Content Protocol: Suggest a strategic narrative approach to deploy this concept (e.g. "Phase 3 Narrative", "asynchronous educational content").
      Return ONLY a valid JSON object with this shape: { "blueprint": "text", "protocol": "text", "id1": "random-id", "id2": "random-id" }. Do not use markdown blocks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(responseText);
      
      res.json(data);
    } catch (error) {
      console.error("AI Synthesis Error:", error);
      res.status(500).json({ error: 'Failed to synthesize prompt. Please try again.' });
    }
  });

  // Vite integration for development context
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production from public directory
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
