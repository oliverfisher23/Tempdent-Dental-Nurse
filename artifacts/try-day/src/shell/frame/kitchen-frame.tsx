import { useCallback, useEffect, useLayoutEffect, useRef, useState, ReactNode, Suspense } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { TaskId } from '@shell/lib/day';
import type { Line } from '@shell/lib/client';
import { useClient } from '@shell/app/client-context';
import { useProgress } from '@shell/lib/progress-store';
import { kitchenAudio } from '@kit/lib/audio';
import { KitchenProvider, useKitchen } from './kitchen-context';
import { KitchenMap } from './kitchen-map';
import { NotepadDrawer } from './notepad';
import { DialogueBar } from './dialogue-bar';
import { SoundToggle } from './sound-toggle';
import { Clock, CheckCircle2, Circle, AlertTriangle, BookOpen, MapPin, ClipboardList, X, Lock, Map as MapIcon, Loader2 } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/lib/utils';
import { useFocusTrap } from './use-focus-trap';
import { isTopOverlay } from './overlay-stack';
import type { StepGuide } from '@shell/copy/step-guide';
import { StepGuideBar } from './step-guide-bar';
import { ExperienceSizeControl } from '@shell/app/experience-size-control';
import { DeviceAdvice } from '@shell/app/device-advice';
import { SceneMediaActiveContext } from './scene-media-context';

interface KitchenFrameProps {
  id: TaskId;
  scenes: Record<string, ReactNode>;
  dialogue: Line | null;
  /** What the student should do next, in one short line ("Portion the beef into the trays"). */
  now?: string;
  guide?: StepGuide;
  /** A dedicated workspace uses the stage rather than room navigation. */
  focusedWorkspace?: boolean;
  /** Additional interaction gate; the simulation evaluator remains authoritative. */
  readyToContinue?: boolean;
  /** A choice the student is being asked to make, shown under the words in the dialogue bar. */
  choices?: ReactNode;
}

export function KitchenFrame(props: KitchenFrameProps) {
  return (
    <KitchenProvider taskId={props.id} frozen={useProgress().progress.completed.includes(props.id)}>
      <KitchenFrameInner {...props} />
    </KitchenProvider>
  );
}

