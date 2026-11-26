/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build works on GitHub Pages, from a sub-folder, and offline from one local server.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5200, strictPort: true },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
