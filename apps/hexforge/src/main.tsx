import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import '@/index.css';

if (new URLSearchParams(window.location.search).get('perf') === '1') {
  const { installPerformanceDiagnostics } = await import('@/shared/lib/performanceDiagnostics');
  installPerformanceDiagnostics();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
