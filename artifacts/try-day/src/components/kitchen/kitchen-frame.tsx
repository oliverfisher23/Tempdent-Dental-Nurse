import { useEffect, useRef, useState, ReactNode, Suspense } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskId, TASK_ORDER, Line } from '@/content/activities';
import { getTask, taskIndex, nextTaskId, complicationRevealed } from '@/lib/simulation';
import { useProgress } from '@/lib/progress-store';
import { kitchenAudio } from '@/lib/audio';
import { KitchenProvider, useKitchen } from './kitchen-context';
import { TASK_ROUTES } from '@/content/kitchen';
import { KitchenMap, MiniMap } from './kitchen-map';
import { NotepadDrawer } from './notepad';
import { Speech } from './speech';
import { SoundToggle } from './sound-toggle';
import { Clock, CheckCircle2, Circle, AlertTriangle, BookOpen, MapPin, ClipboardList, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFocusTrap } from './use-focus-trap';
import logoImg from '@/assets/be-logo.svg';

interface KitchenFrameProps {
  id: TaskId;
  scenes: Record<string, ReactNode>;
  dialogue: Line | null;
}

export function KitchenFrame({ id, scenes, dialogue }: KitchenFrameProps) {
  return (
    <KitchenProvider taskId={id} frozen={useProgress().progress.completed.includes(id)}>
      <KitchenFrameInner id={id} scenes={scenes} dialogue={dialogue} />
    </KitchenProvider>
  );
}

