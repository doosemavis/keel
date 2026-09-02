import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // react and react-dom are peers; @keel/tokens is a peer too because the token
  // layer must resolve to exactly one copy in a consuming app.
  deps: { neverBundle: ['react', 'react-dom', 'react/jsx-runtime', '@keel/tokens'] },
});
