import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { TASK_ORDER, type TaskId } from '@/content/activities';
import { getTask, taskIndex } from '@/lib/simulation';

const BASE_TITLE = "art'otel Sous Chef Try Day";

/** The browser tab and screen reader title for the screen the learner is on. */
export function documentTitleFor(path: string): string {
  if (path === '/close') return `End of day | ${BASE_TITLE}`;
  const match = /^\/task\/([^/]+)/.exec(path);
  const id = match?.[1] as TaskId | undefined;
  if (id && TASK_ORDER.includes(id)) {
    return `Task ${taskIndex(id) + 1} of ${TASK_ORDER.length}: ${getTask(id).title} | ${BASE_TITLE}`;
  }
  return BASE_TITLE;
}

/** Keeps document.title in step with the route, so each view is announced by name. */
export function useDocumentTitle() {
  const [path] = useLocation();
  useEffect(() => {
    document.title = documentTitleFor(path);
  }, [path]);
}
