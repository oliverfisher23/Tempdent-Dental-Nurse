import { useState } from 'react';
import { CircleHelp, Hand, Keyboard, ListChecks, MousePointerClick, Move, Timer, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INTERACTION_PATTERNS, PATTERN_COPY, type InteractionPatternId } from '@/content/interaction-patterns';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { KitchenModal } from './kitchen-modal';

export const PATTERN_ICONS: Record<InteractionPatternId, LucideIcon> = {
  tap: MousePointerClick,
  drag: Move,
  hold: Timer,
  list: ListChecks,
  explore: Hand,
};

interface HowToCardProps {
  pattern: InteractionPatternId;
  isOpen: boolean;
  onClose: () => void;
  /** The current step, so the card says what the pattern is for right now. */
  step?: { title: string; instruction: string };
}

/** The "how this works" card for one kind of control, opened from the step guide or a workspace opener. */
export function HowToCard({ pattern, isOpen, onClose, step }: HowToCardProps) {
  const p = INTERACTION_PATTERNS[pattern];
  const Icon = PATTERN_ICONS[pattern];
  return (
    <KitchenModal isOpen={isOpen} onClose={onClose} title={p.title} eyebrow={PATTERN_COPY.cardEyebrow} testId="how-to-card" closeLabel="Close how this works">
      <div className="flex flex-col gap-5">
        {step && (
          <div className="rounded-lg border border-border bg-muted/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{PATTERN_COPY.thisStep}</p>
            <p className="mt-0.5 text-sm font-bold">{step.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{step.instruction}</p>
          </div>
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
  tone?: 'light' | 'dark';
  className?: string;
}

/** "How do I do this?" link that opens the card for one pattern. */
export function HowToButton({ pattern, step, tone = 'light', className }: HowToButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-testid="how-to-button"
        onClick={() => { kitchenAudio.play('tap'); setOpen(true); }}
        className={cn(
          'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-semibold underline decoration-current/40 underline-offset-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary',
          tone === 'dark' ? 'text-white/85 hover:text-white' : 'text-foreground/80 hover:text-foreground',
          className,
        )}
      >
        <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />
        {PATTERN_COPY.howLink}
      </button>
      <HowToCard pattern={pattern} isOpen={open} onClose={() => setOpen(false)} step={step} />
    </>
  );
}
