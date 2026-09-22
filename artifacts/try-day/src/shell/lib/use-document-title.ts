import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useClient } from '@shell/app/client-context';
import type { DaySpec } from './day';

/** The browser tab and screen reader title for the screen the learner is on. */
export function documentTitleFor(path: string, spec: DaySpec, baseTitle: string): string {
  if (path === '/close') return `End of day | ${baseTitle}`;
  const match = /^\/task\/([^/]+)/.exec(path);
  const id = match?.[1];
  if (id && spec.TASK_ORDER.includes(id)) {
    return `Task ${spec.taskIndex(id) + 1} of ${spec.TASK_ORDER.length}: ${spec.getTask(id).title} | ${baseTitle}`;
  }
  return baseTitle;
}

/** Keeps document.title in step with the route, so each view is announced by name. */
export function useDocumentTitle() {
  const [path] = useLocation();
  const { brand, day: { spec } } = useClient();
  useEffect(() => {
    document.title = documentTitleFor(path, spec, brand.documentTitle);
  }, [path, spec, brand.documentTitle]);
}
