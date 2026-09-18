import { useEffect, useMemo, useRef } from 'react';
import { useProgress } from '@/lib/progress-store';
import { useKitchen } from './kitchen-context';
import { TaskId } from '@/content/activities';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from './use-focus-trap';
import { X, BookOpen, Trash2 } from 'lucide-react';
import { kitchenAudio } from '@/lib/audio';

export function NotepadDrawer({ taskId }: { taskId: TaskId }) {
  const { notepadOpen, closeNotepad } = useKitchen();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, notepadOpen, true);
  const { progress, unjot } = useProgress();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && notepadOpen) {
        e.stopPropagation();
        closeNotepad();
      }
    };
    if (notepadOpen) window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [notepadOpen, closeNotepad]);

  const currentEntries = useMemo(() => {
    return progress.notepad.filter(e => e.taskId === taskId).reverse();
  }, [progress.notepad, taskId]);

  return (
    <AnimatePresence>
      {notepadOpen && (
        <div className="fixed inset-0 z-50 flex pointer-events-auto" role="dialog" aria-modal="false" aria-labelledby="notepad-title">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/55 pointer-events-auto"
            onClick={() => { kitchenAudio.play('page'); closeNotepad(); }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            ref={panelRef}
            tabIndex={-1}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#FFFDF8] border-l-4 border-primary shadow-2xl flex flex-col pointer-events-auto outline-none"
            style={{
              backgroundImage: 'linear-gradient(transparent 95%, #E5E0D8 95%)',
              backgroundSize: '100% 2rem',
              backgroundAttachment: 'local'
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-[#F5EFE6]">
              <h2 id="notepad-title" className="font-bold text-lg font-mono flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Notebook
              </h2>
              <button
                onClick={() => { kitchenAudio.play('page'); closeNotepad(); }}
                className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
                aria-label="Close your notebook"
              >
                <X className="w-5 h-5 text-foreground/70" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 pt-2">
              {currentEntries.length === 0 ? (
                <p className="text-foreground/50 italic text-center mt-10" style={{ fontFamily: 'cursive' }}>
                  Nothing written down yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {currentEntries.map(entry => (
                    <li key={entry.id} className="relative group">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-primary">{entry.at}</span>
                        <span className="text-sm font-bold text-foreground/70 uppercase tracking-wider">{entry.label}</span>
                      </div>
                      <div className="text-xl text-foreground" style={{ fontFamily: 'var(--app-font-sans)', fontStyle: 'italic' }}>
                        {entry.value}
                      </div>
                      <button
                        onClick={() => { kitchenAudio.play('write'); unjot(entry.id); }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                        aria-label="Cross this out"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useNotepad() {
  const { progress } = useProgress();
  return {
    entriesFor: (taskId: TaskId) => progress.notepad.filter(e => e.taskId === taskId),
    entryFor: (refKey: string, refValue: string | number) => 
      progress.notepad.find(e => e.ref && e.ref[refKey] === refValue)
  };
}
