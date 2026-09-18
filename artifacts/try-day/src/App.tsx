import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Intro from '@/pages/intro';
import Close from '@/pages/close';
import HandoverTask from '@/pages/tasks/take-the-handover';
import DeliveryTask from '@/pages/tasks/check-the-delivery-in';
import ChillTask from '@/pages/tasks/chill-the-event-batch';
import DietaryTask from '@/pages/tasks/check-the-dietary-list';
import HandoverKitchenTask from '@/pages/tasks/hand-the-kitchen-on';
import { ProgressProvider, useProgress } from '@/lib/progress-store';
import { isTestMode } from '@/lib/simulation';
import { LearningDesignerPanel } from '@/components/learning-designer-panel';
import { ExperienceViewportProvider } from '@/lib/experience-viewport';
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
  return (
    <RoutedErrorBoundary key={isTestMode() ? progress.startedAt ?? 'new-test' : undefined}>
      <Switch>
        <Route path="/" component={Intro} />
        <Route path="/close" component={Close} />
        <Route path="/task/take-the-handover" component={HandoverTask} />
        <Route path="/task/check-the-delivery-in" component={DeliveryTask} />
        <Route path="/task/chill-the-event-batch" component={ChillTask} />
        <Route path="/task/check-the-dietary-list" component={DietaryTask} />
        <Route path="/task/hand-the-kitchen-on" component={HandoverKitchenTask} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ProgressProvider>
            <ExperienceViewportProvider>
              <TestModeNavigationGuard />
              <Router />
              <LearningDesignerPanel />
            </ExperienceViewportProvider>
          </ProgressProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
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
