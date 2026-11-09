import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = JSON.parse(await readFile(new URL('./lint-baseline.json', import.meta.url), 'utf8'));
let newErrors = 0;

for (const app of ['availability', 'bookings', 'hexforge', 'printing-status']) {
  const directory = path.join(root, 'apps', app);
  const require = createRequire(path.join(directory, 'package.json'));
  const { ESLint } = require('eslint');
  const eslint = new ESLint({ cwd: directory });
  const results = await eslint.lintFiles(['.']);
  const existing = new Map(
    baseline[app].map((item) => [
      JSON.stringify([item.file, item.rule, item.message, item.severity]),
      item.count,
    ]),
  );
  let known = 0;
  let warnings = 0;
  const regressions = [];
  for (const result of results) {
    for (const message of result.messages) {
      if (message.severity !== 2) {
        warnings++;
        continue;
      }
      const file = path.relative(directory, result.filePath).replaceAll('\\', '/');
      const key = JSON.stringify([file, message.ruleId, message.message, message.severity]);
      const remaining = existing.get(key) || 0;
      if (remaining) {
        existing.set(key, remaining - 1);
        known++;
      } else {
        newErrors++;
        regressions.push({ ...result, messages: [message] });
      }
    }
  }
  console.log(
    `${app}: ${known} existing lint errors, ${warnings} warnings, ${regressions.length} new errors`,
  );
  if (regressions.length) console.error(await (await eslint.loadFormatter('stylish')).format(regressions));
}
if (newErrors) process.exitCode = 1;
else console.log('No new lint errors. npm run lint:strict reports all existing findings.');
