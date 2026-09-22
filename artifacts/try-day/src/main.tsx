import { createRoot } from 'react-dom/client';

import App from '@shell/app/App';
import { ErrorBoundary } from '@shell/app/error-boundary';
import { kitchenClient } from '@client/index';

import './index.css';

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App client={kitchenClient} />
  </ErrorBoundary>,
);
