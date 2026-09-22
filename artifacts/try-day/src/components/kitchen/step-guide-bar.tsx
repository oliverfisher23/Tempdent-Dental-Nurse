import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { StepGuide, GUIDE_COPY } from '@/content/step-guide';
import { Loader2, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';
import { HowToButton } from './how-to-card';
import { cn } from '@/lib/utils';

export interface StepGuideBarProps {
  guide: StepGuide;
  done: boolean;
  onAction: () => void;
  onNext: () => void;
  lastTask: boolean;
  busy: boolean;
  /** The workspace this step's action opens is already on screen. */
  atDestination?: boolean;
  /** A workspace with its own opener is open, so its "How do I do this?" is the one on screen. */
  workspaceOpen?: boolean;
}

export function StepGuideBar({
  guide,
  done,
  onAction,
  onNext,
  lastTask,
  busy,
  atDestination = false,
  workspaceOpen = false,
}: StepGuideBarProps) {
  const progressText = GUIDE_COPY.progress(guide.step, guide.total);
  const reducedMotion = useReducedMotion();
  
  return (
    <section
      data-testid="step-guide"
      data-done={done || undefined}
      className={cn(
        'border-b shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 gap-3 sm:gap-4 shrink-0 short:py-1.5',
        done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-border',
      )}
      aria-label="Step guide"
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[44px] short:min-h-9" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={done ? 'done' : guide.id}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15, ease: 'easeInOut' }}
            // In a short window the title and instruction share a line where the width allows, wrapping otherwise.
            className="flex flex-col gap-0.5 short:flex-row short:flex-wrap short:items-baseline short:gap-x-2 short:gap-y-0"
          >
            <div className="flex items-center gap-2 short:items-baseline">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest text-primary shrink-0">
                  {progressText}
                </span>
              )}
              <span className={cn('text-sm font-bold truncate', done ? 'text-emerald-900' : 'text-foreground')}>
                {done ? GUIDE_COPY.complete : guide.title}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-snug">
              {done ? GUIDE_COPY.completeHint : guide.instruction}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
        {!done && guide.pattern && !workspaceOpen && (
          <HowToButton pattern={guide.pattern} step={{ title: guide.title, instruction: guide.instruction }} />
        )}
        {done ? (
          <Button
            data-testid="next-job"
            onClick={onNext}
            className="w-full sm:w-auto font-bold shadow-md"
            size="sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
            {lastTask ? GUIDE_COPY.finishDay : GUIDE_COPY.nextJob}
          </Button>
        ) : atDestination && !busy ? (
          <span
            data-testid="guide-here"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-muted px-3 text-sm font-bold text-foreground"
          >
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            {GUIDE_COPY.here}
          </span>
        ) : (
          <Button
            data-testid="guide-action"
            onClick={onAction}
            disabled={busy}
            aria-label={guide.actionLabel}
            className="w-full sm:w-auto font-bold"
            size="sm"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                {GUIDE_COPY.opening}
              </>
            ) : (
              <>
                {guide.actionLabel}
                <ChevronRight className="w-4 h-4 ml-1.5 -mr-1" aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}
