import esbuild from 'esbuild';
import { execSync } from 'node:child_process';

const shared = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: ['vue', '@cellpysdk/runtime'],
  platform: 'neutral',   // preserves process.env.* for the consumer's bundler
  target: ['es2020'],
  sourcemap: true,
};

await esbuild.build({ ...shared, format: 'esm', outfile: 'dist/index.esm.js' });
await esbuild.build({ ...shared, format: 'cjs', outfile: 'dist/index.cjs.js' });

execSync('npx tsc --emitDeclarationOnly --declaration --declarationDir dist', {
  stdio: 'inherit',
});

console.log('Build complete.');
