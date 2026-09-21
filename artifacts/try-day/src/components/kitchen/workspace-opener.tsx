import { CheckCircle2 } from 'lucide-react';
import { BriefingVideoButton } from '@/components/briefing-video-modal';
import type { TaskId } from '@/content/activities';
import { TASK_BRIEFING_VIDEO } from '@/content/briefing-videos';
import type { InteractionPatternId } from '@/content/interaction-patterns';
import { cn } from '@/lib/utils';
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
  /** How to do it on this screen: the gesture and its button alternative. */
  how: string;
  /** What finished looks like. */
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
  count: (p: OpenerProgress) => `${p.done} of ${p.total} ${p.noun}`,
  allDone: (p: OpenerProgress) => `All ${p.total} ${p.noun}`,
};

/**
 * The short instruction at the top of every workspace: what to do, how to do it
 * on this screen, what finished looks like, and the count where there are several
 * things to get through. Also where Terence's task briefing lives.
 */
export function WorkspaceOpener({ taskId, what, how, done, progress, pattern, step, tone = 'light', className, testId = 'workspace-opener' }: WorkspaceOpenerProps) {
  const dark = tone === 'dark';
  const complete = progress ? progress.done >= progress.total : false;
  const label = dark ? 'text-white/55' : 'text-muted-foreground';
  const body = dark ? 'text-white' : 'text-foreground';

  return (
    <section
      data-testid={testId}
      aria-label="What to do here"
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        dark ? 'border-white/15 bg-black/60 text-white' : 'border-border bg-white text-foreground',
        className,
      )}
    >
      <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-2 text-sm leading-snug md:grid-cols-[auto_1fr]">
        <dt className={cn('text-[11px] font-bold uppercase tracking-widest md:pt-0.5', label)}>{OPENER_COPY.what}</dt>
        <dd className={cn('font-bold', body)}>{what}</dd>
        <dt className={cn('text-[11px] font-bold uppercase tracking-widest md:pt-0.5', label)}>{OPENER_COPY.how}</dt>
        <dd className={dark ? 'text-white/85' : 'text-foreground/85'}>{how}</dd>
        <dt className={cn('text-[11px] font-bold uppercase tracking-widest md:pt-0.5', label)}>{OPENER_COPY.done}</dt>
        <dd className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', dark ? 'text-white/85' : 'text-foreground/85')}>
          <span>{done}</span>
          {progress && (
            <span
              role="status"
              aria-live="polite"
              data-testid="opener-count"
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums',
                complete
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : dark ? 'border-white/25 bg-white/10 text-white' : 'border-border bg-muted text-foreground',
                complete && dark && 'text-emerald-300',
              )}
            >
              {complete && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
              {complete ? OPENER_COPY.allDone(progress) : OPENER_COPY.count(progress)}
            </span>
          )}
        </dd>
      </dl>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <BriefingVideoButton videoId={TASK_BRIEFING_VIDEO[taskId]} tone={tone} />
        {pattern && <HowToButton pattern={pattern} step={step} tone={tone} />}
      </div>
    </section>
  );
}
