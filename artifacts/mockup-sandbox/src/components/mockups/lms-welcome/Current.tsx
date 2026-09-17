import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { MECHANIC, FRAME, getTask, TASK_ORDER } from "./content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./_group.css";

import chefImg from "./assets/sous-chef.webp";
import logoImg from "./assets/be-logo.svg";

type Progress = {
  studentName: string;
  completed: string[];
};

function useProgress() {
  const [progress, setProgress] = useState<Progress>({ studentName: "", completed: [] });
  return {
    progress,
    currentTaskId: null as string | null,
    dayComplete: false,
    startDay: (studentName: string) => setProgress({ studentName, completed: [] }),
    reset: () => setProgress({ studentName: "", completed: [] }),
  };
}

function useLocation(): [null, (path: string) => void] {
  return [null, () => undefined];
}

const kitchenAudio = { unlock: () => undefined };

export default function Intro() {
  const { progress, startDay, reset, currentTaskId, dayComplete } = useProgress();
  const [, setLocation] = useLocation();
  const [name, setName] = useState(progress.studentName || "");
  const reduceMotion = useReducedMotion();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    kitchenAudio.unlock();
    startDay(name);
    setLocation(`/task/${TASK_ORDER[0]}`);
  };

  const handleContinue = () => {
    kitchenAudio.unlock();
    setLocation(currentTaskId ? `/task/${currentTaskId}` : "/close");
  };

  const returning = progress.studentName.trim() !== "";
  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="max-w-7xl mx-auto px-6 md:px-10 pt-8 flex items-center justify-between">
        <img src={logoImg} alt="Be | Marriott Bonvoy" className="h-8 md:h-10" />
        <span className="text-sm text-muted-foreground hidden sm:block">Try Day</span>
      </header>

      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        <div className="lg:col-span-7">
          <motion.p {...fade(0)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {MECHANIC.config.employer}
          </motion.p>
          <motion.h1 {...fade(0.05)} className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
            A day as a <span className="text-primary">sous chef</span>.
          </motion.h1>
          <motion.p {...fade(0.1)} className="mt-5 text-xl md:text-2xl text-foreground/80">
            {FRAME.role}. One shift, {FRAME.shift.start} to {FRAME.shift.end}, in a real hotel kitchen with a real wedding to feed tonight.
          </motion.p>

          <motion.div {...fade(0.15)} className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/85 max-w-2xl">
            <p>{FRAME.morningBrief}</p>
          </motion.div>

          <motion.dl {...fade(0.2)} className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl text-base">
            <div className="border-l-2 border-primary pl-4">
              <dt className="flex items-center gap-2 font-bold text-foreground"><MapPin className="w-4 h-4 text-primary" aria-hidden /> Where</dt>
              <dd className="mt-1 text-foreground/75">{FRAME.workplace}</dd>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <dt className="flex items-center gap-2 font-bold text-foreground"><Clock className="w-4 h-4 text-primary" aria-hidden /> The shape of the shift</dt>
              <dd className="mt-1 text-foreground/75">{FRAME.shift.rhythm}</dd>
            </div>
          </motion.dl>
        </div>

        <motion.div {...fade(0.25)} className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-secondary">
            <img src={chefImg} alt="Two chefs working side by side at the pass" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          {returning ? (
            <div className="bg-white p-6 md:p-8 border border-border shadow-sm space-y-5">
              <div>
                <h2 className="font-bold text-xl">Welcome back, {progress.studentName}</h2>
                <p className="text-muted-foreground mt-1">
                  {dayComplete
                    ? "You finished the shift. You can read the close of day again or start from the top."
                    : currentTaskId
                      ? `You left off at ${getTask(currentTaskId).time}: ${getTask(currentTaskId).title.toLowerCase()}.`
                      : "You left off partway through your shift."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={handleContinue} className="flex-1 text-base">
                  {dayComplete ? "Read the close of day" : "Carry on where you left off"}
                </Button>
                <Button size="lg" variant="outline" onClick={() => { reset(); setName(""); }} className="text-base">
                  Start again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStart} className="bg-white p-6 md:p-8 border border-border shadow-sm space-y-5">
              <div>
                <label htmlFor="name" className="block font-bold text-foreground mb-1">
                  What should we call you?
                </label>
                <p className="text-sm text-muted-foreground mb-3">Your initials go on every form you fill in today, the same as they would in a real kitchen.</p>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="given-name"
                  className="text-lg py-6"
                />
              </div>
              <Button type="submit" size="lg" className="w-full text-base" disabled={!name.trim()}>
                Clock on at {FRAME.shift.start}
              </Button>
            </form>
          )}
        </motion.div>
      </section>

      <section className="bg-secondary text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl md:text-3xl font-bold">Who you are working with</h2>
            <ul className="mt-8 space-y-7">
              {FRAME.people.map((p) => (
                <li key={p.name}>
                  <p className="font-bold text-lg">{p.name}</p>
                  <p className="text-secondary-foreground/70 text-sm">{p.role}</p>
                  <p className="mt-2 text-secondary-foreground/90 leading-relaxed">{p.note}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <h2 className="text-2xl md:text-3xl font-bold">The day, task by task</h2>
            <ol className="mt-8 divide-y divide-white/15 border-y border-white/15">
              {TASK_ORDER.map((id, i) => {
                const t = getTask(id);
                const done = progress.completed.includes(id);
                return (
                  <li key={id} className="py-5 grid grid-cols-[3.5rem_1fr] gap-4 items-baseline">
                    <span className="font-mono font-bold text-primary">{t.time}</span>
                    <div>
                      <p className="font-bold text-lg">
                        {i + 1}. {t.title}
                        {done && <span className="ml-2 text-xs font-bold uppercase tracking-wider text-primary">Done</span>}
                      </p>
                      <p className="text-secondary-foreground/70 text-sm mt-1">{t.place}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-8 text-secondary-foreground/70 text-sm">{MECHANIC.config.gate.label}.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
