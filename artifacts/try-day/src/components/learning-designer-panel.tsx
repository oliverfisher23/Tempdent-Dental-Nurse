import { useState } from 'react';
import { useLocation } from 'wouter';
import { TASK_ORDER, type TaskId } from '@/content/activities';
import { isTestMode } from '@/lib/simulation';
import { useProgress } from '@/lib/progress-store';

const labels: Record<TaskId, string> = {
  'take-the-handover': 'Task 1',
  'check-the-delivery-in': 'Task 2',
  'chill-the-event-batch': 'Task 3',
  'check-the-dietary-list': 'Task 4',
  'hand-the-kitchen-on': 'Task 5',
};

const pathFor = (id: TaskId) => `/task/${id}`;

export function LearningDesignerPanel() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { jumpToTestTarget } = useProgress();
  if (!isTestMode()) return null;

  const jump = (target: TaskId | null | undefined, path: string) => {
    jumpToTestTarget(target);
    navigate(`${path}${path.includes('?') ? '&' : '?'}testMode=1`);
  };

  return (
    <aside className="fixed right-3 top-3 z-[100] w-auto max-w-[calc(100vw-1.5rem)] font-sans" aria-label="Learning designer test controls">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="ml-auto block rounded-md border-2 border-amber-700 bg-amber-300 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-950 shadow-lg"
      >
        Designer test
      </button>
      {open && (
        <div className="mt-2 rounded-md border border-amber-700 bg-amber-50 p-3 text-amber-950 shadow-xl">
          <p className="mb-2 max-w-[15rem] text-xs leading-relaxed">
            Session-only fixtures. Learner progress is not changed.
          </p>
          <nav className="grid grid-cols-2 gap-1" aria-label="Test destinations">
            <button type="button" className="rounded border border-amber-700 px-2 py-1 text-left text-xs hover:bg-amber-200" onClick={() => jump(undefined, '/')}>Briefing</button>
            {TASK_ORDER.map((id) => (
              <button key={id} type="button" className="rounded border border-amber-700 px-2 py-1 text-left text-xs hover:bg-amber-200" onClick={() => jump(id, pathFor(id))}>{labels[id]}</button>
            ))}
            <button type="button" className="rounded border border-amber-700 px-2 py-1 text-left text-xs hover:bg-amber-200" onClick={() => jump(null, '/close')}>Close</button>
            <button type="button" className="col-span-2 rounded border border-amber-900 bg-amber-800 px-2 py-1 text-left text-xs text-white hover:bg-amber-900" onClick={() => jump(undefined, '/')}>Reset test session</button>
          </nav>
        </div>
      )}
    </aside>
  );
}