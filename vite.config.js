import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
/* base './' keeps every path relative, so the built page works from any folder or host */
export default defineConfig({ base: './', plugins: [react()] });
