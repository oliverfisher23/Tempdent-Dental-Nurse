import { createRoot } from 'react-dom/client';

import App from '@shell/app/App';
import { ErrorBoundary } from '@shell/app/error-boundary';
import { tryClient } from '@client/index';

import './index.css';

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App client={tryClient} />
  </ErrorBoundary>,
);
