import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './error-boundary';
import { Toaster } from '@kit/ui/toaster';
import { TooltipProvider } from '@kit/ui/tooltip';
import NotFound from '@shell/pages/not-found';
import Intro from '@shell/pages/intro';
import { ProgressProvider, useProgress } from '@shell/lib/progress-store';
import { isTestMode } from '@shell/lib/day';
import { TryClientProvider, useClient } from './client-context';
import type { TryClient } from '@shell/lib/client';
import { LearningDesignerPanel } from './learning-designer-panel';
import { ExperienceViewportProvider } from '@shell/lib/experience-viewport';
import { useDocumentTitle } from '@shell/lib/use-document-title';
import { MotionConfig } from 'framer-motion';
import {
  Route,
  Switch,
  useLocation,
  useSearch,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const { progress } = useProgress();
  const { day: { spec: { TASK_ORDER } }, taskPages, ClosePage } = useClient();
  useDocumentTitle();
  return (
    <RoutedErrorBoundary key={isTestMode() ? progress.startedAt ?? 'new-test' : undefined}>
      <Switch>
        <Route path="/" component={Intro} />
        <Route path="/close" component={ClosePage} />
        {TASK_ORDER.map((id) => (
          <Route key={id} path={`/task/${id}`} component={taskPages[id]} />
        ))}
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

/** The shell, running one client's day. Mounted from src/main.tsx with the client object. */
function App<TS extends Record<string, unknown>>({ client }: { client: TryClient<TS> }) {
  return (
    <MotionConfig reducedMotion="user">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <TryClientProvider client={client}>
            <ProgressProvider>
              <ExperienceViewportProvider>
                <SkipLink />
                <TestModeNavigationGuard />
                <Router />
                <LearningDesignerPanel />
              </ExperienceViewportProvider>
            </ProgressProvider>
          </TryClientProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
    </MotionConfig>
  );
}

function SkipLink() {
  const { copy: { accessibility } } = useClient();
  return <a className="skip-link" href="#main-activity">{accessibility.skip}</a>;
}

function TestModeNavigationGuard() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (isTestMode() && params.get('testMode') !== '1') {
      params.set('testMode', '1');
      setLocation(`${location}?${params.toString()}`, { replace: true });
    }
  }, [location, search, setLocation]);
  return null;
}

export default App;
