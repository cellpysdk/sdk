import esbuild from 'esbuild';
import { execSync } from 'node:child_process';

const shared = {
  entryPoints: ['src/index.tsx'],
  bundle: true,
  // External deps — resolved by the consumer's bundler (Next.js, Vite, etc.)
  // This also preserves process.env.* references for the consumer to replace.
  external: ['react', 'react/jsx-runtime', 'react-dom', '@cellpysdk/runtime'],
  platform: 'neutral',   // keeps process.env.* as-is (not replaced with {})
  target: ['es2020'],
  sourcemap: true,
};

await esbuild.build({ ...shared, format: 'esm', outfile: 'dist/index.esm.js' });
await esbuild.build({ ...shared, format: 'cjs', outfile: 'dist/index.cjs.js' });

execSync('npx tsc --emitDeclarationOnly --declaration --declarationDir dist', {
  stdio: 'inherit',
});

console.log('Build complete.');
