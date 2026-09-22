import { useId } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BriefingVideoButton } from '@shell/app/briefing-video-modal';
import type { TaskId } from '@shell/lib/day';
import type { InteractionPatternId } from '@shell/lib/client';
import { useClient } from '@shell/app/client-context';
import { cn } from '@kit/lib/utils';
import { HowToButton } from './how-to-card';

export interface OpenerProgress {
  done: number;
  total: number;
  /** What is being counted, in the plural: "trays loaded", "fridges checked", "rows reviewed". */
  noun: string;
}

export interface WorkspaceOpenerProps {
  taskId: TaskId;
  /** What to do here, one sentence starting with a verb. */
  what: string;
  /** How to do it on this screen: the gesture and its button alternative. Shown from "How do I do this?". */
  how: string;
  /** What finished looks like. Shown from "How do I do this?" and, for counted steps, as the live count. */
  done: string;
  /** A visible count for steps with several items. */
  progress?: OpenerProgress;
  /** Which kind of control this workspace uses, for "How do I do this?". */
  pattern?: InteractionPatternId;
  /** The current step, passed through to the "how" card. */
  step?: { title: string; instruction: string };
  tone?: 'light' | 'dark';
  className?: string;
  testId?: string;
}

export const OPENER_COPY = {
  what: 'What to do',
  how: 'How',
  done: 'Done when',
  briefing: 'Task briefing',
  count: (p: OpenerProgress) => `${p.done} of ${p.total} ${p.noun}`,
  allDone: (p: OpenerProgress) => `All ${p.total} ${p.noun}`,
};

/** Up to this many items the progress rail shows one notch per item; beyond it, a plain bar. */
const MAX_NOTCHES = 12;

/**
 * The one-line card at the top of every workspace: the job here in one sentence, the live
 * count where there are several things to get through, and one "How do I do this?" that
 * holds how to do it on this screen, what finished looks like and the control's pattern.
 * The step guide above the room keeps the current step, so nothing is said twice.
 */
export function WorkspaceOpener({ taskId, what, how, done, progress, pattern = 'tap', step, tone = 'light', className, testId = 'workspace-opener' }: WorkspaceOpenerProps) {
  const dark = tone === 'dark';
  const headingId = useId();
  const { taskBriefingVideo: TASK_BRIEFING_VIDEO } = useClient();

  return (
    <section
      data-testid={testId}
      aria-labelledby={headingId}
      className={cn(
        // shrink-0: an overflow-hidden flex item may otherwise be squeezed to nothing in a fixed-height column.
        '@container/opener shrink-0 overflow-hidden rounded-xl border border-t-2 border-t-primary shadow-sm',
        dark ? 'border-x-white/10 border-b-white/10 bg-zinc-950/85 text-white backdrop-blur-sm' : 'border-x-border border-b-border bg-white text-foreground',
        className,
      )}
    >
      {/* In a short window the card tightens so the work below it stays in view: the eyebrow is read out only, the sentence drops a step. */}
      <div className="flex flex-col gap-2 px-4 py-2.5 @2xl/opener:flex-row @2xl/opener:items-center @2xl/opener:gap-6 sm:px-5 short:gap-0.5 short:py-1.5">
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs font-bold uppercase tracking-[0.18em] short:sr-only', dark ? 'text-red-400' : 'text-primary')}>{OPENER_COPY.what}</p>
          <p id={headingId} className="mt-0.5 font-serif text-lg font-medium leading-snug tracking-tight @xl/opener:text-xl short:mt-0 short:text-base @xl/opener:short:text-lg">
            {what}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 @2xl/opener:justify-end">
          {progress && <ProgressRail progress={progress} dark={dark} />}
          <div className="flex items-center gap-1">
            <HowToButton pattern={pattern} step={step} screen={{ how, done }} tone={tone} className="-ml-2.5" />
            <span className={cn('h-4 w-px', dark ? 'bg-white/15' : 'bg-border')} aria-hidden="true" />
            <BriefingVideoButton videoId={TASK_BRIEFING_VIDEO[taskId]} tone={tone} variant="ghost" label={OPENER_COPY.briefing} className="min-h-11" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** One notch per item while there are few enough to count at a glance, otherwise a bar. */
function ProgressRail({ progress, dark }: { progress: OpenerProgress; dark: boolean }) {
  const total = Math.max(progress.total, 0);
  const doneCount = Math.min(Math.max(progress.done, 0), total);
  const complete = total > 0 && doneCount >= total;
  const share = total > 0 ? (doneCount / total) * 100 : 0;
  const empty = dark ? 'bg-white/25' : 'bg-zinc-200';
  const filled = complete ? 'bg-emerald-500' : 'bg-primary';

  return (
    <div className="flex w-full shrink-0 flex-col gap-1.5 @md/opener:w-44 @xl/opener:w-52 short:gap-1">
      <div className="flex h-1.5 w-full gap-0.5" aria-hidden="true">
        {total <= MAX_NOTCHES ? (
          Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn('h-full flex-1 rounded-full transition-colors duration-300', index < doneCount ? filled : empty)}
            />
          ))
        ) : (
          <span className={cn('h-full w-full overflow-hidden rounded-full', empty)}>
            <span className={cn('block h-full rounded-full transition-[width] duration-300', filled)} style={{ width: `${share}%` }} />
          </span>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        data-testid="opener-count"
        className={cn(
          'flex items-center gap-1 text-xs font-bold tabular-nums',
          complete ? (dark ? 'text-emerald-300' : 'text-emerald-700') : dark ? 'text-white/85' : 'text-foreground/85',
        )}
      >
        {complete && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
        {complete ? OPENER_COPY.allDone(progress) : OPENER_COPY.count(progress)}
      </p>
    </div>
  );
}
