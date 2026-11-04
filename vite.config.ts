import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Agent worktrees live in .claude/ inside the project. Only that folder is ignored, so a
// dev server started inside a worktree still sees its own edits.
const claudeFolder = fileURLToPath(new URL('./.claude', import.meta.url)).replaceAll('\\', '/');

// Relative paths, so the build works under the GitHub Pages project URL.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    watch: { ignored: (path: string) => path.replaceAll('\\', '/').startsWith(claudeFolder) },
  },
  build: { chunkSizeWarningLimit: 2000 },
});
