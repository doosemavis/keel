import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['dist/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: false,
  sourcemap: true,
  // The package is "type": "module", so plain .js is unambiguously ESM.
  // Keeping .js/.d.ts here means the exports map reads the way a consumer expects.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
});
