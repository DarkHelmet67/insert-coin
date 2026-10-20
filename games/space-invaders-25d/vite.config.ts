import { defineConfig } from 'vite';

// One HTML page, one CSS file, one ES module bundle: no code splitting, no legacy targets.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    // Three.js makes this bundle about 500 kB (125 kB compressed): expected, not a mistake.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: false,
        entryFileNames: 'game.js',
        assetFileNames: 'game.[ext]',
      },
    },
  },
});
