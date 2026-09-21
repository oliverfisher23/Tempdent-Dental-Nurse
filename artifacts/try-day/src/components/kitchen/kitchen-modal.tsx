import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenAudio } from '@/lib/audio';
import { useFocusTrap } from './use-focus-trap';
import { isTopOverlay } from './overlay-stack';

interface KitchenModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Read as the dialog's heading. */
  title: string;
  /** Small line above the title (task name, pattern name). */
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  testId?: string;
}

/**
 * A small centred modal that can sit on top of a close-up or the plain stage:
 * the briefing video and the "how do I do this?" card. Unlike `CloseUp` it is a
 * true modal, so it takes Escape and keyboard focus from whatever is beneath it
 * and hands them back when it closes.
 */
export function KitchenModal({ isOpen, onClose, title, eyebrow, children, className, closeLabel = 'Close', testId }: KitchenModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isTopOverlay(contentRef.current)) return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);

  useFocusTrap(contentRef, isOpen);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" data-kitchen-modal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="absolute inset-0 bg-black/75"
            onClick={onClose}
          />
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            tabIndex={-1}
            data-testid={testId}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className={cn(
              'relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-background text-foreground shadow-2xl outline-none',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="min-w-0">
                {eyebrow && <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>}
                <h2 id={headingId} className="text-lg font-bold leading-snug sm:text-xl">{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => { kitchenAudio.play('tap'); onClose(); }}
                className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
                aria-label={closeLabel}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
