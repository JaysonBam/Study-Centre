import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const webApps = ['availability', 'bookings', 'hexforge', 'printing-status'];
const areas = new Set(['app', 'pages', 'features', 'api', 'shared']);

export function importViolations(file, specifier, typeOnly = false) {
  const parts = file.replaceAll('\\', '/').split('/');
  const area = parts[0];
  let target;
  if (specifier.startsWith('@/')) target = specifier.slice(2);
  else if (specifier.startsWith('.'))
    target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
  const targetArea = target?.split('/')[0];
  const issues = [];
  if (specifier.startsWith('@supabase/') && area !== 'api') issues.push('service SDK imports belong in api/');
  if (target?.startsWith('api/_internal/') && area !== 'api') issues.push('API internals are private');
  if (area === 'api' && ['app', 'pages', 'features'].includes(targetArea))
    issues.push('API modules cannot depend on UI/features');
  if (area === 'shared' && ['app', 'pages', 'features'].includes(targetArea))
    issues.push('shared code cannot depend on features/pages/app');
  if (area === 'features' && ['app', 'pages'].includes(targetArea))
    issues.push('features cannot depend on routes or app startup');
  if (parts.includes('model') && !typeOnly && ['react', 'react-dom', 'react-router-dom'].includes(specifier))
    issues.push('model modules must not own React lifecycle');
  if (specifier.startsWith('@hexforge/windows-helper'))
    issues.push('use the shared helper contract, not the Electron app');
  return issues;
}

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(file)));
    else if (/\.(?:ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) files.push(file);
  }
  return files;
}

export async function checkArchitecture() {
  const findings = [];
  let checked = 0;
  for (const app of webApps) {
    const directory = path.join(root, 'apps', app, 'src');
    for (const file of await sourceFiles(directory)) {
      checked++;
      const relative = path.relative(directory, file).replaceAll('\\', '/');
      if (relative.includes('/') && !areas.has(relative.split('/')[0]))
        findings.push(`${app}/${relative}: unsupported top-level source area`);
      const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
      function inspect(node) {
        if (
          (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
          node.moduleSpecifier &&
          ts.isStringLiteral(node.moduleSpecifier)
        ) {
          const typeOnly = node.isTypeOnly || node.importClause?.isTypeOnly;
          for (const issue of importViolations(relative, node.moduleSpecifier.text, typeOnly))
            findings.push(`${app}/${relative}: ${issue}`);
        }
        if (
          ts.isImportTypeNode(node) &&
          ts.isLiteralTypeNode(node.argument) &&
          ts.isStringLiteral(node.argument.literal)
        ) {
          for (const issue of importViolations(relative, node.argument.literal.text, true))
            findings.push(`${app}/${relative}: ${issue}`);
        }
        ts.forEachChild(node, inspect);
      }
      inspect(source);
    }
  }
  return { checked, findings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkArchitecture();
  if (result.findings.length) {
    console.error(result.findings.join('\n'));
    process.exitCode = 1;
  } else console.log(`Architecture boundaries passed (${result.checked} source files).`);
}
