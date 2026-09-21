import { useId } from 'react';
import { CheckCircle2, Flag, Hand } from 'lucide-react';
import { BriefingVideoButton } from '@/components/briefing-video-modal';
import type { TaskId } from '@/content/activities';
import { TASK_BRIEFING_VIDEO } from '@/content/briefing-videos';
import type { InteractionPatternId } from '@/content/interaction-patterns';
import { cn } from '@/lib/utils';
import { HowToButton, PATTERN_ICONS } from './how-to-card';

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

/** Up to this many items the progress rail shows one notch per item; beyond it, a plain bar. */
const MAX_NOTCHES = 12;

/**
 * The short instruction at the top of every workspace, laid out like the card a head
 * chef clips to your station: the job in one line, how to do it on this screen, what
 * finished looks like, and a progress rail where there are several things to get through.
 * Also where Terence's task briefing lives.
 */
export function WorkspaceOpener({ taskId, what, how, done, progress, pattern, step, tone = 'light', className, testId = 'workspace-opener' }: WorkspaceOpenerProps) {
  const dark = tone === 'dark';
  const headingId = useId();
  const HowIcon = pattern ? PATTERN_ICONS[pattern] : Hand;

  const label = cn('text-[10px] font-bold uppercase tracking-[0.18em]', dark ? 'text-white/55' : 'text-muted-foreground');
  const body = cn('text-sm leading-snug', dark ? 'text-white/90' : 'text-foreground/90');
  const iconWell = cn(
    'mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
    dark ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary',
  );
  const rule = dark ? 'border-white/10' : 'border-border';

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
      {/* The job, in the display face, with the count beside it once the card is wide enough */}
      <div className="flex flex-col gap-3 px-4 pb-2.5 pt-2.5 @md/opener:flex-row @md/opener:items-start @md/opener:justify-between @md/opener:gap-6 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className={cn(label, 'text-primary')}>{OPENER_COPY.what}</p>
          <p id={headingId} className="mt-0.5 font-serif text-lg font-medium leading-snug tracking-tight @xl/opener:text-xl">
            {what}
          </p>
        </div>
        {progress && <ProgressRail progress={progress} dark={dark} />}
      </div>

      {/* How and done-when, side by side only when the card is wide enough for both to read in two lines */}
      <dl className={cn('grid gap-x-8 gap-y-2 border-t px-4 py-2.5 @2xl/opener:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:px-5', rule)}>
        <div className="flex gap-3">
          <span className={iconWell} aria-hidden="true"><HowIcon className="h-3.5 w-3.5" /></span>
          <div className="min-w-0">
            <dt className={label}>{OPENER_COPY.how}</dt>
            <dd className={cn(body, 'mt-0.5')}>{how}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <span className={iconWell} aria-hidden="true"><Flag className="h-3.5 w-3.5" /></span>
          <div className="min-w-0">
            <dt className={label}>{OPENER_COPY.done}</dt>
            <dd className={cn(body, 'mt-0.5')}>{done}</dd>
          </div>
        </div>
      </dl>

      {/* Help lives in one quiet row at the bottom, so the instruction gets the full width above */}
      <div className={cn('flex flex-wrap items-center gap-x-1 gap-y-1 border-t px-2 py-1 sm:px-3', rule, dark ? 'bg-white/[0.04]' : 'bg-muted/40')}>
        <BriefingVideoButton videoId={TASK_BRIEFING_VIDEO[taskId]} tone={tone} variant="ghost" />
        {pattern && (
          <>
            <span className={cn('hidden h-4 w-px @sm/opener:block', dark ? 'bg-white/15' : 'bg-border')} aria-hidden="true" />
            <HowToButton pattern={pattern} step={step} tone={tone} />
          </>
        )}
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
    <div className="flex w-full shrink-0 flex-col gap-1.5 @md/opener:w-44 @md/opener:items-end @xl/opener:w-52">
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
