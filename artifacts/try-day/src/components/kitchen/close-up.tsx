import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useFocusTrap } from './use-focus-trap';

interface CloseUpProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function CloseUp({ isOpen, onClose, title, children, className }: CloseUpProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  useFocusTrap(contentRef, isOpen, true);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6"
          style={{ top: 'var(--kitchen-top, 56px)' }}
          role="dialog"
          aria-modal="false"
          aria-label={title || "Close up view"}
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
            {/* Standard Close Button Inside the panel's top-right */}
            <button 
              onClick={() => { kitchenAudio.play('page'); onClose(); }}
              className="absolute -top-4 -right-4 md:-top-6 md:-right-6 z-50 bg-black hover:bg-zinc-800 text-white rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none shadow-xl border-2 border-white/20"
              aria-label={title ? `Close ${title.toLowerCase()}` : "Close"}
            >
              <X className="w-5 h-5" />
            </button>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
