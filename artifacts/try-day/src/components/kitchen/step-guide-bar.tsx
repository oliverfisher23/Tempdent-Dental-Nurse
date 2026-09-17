import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { StepGuide, GUIDE_COPY } from '@/content/step-guide';
import { Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';

export interface StepGuideBarProps {
  guide: StepGuide;
  done: boolean;
  onAction: () => void;
  onNext: () => void;
  lastTask: boolean;
  busy: boolean;
}

export function StepGuideBar({
  guide,
  done,
  onAction,
  onNext,
  lastTask,
  busy
}: StepGuideBarProps) {
  const progressText = GUIDE_COPY.progress(guide.step, guide.total);
  const reducedMotion = useReducedMotion();
  
  return (
    <section
      data-testid="step-guide"
      className="bg-white border-b border-border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 gap-3 sm:gap-4 shrink-0"
      aria-label="Step guide"
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[44px]" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={done ? 'done' : guide.id}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15, ease: 'easeInOut' }}
            className="flex flex-col gap-0.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary shrink-0">
                {progressText}
              </span>
              <span className="text-sm font-bold text-foreground truncate">
                {done ? GUIDE_COPY.complete : guide.title}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-snug">
              {done ? GUIDE_COPY.completeHint : guide.instruction}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 flex items-center">
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
