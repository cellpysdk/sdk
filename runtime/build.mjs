import esbuild from 'esbuild';
import { execSync } from 'node:child_process';

const shared = {
  bundle: true,
  minify: false,
  target: ['es2020', 'chrome90', 'firefox90', 'safari14'],
  sourcemap: true,
};

await esbuild.build({
  ...shared,
  entryPoints: ['src/index.ts'],
  format: 'esm',
  outfile: 'dist/index.esm.js',
});

await esbuild.build({
  ...shared,
  entryPoints: ['src/index.ts'],
  format: 'cjs',
  outfile: 'dist/index.cjs.js',
});

await esbuild.build({
  ...shared,
  entryPoints: ['src/iife-entry.ts'],
  format: 'iife',
  globalName: 'CellpyRuntime',
  outfile: 'dist/runtime.iife.js',
});

// Emit TypeScript declarations (esbuild does not produce .d.ts files)
execSync('npx tsc --emitDeclarationOnly --declaration --declarationDir dist', {
  stdio: 'inherit',
});

console.log('Build complete.');
