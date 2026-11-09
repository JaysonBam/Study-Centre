import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const helperRoot = path.resolve(import.meta.dirname, '..');
const rendererSource = path.join(helperRoot, 'src', 'renderer');
const rendererOutput = path.join(helperRoot, 'dist', 'src', 'renderer');
const websiteFavicon = path.resolve(helperRoot, '..', 'hexforge', 'public', 'favicon.svg');

await mkdir(rendererOutput, { recursive: true });
await Promise.all(
  ['settings.html', 'settings.css'].map((filename) =>
    copyFile(path.join(rendererSource, filename), path.join(rendererOutput, filename)),
  ),
);
await copyFile(websiteFavicon, path.join(rendererOutput, 'favicon.svg'));

// Remove stale source maps if a previous local compiler configuration emitted them.
await rm(path.join(rendererOutput, 'settings.js.map'), { force: true });

// The sandboxed renderer cannot resolve Node workspace imports. Bundle its shared protocol.
await build({
  entryPoints: [path.join(rendererSource, 'app', 'main.ts')],
  outfile: path.join(rendererOutput, 'settings.js'),
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
});
