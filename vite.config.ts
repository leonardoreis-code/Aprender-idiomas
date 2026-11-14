import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev, rode também `npm run dev:api` (porta 8787) para TTS/STT/professor com a chave da ElevenLabs.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
  test: { environment: 'node' },
} as never);