/** One of the three tools in the header: job card, map, notebook. */
function HeaderTool({
  label,
  icon,
  badge,
  onClick,
  paper,
}: {
  label: string;
  icon: ReactNode;
  badge?: number;
  onClick: () => void;
  paper?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-10 items-center gap-1.5 rounded border px-2 text-primary shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none md:px-3',
        paper ? 'border-[#D9D0C1] bg-[#F5EFE6] hover:bg-[#EBE4DA]' : 'border-border bg-white hover:bg-muted',
      )}
      aria-label={label}
    >
      {icon}
      <span className="hidden text-xs font-bold uppercase tracking-widest text-foreground/70 md:inline">
        {label.replace(/^Open (the |your )?/, '')}
      </span>
      {badge !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function KitchenFrameInner({ id, scenes, dialogue, guide, choices, focusedWorkspace = false, readyToContinue = true }: KitchenFrameProps) {
  const { brand, workplace: { places: PLACES }, day } = useClient();
  const { TASK_ORDER, getTask, taskIndex, nextTaskId } = day.spec;
  const { complicationRevealed } = day.model;
  const task = getTask(id);
  const { progress, evaluations, completeTask, isUnlocked, currentTaskId, setClock } = useProgress();
  const { place, light, mapOpen, notepadOpen, pendingAction, openWorkspace, openNotepad, openMap, clearAction, openWorkspaces } = useKitchen();
  const [dialogueHeight, setDialogueHeight] = useState(0);
  const onDialogueHeight = useCallback((px: number) => setDialogueHeight(Math.round(px)), []);
  const [, setLocation] = useLocation();
  const [jobCardOpen, setJobCardOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);
  const jobCardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  useFocusTrap(jobCardRef, jobCardOpen, 'hud');

  const named = progress.studentName.trim() !== "";
  const unlocked = named && isUnlocked(id);
  const finished = progress.completed.includes(id);
  const showComplication = finished || complicationRevealed(id, progress.tasks);
  const evaluation = evaluations[id];
  const ready = evaluation.done && readyToContinue;
  const stepNumber = taskIndex(id) + 1;

  useLayoutEffect(() => {
    const el = navigationRef.current;
    if (!el) return;
    const report = () => document.documentElement.style.setProperty('--kitchen-top', `${el.getBoundingClientRect().bottom}px`);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--kitchen-top');
    };
  }, [unlocked]);

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
    // The ambient bed follows the room the learner is actually in (a reload may restore a later room).
    kitchenAudio.setAmbience(PLACES[place].ambience);
  }, [unlocked, named, id, currentTaskId, setLocation, finished, task.time, progress.clock, progress.tasks, setClock, place, PLACES, taskIndex]);

  useEffect(() => {
    if (!jobCardOpen) return;
    const onKey = (e: KeyboardEvent) => {
      // Only while nothing sits on top of the job card ("How do I do this?" opens above it).
      if (e.key === 'Escape' && isTopOverlay(jobCardRef.current)) setJobCardOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jobCardOpen]);

  useEffect(() => {
    if (finished) setJobCardOpen(false);
  }, [finished]);

  if (!unlocked) return null;

  const handleNext = () => {
    if (!ready) return;
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
    <div className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden">
      <div ref={navigationRef} data-kitchen-hud className="relative z-40 shrink-0">
      {/* HUD - Top Bar (Always z-40 so it floats above scenes but below dialogs) */}
      <header className="relative z-40 bg-foreground text-primary-foreground shadow-md shrink-0 border-b border-border/20 min-h-14 sm:h-14">
        <div className="px-4 md:px-6 py-2 sm:py-0 sm:h-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/" aria-label="Back to the start" className="shrink-0 block bg-black px-2 py-1 rounded-sm border border-white/20 transition-colors hover:bg-white/10">
              <img src={brand.logo} alt={brand.logoAlt} className="h-4 sm:h-5 object-contain" />
            </Link>
            <div className="h-5 w-px bg-border/20 hidden sm:block shrink-0" />
            <div className="hidden sm:flex sm:items-center sm:gap-4 text-xs font-medium min-w-0">
              <div className="flex items-center gap-1.5 text-white font-bold whitespace-nowrap">
                Task {stepNumber} of {TASK_ORDER.length}
              </div>
              <span className="font-bold truncate">{task.title}</span>
            </div>
          </div>

          {/* Phones: the title takes its own line under the tools, so it is never squeezed to a few letters. */}
          <div className="order-last basis-full sm:hidden flex items-baseline gap-2 text-xs font-medium min-w-0">
            <span className="text-white font-bold whitespace-nowrap">Task {stepNumber} of {TASK_ORDER.length}</span>
            <span className="font-bold truncate">{task.title}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* The three tools live up here so the room itself has nothing floating over it */}
            {!finished && (
              <div className="flex items-center gap-1.5 sm:gap-2 mr-1 sm:mr-2">
                <HeaderTool
                  label="Open the job card"
                  icon={<ClipboardList className="w-5 h-5" />}
                  badge={ticksCompleted < totalTicks ? ticksCompleted : undefined}
                  onClick={() => { kitchenAudio.play('page'); setJobCardOpen(true); }}
                />
                {!focusedWorkspace && <HeaderTool
                  label="Open the map"
                  icon={<MapIcon className="w-5 h-5" />}
                  onClick={() => { kitchenAudio.play('page'); openMap(); }}
                />}
                <HeaderTool
                  label="Open your notebook"
                  icon={<BookOpen className="w-5 h-5" />}
                  onClick={() => { kitchenAudio.play('page'); openNotepad(); }}
                  paper
                />
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-white text-foreground rounded shadow-sm border border-border">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="font-mono font-bold text-sm">{progress.clock}</span>
            </div>
            <div className={cn("hidden items-center gap-2 px-3 py-1 bg-white text-foreground rounded shadow-sm border border-border", !focusedWorkspace && "lg:flex")}>
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm max-w-[140px] truncate">
                {PLACES[place].name}
              </span>
            </div>

            <div className="flex items-center">
               <SoundToggle className="text-white hover:bg-white/15" />
               <ExperienceSizeControl />
            </div>

            <div className="hidden sm:flex w-8 h-8 rounded-full bg-primary text-primary-foreground items-center justify-center font-bold text-xs shadow-sm ml-1">
              {progress.initials}
            </div>
          </div>
        </div>
      </header>
      {!finished && guide && (
        <div data-step-navigation>
          <StepGuideBar
            guide={guide}
            done={ready}
            lastTask={!nextTaskId(id)}
            busy={mapOpen || !!pendingAction}
            atDestination={openWorkspaces.includes(guide.action)}
            workspaceOpen={openWorkspaces.length > 0}
            onNext={handleNext}
            onAction={() => {
              setJobCardOpen(false);
              openWorkspace(guide.place, guide.action);
            }}
          />
        </div>
      )}
      </div>
      {/* Main Stage */}
      <main
        id="main-activity"
        tabIndex={-1}
        className="relative min-h-0 flex-1 overflow-clip bg-zinc-900 outline-none"
        style={{ '--dialogue-h': `${finished ? 0 : dialogueHeight}px` } as React.CSSProperties}
      >
        {/* Pending Action Toast */}
        <AnimatePresence>
          {pendingAction && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-3 z-50 pointer-events-auto"
              role="status"
              aria-live="polite"
            >
              {mapOpen ? (
                <span className="text-sm font-medium">Going to {PLACES[pendingAction.place]?.name || 'destination'}...</span>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Opening...</span>
                </>
              )}
              <button 
                onClick={clearAction}
                className="ml-2 p-1 hover:bg-background/20 rounded-full transition-colors"
                aria-label="Cancel opening"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage Content / Scene */}
        <AnimatePresence mode="wait">
          <motion.div
            key={place}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={cn("absolute inset-0 z-0", finished && "pointer-events-none grayscale opacity-60")}
            aria-hidden={finished || undefined}
            // A signed-off task's scene is a picture of the work, not a workspace: keyboard focus cannot enter it.
            inert={finished || undefined}
          >
            <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
              <SceneMediaActiveContext.Provider value={!finished && !jobCardOpen && !mapOpen && !notepadOpen}>
                {activeScene}
              </SceneMediaActiveContext.Provider>
            </Suspense>
            <div className={cn("absolute inset-0 pointer-events-none mix-blend-overlay transition-colors duration-1000", lightOverlay)} />
          </motion.div>
        </AnimatePresence>

        {/* The person you are working with, and what they say */}
        {!finished && !focusedWorkspace && dialogue && <DialogueBar line={dialogue} choices={choices} onHeight={onDialogueHeight} />}

        {/* Read-only blocker */}
        {finished && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 pointer-events-auto">
             <div className="bg-white text-foreground p-6 rounded shadow-2xl max-w-md text-center border-t-4 border-primary">
               <Lock className="w-8 h-8 mx-auto text-primary mb-3" />
               <h2 className="text-xl font-bold mb-2">You've signed this off</h2>
               <p className="text-muted-foreground mb-6">It stays as you left it. You can look, but nothing here can be changed now.</p>
               <Button asChild size="lg" className="w-full">
                 <Link href={currentTaskId ? `/task/${currentTaskId}` : "/close"}>
                   {currentTaskId ? "Back to where you were" : "Back to the end of the day"}
                 </Link>
               </Button>
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
                aria-modal="false"
                aria-labelledby="job-card-title"
                className="absolute right-0 top-0 bottom-0 z-40 w-full max-w-sm bg-white text-foreground shadow-2xl border-l-4 border-primary pointer-events-auto flex flex-col outline-none"
              >
                <div className="p-4 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
                   <h2 id="job-card-title" className="font-bold text-sm uppercase tracking-widest">Job card</h2>
                   <button 
                     onClick={() => setJobCardOpen(false)}
                     className="p-2 hover:bg-black/5 rounded-full transition-colors"
                     aria-label="Close the job card"
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
                        <AlertTriangle className="w-3.5 h-3.5" /> What's come up
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
                    <p><strong>Who you're working with:</strong> {task.interaction}</p>
                  </div>
                  
                  <DeviceAdvice taskId={id} compact />
                </div>

                {!finished && (
                  <div className="p-4 border-t border-border bg-white shrink-0">
                    {ready ? (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-primary bg-primary/10 p-2 rounded border border-primary/20">
                          {task.whatHappensNext}
                        </p>
                        <Button onClick={handleNext} className="w-full font-bold shadow-lg">
                          {nextTaskId(id) ? "On to the next job" : "Finish the day"}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full text-xs font-medium bg-muted text-muted-foreground cursor-not-allowed border-dashed">
                        Tick everything off to move on
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
