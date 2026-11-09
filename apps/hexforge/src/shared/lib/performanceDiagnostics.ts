// Opt-in, local browser diagnostics. Only operation names and timings are recorded.
// No credentials, request bodies, project IDs or email content leave the browser.
export function installPerformanceDiagnostics() {
  const samples: Array<{ name: string; start: number; ms: number; status?: number; responseBytes?: number }> =
    [];
  const pending = new Map<string, number>();
  let testFunctionRegion: string | null = null;
  const panel = document.createElement('details');
  panel.style.cssText =
    'position:fixed;bottom:4px;right:4px;z-index:1000;max-height:40vh;max-width:80vw;overflow:auto;background:white;color:#172033;border:1px solid #94a3b8;padding:8px;font:11px monospace';
  const title = document.createElement('summary');
  title.textContent = 'Performance timings (local only)';
  const output = document.createElement('pre');
  output.id = 'hexforge-performance-report';
  panel.append(title, output);
  const decoderTest = document.createElement('button');
  decoderTest.textContent = 'Measure 8 MiB attachment decoding';
  decoderTest.onclick = async () => {
    decoderTest.disabled = true;
    try {
      const { decodeBase64UrlBytes } = await import('@/api/gmail/decoding');
      const fixture = new Uint8Array(8 * 1024 * 1024);
      for (let index = 0; index < fixture.length; index++) fixture[index] = index % 256;
      const chunks: string[] = [];
      for (let index = 0; index < fixture.length; index += 0x8000)
        chunks.push(String.fromCharCode(...fixture.subarray(index, index + 0x8000)));
      const encoded = btoa(chunks.join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const original = (value: string) => {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
      };
      for (let repetition = 0; repetition < 5; repetition++) {
        for (const [name, decode] of [
          ['decoder:before', original],
          ['decoder:after', decodeBase64UrlBytes],
        ] as const) {
          const time = performance.now();
          const bytes = decode(encoded);
          samples.push({ name, start: Math.round(time), ms: Math.round(performance.now() - time) });
          if (bytes.length !== fixture.length || bytes.some((value, index) => value !== fixture[index]))
            throw new Error('Decoded attachment bytes differed.');
          render();
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }
      decoderTest.textContent = 'Decoding complete — all bytes verified';
    } catch (error) {
      decoderTest.textContent = error instanceof Error ? error.message : 'Decoding test failed';
    } finally {
      decoderTest.disabled = false;
    }
  };
  panel.append(decoderTest);
  const regionTest = document.createElement('button');
  regionTest.textContent = 'Compare Gmail function regions (read only)';
  regionTest.onclick = async () => {
    regionTest.disabled = true;
    try {
      const { getGmailAccountEmail } = await import('@/api/gmail/threads');
      for (let repetition = 0; repetition < 5; repetition++) {
        for (const region of [null, 'eu-central-1']) {
          testFunctionRegion = region;
          const time = performance.now();
          await getGmailAccountEmail();
          samples.push({
            name: `gmail-region:${region || 'automatic'}`,
            start: Math.round(time),
            ms: Math.round(performance.now() - time),
          });
          render();
        }
      }
      regionTest.textContent = 'Region comparison complete';
    } catch (error) {
      regionTest.textContent = error instanceof Error ? error.message : 'Region test failed';
    } finally {
      testFunctionRegion = null;
      regionTest.disabled = false;
    }
  };
  panel.append(regionTest);
  document.body.append(panel);
  const render = () => {
    output.textContent = JSON.stringify({ samples, pending: [...pending.keys()] }, null, 2);
  };
  const finish = (name: string) => {
    const start = pending.get(name);
    if (start === undefined) return;
    samples.push({ name, start: Math.round(start), ms: Math.round(performance.now() - start) });
    pending.delete(name);
    render();
  };
  const start = (name: string, time = performance.now()) => {
    pending.set(name, time);
    render();
  };
  start('page:usable', 0);
  if (window.location.pathname === '/') {
    start('unread-emails:first-result', 0);
    start('unread-emails:complete', 0);
  }
  let route = window.location.pathname;
  let unreadWasBusy = false;
  let unreadCheckedAtStart: string | null = null;
  const check = () => {
    if (route !== window.location.pathname) {
      route = window.location.pathname;
      if (!pending.has('route:usable')) start('route:usable');
    }
    const screen =
      route === '/'
        ? 'dashboard'
        : route === '/projects'
          ? 'projects'
          : route === '/project/new'
            ? 'new-project'
            : route.startsWith('/project/')
              ? 'project'
              : '';
    if (
      screen &&
      (document.querySelector(`[data-performance-screen="${screen}"][data-performance-ready="true"]`) ||
        document.querySelector('[data-performance-ready="true"]:not([data-performance-screen])'))
    ) {
      finish('page:usable');
      finish('route:usable');
    }
    if (document.querySelector('[aria-labelledby="gmail-picker-title"] .space-y-3 > button'))
      finish('gmail-picker:first-thread');
    const picker = document.querySelector('[aria-labelledby="gmail-picker-title"]');
    if (
      picker?.getAttribute('data-performance-loading') === 'false' &&
      (picker.querySelector('.space-y-3 > button') || picker.textContent?.includes('No recent'))
    )
      finish('gmail-picker:complete');
    if (document.querySelector('[aria-label="Main Gmail Thread correspondence"] article'))
      finish('correspondence:first-message');
    if (document.querySelector('[data-performance-email-ready="true"]')) finish('unread-emails:first-result');
    if (document.querySelector('[data-performance-email-complete="true"]')) finish('unread-emails:complete');
    const unreadRefresh = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Refresh unread Gmail reminder"]',
    );
    const unreadBusy = Boolean(unreadRefresh?.disabled);
    const unreadVisible = /You have \d+ unread print emails?/.test(
      document.getElementById('root')?.textContent || '',
    );
    const checkedAt =
      document
        .querySelector('[data-performance-email-checked-at]')
        ?.getAttribute('data-performance-email-checked-at') ?? null;
    if (
      unreadBusy &&
      !unreadWasBusy &&
      !pending.has('unread-emails:complete') &&
      !pending.has('unread-refresh:complete')
    ) {
      unreadCheckedAtStart = checkedAt;
      start('unread-refresh:first-result');
      start('unread-refresh:complete');
    }
    unreadWasBusy = unreadBusy;
    if (unreadVisible && unreadRefresh && !unreadBusy) {
      finish('unread-emails:first-result');
      finish('unread-emails:complete');
      finish('unread-refresh:first-result');
      finish('unread-refresh:complete');
    } else if (checkedAt && checkedAt !== unreadCheckedAtStart) finish('unread-refresh:first-result');
  };
  // Observe React's root only, so updating this report cannot trigger itself.
  new MutationObserver(() => requestAnimationFrame(check)).observe(document.getElementById('root')!, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  document.addEventListener(
    'click',
    (event) => {
      const target = (event.target as Element).closest('button,a,[role="button"],.cursor-pointer');
      if (!target || panel.contains(target)) return;
      const label = target.getAttribute('aria-label') || target.textContent?.trim() || '';
      if (
        /^(Import from Gmail|Link Main Gmail Thread|Replace Main Gmail Thread|Choose another thread|Refresh recent Gmail threads)$/.test(
          label,
        )
      ) {
        start('gmail-picker:first-thread');
        start('gmail-picker:complete');
      } else if (label === 'Refresh unread Gmail reminder') {
        unreadCheckedAtStart =
          document
            .querySelector('[data-performance-email-checked-at]')
            ?.getAttribute('data-performance-email-checked-at') ?? null;
        start('unread-refresh:first-result');
        start('unread-refresh:complete');
      } else if (label === 'View Correspondence' || label === 'Messages')
        start('correspondence:first-message');
      else start('route:usable');
      requestAnimationFrame(check);
    },
    true,
  );
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const time = performance.now();
    const url = new URL(args[0] instanceof Request ? args[0].url : String(args[0]), window.location.origin);
    if (testFunctionRegion && url.pathname === '/functions/v1/gmail-proxy' && !(args[0] instanceof Request)) {
      url.searchParams.set('forceFunctionRegion', testFunctionRegion);
      args[0] = url.href;
    }
    // Keep names of tables/functions, never query strings containing identifiers.
    const endpoint = url.pathname.startsWith('/rest/v1/')
      ? url.pathname
      : url.pathname.startsWith('/functions/v1/')
        ? url.pathname
        : url.hostname === '127.0.0.1'
          ? 'local-helper'
          : 'other';
    try {
      const response = await originalFetch(...args);
      const bytes = await response.clone().arrayBuffer();
      samples.push({
        name: `request:${endpoint}`,
        start: Math.round(time),
        ms: Math.round(performance.now() - time),
        status: response.status,
        responseBytes: bytes.byteLength,
      });
      render();
      return response;
    } catch (error) {
      samples.push({
        name: `request:${endpoint}`,
        start: Math.round(time),
        ms: Math.round(performance.now() - time),
        status: 0,
      });
      render();
      throw error;
    }
  };
}
