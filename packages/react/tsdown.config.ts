import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/specs.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // react and react-dom are peers; @keel/tokens is a peer too because the token
  // layer must resolve to exactly one copy in a consuming app.
  // @keel/specs is a real dependency now, not bundled: a consumer who also
  // installs it directly must resolve one copy, and the subpath re-export is
  // meant to be free for anyone who never imports it.
  deps: { neverBundle: ['react', 'react-dom', 'react/jsx-runtime', '@keel/tokens', '@keel/specs'] },
});
