/**
 * Vite build for the effects layer (frontend/ → public/assets/build/).
 *
 * - The PHP site stays the server; Vite only bundles three.js, GSAP, Lenis
 *   and the code in frontend/ into hashed files.
 * - src/helpers.php → fx_entry() reads the manifest to find the entry file.
 * - base "./" keeps every chunk URL relative, so it works under any path
 *   and with the strict CSP (script-src 'self').
 */

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false, // public/ is the PHP document root, not a Vite asset folder
  build: {
    outDir: 'public/assets/build',
    emptyOutDir: true,
    manifest: true,
    target: 'es2022',
    rollupOptions: { input: 'frontend/main.js' },
  },
});
