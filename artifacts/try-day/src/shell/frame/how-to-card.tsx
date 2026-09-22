import { useState } from 'react';
import { CircleHelp, Hand, Keyboard, ListChecks, MousePointerClick, Move, Timer, type LucideIcon } from 'lucide-react';
import { Button } from '@kit/ui/button';
import type { InteractionPatternId } from '@shell/lib/client';
import { useClient } from '@shell/app/client-context';
import { kitchenAudio } from '@kit/lib/audio';
import { cn } from '@kit/lib/utils';
import { KitchenModal } from './kitchen-modal';

export const PATTERN_ICONS: Record<InteractionPatternId, LucideIcon> = {
  tap: MousePointerClick,
  drag: Move,
  hold: Timer,
  list: ListChecks,
  explore: Hand,
};

/** How to do the job on the screen that is open, and what finished looks like there. */
export interface ScreenHelp {
  how: string;
  done: string;
}

interface HowToCardProps {
  pattern: InteractionPatternId;
  isOpen: boolean;
  onClose: () => void;
  /** The current step, so the card says what the pattern is for right now. */
  step?: { title: string; instruction: string };
  /** The open workspace's own "how" and "done when", when the card is opened from its opener. */
  screen?: ScreenHelp;
}

/** The "how this works" card for one kind of control, opened from the step guide or a workspace opener. */
export function HowToCard({ pattern, isOpen, onClose, step, screen }: HowToCardProps) {
  const { interactionPatterns, copy: { patterns: PATTERN_COPY } } = useClient();
  const p = interactionPatterns[pattern];
  const Icon = PATTERN_ICONS[pattern];
  return (
    <KitchenModal isOpen={isOpen} onClose={onClose} title={p.title} eyebrow={PATTERN_COPY.cardEyebrow} testId="how-to-card" closeLabel="Close how this works">
      <div className="flex flex-col gap-5">
        {step && (
          <div className="rounded-lg border border-border bg-muted/60 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{PATTERN_COPY.thisStep}</p>
            <p className="mt-0.5 text-sm font-bold">{step.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{step.instruction}</p>
          </div>
        )}
        {screen && (
          <dl className="grid gap-3 rounded-lg border border-border bg-muted/60 px-4 py-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" data-testid="how-to-screen">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-primary">{PATTERN_COPY.onThisScreen}</dt>
              <dd className="mt-0.5 text-sm leading-snug">{screen.how}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-primary">{PATTERN_COPY.doneWhen}</dt>
              <dd className="mt-0.5 text-sm leading-snug">{screen.done}</dd>
            </div>
          </dl>
        )}
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
            <Icon className="h-6 w-6" />
          </span>
          <ol className="flex flex-col gap-2.5 text-base leading-relaxed">
            {p.steps.map((line, i) => (
              <li key={line} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{i + 1}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>
        {p.keyboard && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Keyboard className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span><span className="font-bold text-foreground">{PATTERN_COPY.keyboardLabel}:</span> {p.keyboard}</span>
          </p>
        )}
        <div className="flex justify-end">
          <Button type="button" onClick={onClose} className="font-bold">{PATTERN_COPY.close}</Button>
        </div>
      </div>
    </KitchenModal>
  );
}

interface HowToButtonProps {
  pattern: InteractionPatternId;
  step?: { title: string; instruction: string };
  screen?: ScreenHelp;
  tone?: 'light' | 'dark';
  className?: string;
}

/** "How do I do this?" link that opens the card for one pattern. */
export function HowToButton({ pattern, step, screen, tone = 'light', className }: HowToButtonProps) {
  const [open, setOpen] = useState(false);
  const { copy: { patterns: PATTERN_COPY } } = useClient();
  return (
    <>
      <button
        type="button"
        data-testid="how-to-button"
        onClick={() => { kitchenAudio.play('tap'); setOpen(true); }}
        className={cn(
          'inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary',
          tone === 'dark' ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-black/5',
          className,
        )}
      >
        <CircleHelp className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {PATTERN_COPY.howLink}
      </button>
      <HowToCard pattern={pattern} isOpen={open} onClose={() => setOpen(false)} step={step} screen={screen} />
    </>
  );
}
