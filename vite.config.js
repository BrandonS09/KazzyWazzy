import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [
    {
      name: 'copy-files',
      apply: 'build',
      enforce: 'post',
      async generateBundle() {
        const files = ['games.js', 'main.js', 'style.css'];
        files.forEach(file => {
          const src = path.resolve(__dirname, file);
          const dest = path.resolve(__dirname, 'dist', file);
          if (fs.existsSync(src)) {
            const content = fs.readFileSync(src, 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: file,
              source: content
            });
          }
        });
      }
    }
  ]
});
