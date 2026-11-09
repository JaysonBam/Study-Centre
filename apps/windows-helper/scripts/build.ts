import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const helperRoot = path.resolve(import.meta.dirname, '..');
const outputRoot = path.resolve(helperRoot, 'dist');
if (path.dirname(outputRoot) !== helperRoot) throw new Error('Build output must remain inside the helper.');
await rm(outputRoot, { recursive: true, force: true });

const compiler = createRequire(import.meta.url).resolve('typescript/bin/tsc');
for (const config of ['tsconfig.json', 'tsconfig.renderer.json']) {
  const result = spawnSync(process.execPath, [compiler, '-p', path.join(helperRoot, config)], {
    cwd: helperRoot,
    windowsHide: true,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
await import('./copyAssets.ts');
