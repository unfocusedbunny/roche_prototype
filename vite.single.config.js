import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
/* One self-contained HTML file (script, styles and fonts inside it), for previews that can only host a single page.
   The real site uses vite.config.js. */
export default defineConfig({ base: './', plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single', assetsInlineLimit: 100000000 } });
