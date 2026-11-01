import { defineConfig } from 'vite';

// Relative paths, so the build works under the GitHub Pages project URL.
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true, watch: { ignored: ['**/.claude/**'] } },
  build: { chunkSizeWarningLimit: 2000 },
});
