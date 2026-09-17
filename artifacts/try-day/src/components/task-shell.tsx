import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { FRAME, complicationRevealed, getTask, nextTaskId, taskIndex } from "@/lib/simulation";
import { useProgress } from "@/lib/progress-store";
import { TASK_ORDER, type TaskId } from "@/content/activities";
import { CheckCircle2, Circle, Clock, MapPin, FileText, Users, MessageCircle, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/be-logo.svg";

interface TaskShellProps {
  id: TaskId;
  children: ReactNode;
  /** The current line of dialogue from whoever is talking to the student. */
  dialogue?: ReactNode;
}

/** Which of the frame's people are in the room for a task, read from its interaction line. */
function peopleFor(interaction: string) {
  return FRAME.people.filter((p) => interaction.includes(p.name.split(" ")[0]));
}

export function TaskShell({ id, children, dialogue }: TaskShellProps) {
  const task = getTask(id);
  const { progress, evaluations, completeTask, isUnlocked, currentTaskId } = useProgress();
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const evaluation = evaluations[id];
  const named = progress.studentName.trim() !== "";
  const unlocked = named && isUnlocked(id);
  const stepNumber = taskIndex(id) + 1;
  const people = peopleFor(task.interaction);
  // Once a task has been signed off it is read-only: coming back through the browser's history
  // cannot undo a finished piece of paperwork.
  const finished = progress.completed.includes(id);
  const showComplication = finished || complicationRevealed(id, progress.tasks);

  // A task that has not been reached yet sends the student back to where they are;
  // a student who has not given a name yet goes back to the morning brief.
  useEffect(() => {
    if (!unlocked) {
      setLocation(named && currentTaskId ? `/task/${currentTaskId}` : "/");
    }
  }, [unlocked, named, currentTaskId, setLocation]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  if (!unlocked) return null;

  const handleNext = () => {
    if (completeTask(id)) {
      const next = nextTaskId(id);
      setLocation(next ? `/task/${next}` : "/close");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/30">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <Link href="/" aria-label="Back to the morning brief" className="shrink-0">
              <img src={logoImg} alt="Be | Marriott Bonvoy" className="h-6" />
            </Link>
            <div className="hidden md:block h-6 w-px bg-border" />
            <div className="flex items-center gap-4 md:gap-6 text-sm text-muted-foreground min-w-0">
              <span className="flex items-center gap-2 text-foreground font-mono font-bold tracking-tight shrink-0">
                <Clock className="w-4 h-4 text-primary" aria-hidden /> {task.time}
              </span>
              <span className="hidden md:flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden /> <span className="truncate">{task.place}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <ol className="flex items-center gap-1.5" aria-label="Tasks in the day">
              {TASK_ORDER.map((t, i) => {
                const done = progress.completed.includes(t);
                const current = t === id;
                return (
                  <li key={t} className="flex items-center">
                    <span
                      aria-current={current ? "step" : undefined}
                      title={`${i + 1}. ${getTask(t).title}`}
                      className={cn(
                        "block h-1.5 rounded-full transition-all",
                        current ? "w-6 bg-primary" : done ? "w-3 bg-secondary" : "w-3 bg-border",
                      )}
                    />
                  </li>
                );
              })}
            </ol>
            <div className="text-xs md:text-sm font-medium text-foreground bg-muted px-3 py-1 rounded-full border border-border">
              {progress.initials || "Chef"}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-4 flex flex-col gap-8">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Task {stepNumber} of {TASK_ORDER.length} <span className="font-mono">{task.time}</span>
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 inline-block pb-1 border-b-4 border-primary">
              {task.title}
            </h1>
            <p className="md:hidden flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden /> {task.place}
            </p>

            <div className="space-y-6 text-foreground/90 leading-relaxed text-lg mt-6">
              <p>{task.situation}</p>
              <p className="font-medium text-foreground">{task.job}</p>
            </div>
          </motion.div>

          {finished && (
            <div className="bg-white border border-border p-5 rounded-sm space-y-3" role="status">
              <p className="flex items-center gap-2 font-bold text-sm">
                <Lock className="w-4 h-4 text-muted-foreground" aria-hidden /> This task is signed off
              </p>
              <p className="text-sm text-foreground/75">Your paperwork here stands as you left it. Carry on with the day from where you are.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={currentTaskId ? `/task/${currentTaskId}` : "/close"}>
                  {currentTaskId ? `Go to task ${taskIndex(currentTaskId) + 1}: ${getTask(currentTaskId).title}` : "Go to the close of day"}
                </Link>
              </Button>
            </div>
          )}

          {dialogue && !finished && (
            <div className="bg-secondary text-secondary-foreground p-6 rounded-sm space-y-4" aria-live="polite">
              {dialogue}
            </div>
          )}

          {showComplication && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 border border-primary/30 p-5 rounded-sm space-y-2"
            >
              <h2 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                <AlertTriangle className="w-4 h-4 text-primary" aria-hidden /> What has come up
              </h2>
              <p className="text-sm leading-relaxed text-foreground/85">{task.complication}</p>
            </motion.div>
          )}

          <div className="bg-white border border-border p-6 rounded-sm shadow-sm space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Done when</h2>
            <p className="text-sm leading-relaxed text-foreground/85">{task.doneWhen}</p>
            <ul className="space-y-3 border-t border-border pt-4">
              {evaluation.checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  {item.met ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                  )}
                  <span className={cn("text-sm", item.met ? "text-foreground font-medium" : "text-muted-foreground")}>
                    <span className="sr-only">{item.met ? "Done: " : "Not yet: "}</span>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {finished ? null : evaluation.done ? (
              <motion.div
                className="space-y-4"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm text-foreground/80 font-medium bg-primary/10 p-4 border border-primary/20 rounded-sm">
                  {task.whatHappensNext}
                </p>
                <Button size="lg" className="w-full text-base" onClick={handleNext}>
                  {nextTaskId(id) ? "Move on to the next task" : "Close the day"}
                </Button>
              </motion.div>
            ) : (
              <Button size="lg" className="w-full text-base" disabled>
                Finish the checklist to move on
              </Button>
            )}
          </div>

          <div className="space-y-6 text-sm border-t border-border pt-6">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <FileText className="w-4 h-4" aria-hidden /> Materials
              </h2>
              <ul className="space-y-3">
                {task.materials.map((m) => (
                  <li key={m.name}>
                    <span className="font-bold text-foreground">{m.name}.</span>{" "}
                    <span className="text-foreground/75">{m.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <MessageCircle className="w-4 h-4" aria-hidden /> Who you are working with
              </h2>
              <p className="text-foreground/75">{task.interaction}</p>
            </div>
            {people.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  <Users className="w-4 h-4" aria-hidden /> In the room
                </h2>
                <ul className="space-y-2">
                  {people.map((p) => (
                    <li key={p.name}>
                      <span className="font-bold text-foreground">{p.name}</span>
                      <span className="text-foreground/75">, {p.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 min-w-0">
          {finished ? (
            <div inert className="opacity-80 select-none" aria-label="Completed task, read only">
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
