import assert from 'node:assert/strict';
import test from 'node:test';
import { violationsFor } from './check-public.mjs';

test('configuration examples accept blank values and local endpoints only', () => {
  assert.deepEqual(
    violationsFor(
      'apps/sample/.env.example',
      'VITE_SUPABASE_URL=\nLOCAL_URL=http://localhost:5173\nPORT=5173\n',
    ),
    [],
  );
  assert.ok(violationsFor('apps/sample/.env', '').includes('private environment file'));
  assert.ok(
    violationsFor('apps/sample/.env.example', 'TOKEN=not-a-placeholder').includes(
      'non-placeholder environment example',
    ),
  );
});

test('public checks flag credentials and captures without returning their values', () => {
  const privateKey = ['-----BEGIN', 'PRIVATE KEY-----'].join(' ');
  const rules = violationsFor('credentials.pem', privateKey);
  assert.ok(rules.includes('private key literal'));
  assert.ok(rules.includes('private key, export or capture'));
  assert.ok(!JSON.stringify(rules).includes(privateKey));
  assert.ok(violationsFor('capture.har', '').length > 0);
  assert.ok(violationsFor('.vercel/project.json', '{}').includes('local provider metadata'));
});

test('identities and endpoints distinguish artificial data from deployed configuration', () => {
  assert.deepEqual(
    violationsFor('fixture.ts', 'staff@example.invalid student@example.com https://fixture.invalid'),
    [],
  );
  const email = ['person', 'organization'].join('@') + '.org';
  assert.ok(violationsFor('fixture.ts', email).includes('non-fixture email address'));
  const hosted = 'https://' + ['privateproject', 'supabase', 'co'].join('.');
  assert.ok(violationsFor('README.md', hosted).includes('deployed service endpoint'));
  assert.deepEqual(violationsFor('README.md', 'https://vercel.com/docs/monorepos'), []);
  const dashboard = 'https://vercel.com/' + ['example-account', 'example-project'].join('/');
  assert.ok(violationsFor('README.md', dashboard).includes('private dashboard link'));
});
