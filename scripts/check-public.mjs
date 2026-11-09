import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'release',
  'coverage',
  'test-results',
  'playwright-report',
  '.local',
  'tmp',
  'output',
  '.vercel',
  '.temp',
  '.branches',
]);
const textExtensions = new Set([
  '.md',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '.toml',
  '.sql',
  '.html',
  '.css',
  '.yml',
  '.yaml',
  '.sh',
  '.ps1',
  '.txt',
  '.svg',
]);

export function violationsFor(relative, text = '') {
  const rules = [];
  const name = path.posix.basename(relative);
  if (/^\.env(?:\.|$)/.test(name) && !/^\.env(?:\..+)?\.example$/.test(name))
    rules.push('private environment file');
  if (/\.(pem|key|p12|pfx|dump|backup|har|mp4|csv|xlsx)$/i.test(name))
    rules.push('private key, export or capture');
  if (/(?:^|\/)(?:\.vercel|\.temp|\.branches)\//.test(relative)) rules.push('local provider metadata');
  if (/(?:^|\/)(?:docs\/pr|docs\/performance|docs\/sidebar-scrollbars)\//.test(relative))
    rules.push('operational capture directory');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) rules.push('private key literal');
  if (/\beyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/.test(text))
    rules.push('JWT literal');
  if (
    /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|AIza[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9_-]{15,})\b/.test(
      text,
    )
  )
    rules.push('access token literal');
  if (/\bpostgres(?:ql)?:\/\/[^\s'"<>]+:[^\s'"<>]+@/i.test(text)) rules.push('database credential URL');
  if (/https?:\/\/[a-z0-9-]+\.(?:supabase\.co|vercel\.app)(?:[/:\s'"`]|$)/i.test(text))
    rules.push('deployed service endpoint');
  if (/https?:\/\/(?:[a-z0-9-]+\.)*miningcentre\.co\.za\b/i.test(text)) rules.push('production domain');
  if (
    /https?:\/\/(?:supabase\.com\/dashboard\/project|vercel\.com\/(?!docs(?:[/?#]|$))[^/\s]+\/[^/\s]+)(?:\/|\b)/i.test(
      text,
    )
  )
    rules.push('private dashboard link');
  if (/[A-Z]:\\Users\\[^\s\\]+/i.test(text)) rules.push('personal workstation path');
  const emails = text.match(/[\w.+%-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || [];
  const allowedEmail = (email) => {
    const domain = email.split('@')[1].toLowerCase();
    // These deliberately synthetic addresses exercise the institution-specific parser.
    if (
      relative.startsWith('apps/hexforge/') &&
      relative.endsWith('.test.ts') &&
      /^u12345678@tuks\.co\.za$/i.test(email)
    )
      return true;
    return (
      /(?:^|\.)(?:example\.(?:com|org|net)|[^@]*\.invalid|[^@]*\.test)$/i.test(domain) ||
      ['example.com', 'example.org', 'example.net', 'email.com'].includes(domain)
    );
  };
  // Registry lock metadata can include upstream maintainers' public contact details.
  // Endpoint and credential rules still apply to the complete lockfile.
  if (name !== 'package-lock.json' && emails.some((email) => !allowedEmail(email)))
    rules.push('non-fixture email address');
  if (name.endsWith('.env.example')) {
    for (const line of text.split(/\r?\n/)) {
      if (/^\s*(?:#|$)/.test(line)) continue;
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (
        match &&
        match[2] &&
        !/^(?:\d+|true|false|https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?[^\s]*)$/.test(match[2])
      )
        rules.push('non-placeholder environment example');
    }
  }
  if (/^(?:<{7}|={7}|>{7})(?: |$)/m.test(text)) rules.push('unresolved merge marker');
  return [...new Set(rules)];
}

async function filesIn(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name))
        files.push(...(await filesIn(path.join(directory, entry.name), relative + '/')));
    } else if (entry.isFile()) files.push(relative);
  }
  return files;
}

export async function checkPublic(directory = root) {
  // Include staged/tracked files even when ignored, so accidental forced adds are checked.
  let gitFiles = [];
  try {
    gitFiles = execFileSync('git', ['ls-files', '--cached', '-z'], {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\0')
      .filter(Boolean);
  } catch {
    /* A source snapshot can be checked before git init. */
  }
  const files = [...new Set([...(await filesIn(directory)), ...gitFiles])].sort();
  const findings = [];
  for (const relative of files) {
    const bytes = await readFile(path.join(directory, relative));
    const isText =
      textExtensions.has(path.extname(relative)) || path.posix.basename(relative).startsWith('.env');
    const text = isText ? bytes.toString('utf8') : '';
    const rules = violationsFor(relative, text);
    if (isText && (bytes.includes(0) || text.includes('\ufffd'))) rules.push('non-UTF-8 text');
    for (const rule of rules) findings.push(`${relative}: ${rule}`);
  }
  return { files: files.length, findings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkPublic();
  if (result.findings.length) {
    console.error(result.findings.join('\n'));
    console.error(
      `Public-file check failed: ${result.findings.length} finding(s). Potential values are redacted.`,
    );
    process.exitCode = 1;
  } else console.log(`Public-file check passed (${result.files} files). Review new assets manually.`);
}
