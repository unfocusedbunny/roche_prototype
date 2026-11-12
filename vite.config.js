import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
/* base './' keeps every path relative, so the built page works from any folder or host */
/* two pages: the prototype, and "How Sangui was made" */
export default defineConfig({ base: './', plugins: [react()], build: { rollupOptions: { input: ['index.html', 'how-it-was-made/index.html'] } } });
