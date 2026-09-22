import { useEffect, useId, useLayoutEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kitchenAudio } from '@kit/lib/audio';
import { cn } from '@kit/lib/utils';
import { useFocusTrap } from './use-focus-trap';
import { isTopOverlay } from './overlay-stack';

interface CloseUpProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A workspace panel that sits over the room but under the kitchen header, which stays
 * usable: the job card, map and notebook can all be opened from here. So it is a
 * non-modal dialog whose Tab cycle also covers the header and step guide. Its accessible
 * name is the workspace's own title: the element marked `data-dialog-title`, else the
 * first h1 or h2, else the `title` prop. The name is set before focus moves in.
 */
export function CloseUp({ isOpen, onClose, title, children, className }: CloseUpProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const generatedHeadingId = useId();
  const [headingId, setHeadingId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // A modal opened on top (briefing video, "how do I do this?") takes Escape first.
      if (e.key === 'Escape' && isOpen && isTopOverlay(contentRef.current)) {
        e.stopPropagation();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  useFocusTrap(contentRef, isOpen, 'hud');

  // Name the dialog after its visible title, so what is read out matches what is seen.
  // A layout effect runs before the focus trap moves focus in, and the attribute is written
  // to the element straight away so the first announcement already carries the right name.
  useLayoutEffect(() => {
    if (!isOpen) {
      setHeadingId(null);
      return;
    }
    const heading = contentRef.current?.querySelector<HTMLElement>('[data-dialog-title], h1, h2');
    if (!heading) {
      setHeadingId(null);
      return;
    }
    if (!heading.id) heading.id = generatedHeadingId;
    dialogRef.current?.setAttribute('aria-labelledby', heading.id);
    dialogRef.current?.removeAttribute('aria-label');
    setHeadingId(heading.id);
  }, [isOpen, generatedHeadingId]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6"
          style={{ top: 'var(--kitchen-top, 56px)' }}
          ref={dialogRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId ?? undefined}
          aria-label={headingId ? undefined : title || 'Close up view'}
        >
          {/* Plain semi-transparent background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 pointer-events-auto" 
            onClick={() => {
              kitchenAudio.play('page');
              onClose();
            }} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            ref={contentRef}
            className={cn(
              "relative max-h-full min-h-0 flex flex-col pointer-events-auto outline-none w-full",
              className
            )}
            tabIndex={-1}
          >
            {/* Close button in the panel's top-right corner, sized for a thumb */}
            <button 
              onClick={() => { kitchenAudio.play('page'); onClose(); }}
              className="absolute -top-4 -right-4 md:-top-6 md:-right-6 z-50 flex h-11 w-11 items-center justify-center bg-black hover:bg-zinc-800 text-white rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none shadow-xl border-2 border-white/20"
              aria-label={title ? `Close ${title.toLowerCase()}` : "Close"}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