function KitchenFrameInner({ id, scenes, dialogue }: KitchenFrameProps) {
  const task = getTask(id);
  const { progress, evaluations, completeTask, isUnlocked, currentTaskId, setClock } = useProgress();
  const { place, light, travelling, openNotepad } = useKitchen();
  const [, setLocation] = useLocation();
  const [jobCardOpen, setJobCardOpen] = useState(false);
  const [hasOpenedJobCard, setHasOpenedJobCard] = useState(false);
  const jobCardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobCardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(jobCardRef, jobCardOpen);

  const named = progress.studentName.trim() !== "";
  const unlocked = named && isUnlocked(id);
  const finished = progress.completed.includes(id);
  const showComplication = finished || complicationRevealed(id, progress.tasks);
  const evaluation = evaluations[id];
  const stepNumber = taskIndex(id) + 1;

  useEffect(() => {
    if (!unlocked) {
      setLocation(named && currentTaskId ? `/task/${currentTaskId}` : "/");
      return;
    }
    if (!finished && !progress.tasks[id]) {
       if (progress.clock !== task.time && taskIndex(currentTaskId!) === taskIndex(id)) {
         setClock(task.time);
       }
    }
    kitchenAudio.setPlace(TASK_ROUTES[id].start);
    // Open job card automatically the first time a task loads
    if (!hasOpenedJobCard && !finished) {
       jobCardTimer.current = setTimeout(() => setJobCardOpen(true), 1000);
       setHasOpenedJobCard(true);
    }
  }, [unlocked, named, id, currentTaskId, setLocation, hasOpenedJobCard, finished, task.time, progress.clock, progress.tasks, setClock]);

  useEffect(() => () => { if (jobCardTimer.current) clearTimeout(jobCardTimer.current); }, []);

  useEffect(() => {
    if (!jobCardOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setJobCardOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jobCardOpen]);

  useEffect(() => {
    if (finished) setJobCardOpen(false);
  }, [finished]);

  if (!unlocked) return null;

  const handleNext = () => {
    kitchenAudio.play('complete');
    if (completeTask(id)) {
      const next = nextTaskId(id);
      setLocation(next ? `/task/${next}` : "/close");
    }
  };

  const activeScene = scenes[place] || null;

  const lightOverlay = {
    dawn: "bg-blue-900/20",
    morning: "bg-transparent",
    midday: "bg-amber-100/10",
    afternoon: "bg-orange-500/10"
  }[light];

  const ticksCompleted = evaluation.checklist.filter(i => i.met).length;
  const totalTicks = evaluation.checklist.length;

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden select-none">
      {/* HUD - Top Bar (Always z-40 so it floats above scenes but below dialogs) */}
      <header className="relative z-40 bg-[#F9F6F4] text-foreground shadow-md shrink-0 border-b border-border h-14">
        <div className="px-4 md:px-6 h-full flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/" aria-label="Back to brief" className="shrink-0 block bg-white px-3 py-1.5 rounded-sm shadow-sm border border-border/50">
              <img src={logoImg} alt="Be" className="h-4 sm:h-5" />
            </Link>
            <div className="h-5 w-px bg-border hidden sm:block shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 text-xs font-medium min-w-0">
              <div className="flex items-center gap-1.5 text-primary font-bold whitespace-nowrap">
                Task {stepNumber} of {TASK_ORDER.length}
              </div>
              <span className="font-bold truncate">{task.title}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Checklist progress strip */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-white rounded shadow-sm border border-border text-sm font-medium">
               <CheckCircle2 className="w-4 h-4 text-primary" />
               <span>{ticksCompleted} / {totalTicks}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-white rounded shadow-sm border border-border">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="font-mono font-bold text-sm">{progress.clock}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white rounded shadow-sm border border-border">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm max-w-[120px] truncate">
                {place.charAt(0).toUpperCase() + place.slice(1).replace('-', ' ')}
              </span>
            </div>
            
            {/* Sound Toggle is handled in floating HUD on small screens, top bar on large */}
            <div className="hidden sm:flex items-center ml-1">
               <SoundToggle />
            </div>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm ml-1">
              {progress.initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Stage */}
      <main className="relative flex-1 bg-zinc-900 overflow-hidden perspective-[1000px]">
        {/* Stage Content / Scene */}
        <AnimatePresence mode="wait">
          <motion.div
            key={place}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={cn("absolute inset-0 z-0", finished && "pointer-events-none grayscale opacity-60")}
            aria-hidden={finished || undefined}
            // A signed-off task's scene is a picture of the work, not a workspace: keyboard focus cannot enter it.
            inert={finished || undefined}
          >
            <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
              {activeScene}
            </Suspense>
            <div className={cn("absolute inset-0 pointer-events-none mix-blend-overlay transition-colors duration-1000", lightOverlay)} />
          </motion.div>
        </AnimatePresence>

        {/* Dialogue Bubble */}
        {!finished && dialogue && <Speech line={dialogue} />}

        {/* Read-only blocker */}
        {finished && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 pointer-events-auto">
             <div className="bg-white text-foreground p-6 rounded shadow-2xl max-w-md text-center border-t-4 border-primary">
               <Lock className="w-8 h-8 mx-auto text-primary mb-3" />
               <h2 className="text-xl font-bold mb-2">This task is signed off</h2>
               <p className="text-muted-foreground mb-6">Your paperwork here stands as you left it. Carry on with the day from where you are.</p>
               <Button asChild size="lg" className="w-full">
                 <Link href={currentTaskId ? `/task/${currentTaskId}` : "/close"}>
                   {currentTaskId ? `Go to next task` : "Go to the close of day"}
                 </Link>
               </Button>
             </div>
          </div>
        )}

        {/* Floating Controls Overlay (HUD); hidden once the task is signed off so nothing can be changed */}
        {!finished && (
        <div className="absolute top-4 right-4 z-40 flex flex-col gap-3 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3">
             <button
               onClick={() => { kitchenAudio.play('page'); setJobCardOpen(true); }}
               className="relative w-16 h-16 rounded bg-white border border-border shadow-md flex flex-col items-center justify-center text-primary hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
               aria-label="Open job card"
             >
               <ClipboardList className="w-6 h-6 mb-1" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">The job</span>
               {ticksCompleted < totalTicks && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center rounded-full">
                    {ticksCompleted}
                  </div>
               )}
             </button>

             <MiniMap />
             
             <button
               onClick={() => { kitchenAudio.play('page'); openNotepad(); }}
               className="relative w-16 h-16 rounded bg-[#F5EFE6] border border-[#D9D0C1] shadow-md flex flex-col items-center justify-center text-primary hover:bg-[#EBE4DA] transition-colors focus-visible:ring-2 focus-visible:ring-primary"
               aria-label="Open notepad"
             >
               <BookOpen className="w-6 h-6 mb-1" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Notes</span>
             </button>
             
             <div className="sm:hidden mt-2 bg-white rounded-full p-1 shadow flex items-center justify-center">
               <SoundToggle />
             </div>
          </div>
        </div>
        )}

        {/* Job Card Slide-in Panel (Right Side) */}
        <AnimatePresence>
          {jobCardOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/20 pointer-events-auto"
                onClick={() => setJobCardOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                ref={jobCardRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label="The job"
                className="absolute right-0 top-0 bottom-0 z-40 w-full max-w-sm bg-white text-foreground shadow-2xl border-l-4 border-primary pointer-events-auto flex flex-col outline-none"
              >
                <div className="p-4 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
                   <h2 className="font-bold text-sm uppercase tracking-widest">The job</h2>
                   <button 
                     onClick={() => setJobCardOpen(false)}
                     className="p-2 hover:bg-black/5 rounded-full transition-colors"
                     aria-label="Close job card"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="p-4 overflow-y-auto space-y-5 text-sm flex-1">
                  <div className="space-y-2">
                    <p className="text-foreground/80">{task.situation}</p>
                    <p className="font-bold text-base">{task.job}</p>
                  </div>

                  {showComplication && (
                    <div className="bg-primary/10 border border-primary/30 p-3 rounded-sm space-y-1">
                      <h3 className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-primary">
                        <AlertTriangle className="w-3.5 h-3.5" /> What has come up
                      </h3>
                      <p className="text-foreground/85 leading-snug">{task.complication}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-2 border-t border-border">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Done when</h3>
                    <p className="text-foreground/85 italic bg-muted p-2 rounded text-xs">{task.doneWhen}</p>
                    <ul className="space-y-2 pt-2">
                      {evaluation.checklist.map((item) => (
                        <li key={item.id} className="flex items-start gap-2">
                          {item.met ? (
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn(item.met ? "font-bold text-foreground" : "font-medium text-muted-foreground", "mt-0.5 leading-snug")}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border text-xs text-muted-foreground">
                    <p><strong>With:</strong> {task.interaction}</p>
                  </div>
                </div>

                {!finished && (
                  <div className="p-4 border-t border-border bg-white shrink-0">
                    {evaluation.done ? (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-primary bg-primary/10 p-2 rounded border border-primary/20">
                          {task.whatHappensNext}
                        </p>
                        <Button onClick={handleNext} className="w-full font-bold shadow-lg">
                          {nextTaskId(id) ? "Move on to the next task" : "Close the day"}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full text-xs font-medium bg-muted text-muted-foreground cursor-not-allowed border-dashed">
                        Finish checklist to continue
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Overlays that cover the entire screen including header */}
      <KitchenMap taskId={id} />
      <NotepadDrawer taskId={id} />
    </div>
  );
}
