import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, Minimize2, AlertCircle, Check, ArrowRight } from "lucide-react";
import { FRAME, getTask } from "@/lib/simulation";
import { TASK_ORDER } from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { useExperienceViewport } from "@/lib/experience-viewport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kitchenAudio } from "@/lib/audio";
import { WELCOME_COPY } from "@/content/welcome";
import { BRIEFING_PATTERNS, PATTERN_COPY } from "@/content/interaction-patterns";
import { PATTERN_ICONS } from "@/components/kitchen/how-to-card";
import { BriefingVideoButton } from "@/components/briefing-video-modal";
import { MEDIA_ACCESSIBILITY_COPY } from "@/content/accessibility-media";
import logoImg from "@/assets/artotel-logo.png";
// Two sizes so the browser shows the circle close to 1:1 instead of shrinking a large export.
import terenceBriefing from "@/assets/kitchen/photos/terence-briefing.webp";
import terenceBriefing2x from "@/assets/kitchen/photos/terence-briefing-2x.webp";
import { DeviceAdvice } from "@/components/device-advice";

interface BriefingViewProps {
  name: string;
  setName: (v: string) => void;
  confirmReset: boolean;
  setConfirmReset: (v: boolean) => void;
}

export function BriefingView({ name, setName, confirmReset, setConfirmReset }: BriefingViewProps) {
  const { progress, startDay, reset, currentTaskId, dayComplete } = useProgress();
  const { collapse, notice } = useExperienceViewport();
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    kitchenAudio.unlock();
    startDay(name.trim());
    setLocation(`/task/${TASK_ORDER[0]}`);
  };

  const handleContinue = () => {
    kitchenAudio.unlock();
    setLocation(currentTaskId ? `/task/${currentTaskId}` : "/close");
  };

  const handleReset = () => {
    reset();
    setName("");
    setConfirmReset(false);
  };

  const returning = progress.studentName.trim() !== "";
  
  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  const currentTask = currentTaskId ? getTask(currentTaskId) : null;

  return (
    <div data-testid="welcome-briefing" className="min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-border bg-foreground text-primary-foreground z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="art'otel" className="h-6 md:h-8 object-contain" />
          <span className="text-sm font-bold text-white/70 border-l border-white/20 pl-4 hidden sm:block">{WELCOME_COPY.subtitle}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void collapse()} aria-label={WELCOME_COPY.returnButton} className="text-white/70 hover:text-white hover:bg-white/10">
          <Minimize2 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{WELCOME_COPY.returnButton}</span>
          <span className="sm:hidden">{WELCOME_COPY.close}</span>
        </Button>
      </header>

      {notice && (
        <div role="status" className="bg-secondary text-secondary-foreground px-6 py-3 text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {notice}
        </div>
      )}

      <main id="main-activity" tabIndex={-1} className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-9 grid grid-cols-1 md:grid-cols-12 gap-7 md:gap-10 items-center">
        <div className="min-w-0 md:col-span-7 flex flex-col justify-center">
          <motion.div {...fade(0)} className="mb-5 flex items-center gap-4">
            <img
              src={terenceBriefing}
              srcSet={`${terenceBriefing} 256w, ${terenceBriefing2x} 512w`}
              sizes="(min-width: 768px) 8rem, 7rem"
              alt="Terence, executive sous chef at art'otel Hoxton"
              width={512}
              height={512}
              decoding="async"
              className="size-28 md:size-32 shrink-0 rounded-full object-cover bg-muted ring-1 ring-foreground/15"
            />
            <div>
              <p className="font-bold text-xl text-foreground">Terence</p>
              <p className="text-muted-foreground text-sm">{WELCOME_COPY.mentorRole}</p>
            </div>
          </motion.div>
          
          <motion.h1 ref={headingRef} tabIndex={-1} {...fade(0.05)} className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] outline-none">
            {WELCOME_COPY.briefingTitle}
          </motion.h1>
          
          <motion.div {...fade(0.1)} className="mt-4 space-y-4 text-base leading-relaxed text-foreground/85">
            <p>{WELCOME_COPY.briefing}</p>
            <ul className="space-y-3 text-sm">
              {WELCOME_COPY.instructions.map(instruction => (
                <li key={instruction} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
            <section aria-labelledby="how-this-works" className="pt-1">
              <h2 id="how-this-works" className="text-xs font-bold uppercase tracking-widest text-primary">{PATTERN_COPY.briefingTitle}</h2>
              <ul className="mt-2 grid gap-2 sm:grid-cols-3" data-testid="how-this-works">
                {BRIEFING_PATTERNS.map((pattern) => {
                  const Icon = PATTERN_ICONS[pattern.id];
                  return (
                    <li key={pattern.id} className="flex flex-col gap-1.5 rounded-lg border border-border bg-white/70 p-3">
                      <Icon className="h-5 w-5 text-primary" aria-hidden />
                      <p className="text-sm font-bold text-foreground leading-snug">{pattern.title}</p>
                      <p className="text-xs leading-snug text-muted-foreground">{pattern.summary}</p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{PATTERN_COPY.briefingIntro}</p>
            </section>
            <p className="text-xs text-muted-foreground">{WELCOME_COPY.controls}</p>
            <DeviceAdvice />
          </motion.div>

          <motion.div {...fade(0.15)} className="mt-5 space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span>{WELCOME_COPY.shift}: {FRAME.shift.start}–{FRAME.shift.end}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <BriefingVideoButton videoId="main" label={MEDIA_ACCESSIBILITY_COPY.openMain} />
              <details className="text-sm">
                <summary className="w-fit cursor-pointer font-semibold underline decoration-border underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-primary">{WELCOME_COPY.fullBrief}</summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{FRAME.morningBrief}</p>
              </details>
            </div>
          </motion.div>
        </div>

        <motion.div {...fade(0.2)} className="min-w-0 md:col-span-5 flex flex-col justify-center">
          <div className="bg-white p-6 md:p-7 border border-border border-t-4 border-t-primary shadow-sm">
            {returning ? (
              <div className="space-y-8">
                <div>
                  <h2 className="font-bold text-2xl text-foreground mb-3 break-words">{WELCOME_COPY.welcomeBack(progress.studentName)}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {dayComplete
                       ? WELCOME_COPY.completed
                      : currentTask
                         ? WELCOME_COPY.resume(currentTask.time, currentTask.title)
                         : WELCOME_COPY.resumeFallback}
                  </p>
                </div>
                
                {!confirmReset ? (
                  <div className="space-y-4">
                    <Button 
                      size="lg" 
                      onClick={handleContinue} 
                      className="w-full text-base py-6"
                      data-testid="continue-simulation"
                    >
                      {dayComplete ? WELCOME_COPY.readClose : WELCOME_COPY.continue}
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={() => setConfirmReset(true)} 
                      className="w-full text-base py-6"
                    >
                       {WELCOME_COPY.reset}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted p-5 border border-border/50 rounded-sm space-y-5">
                    <p className="font-bold text-foreground leading-snug" role="alert">{WELCOME_COPY.resetWarning}</p>
                    <div className="flex flex-col gap-3">
                      <Button size="lg" variant="destructive" onClick={handleReset} className="flex-1">{WELCOME_COPY.confirmReset}</Button>
                      <Button size="lg" variant="outline" onClick={() => setConfirmReset(false)} className="flex-1">{WELCOME_COPY.cancelReset}</Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleStart} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block font-bold text-foreground mb-2 text-xl">
                    {WELCOME_COPY.nameLabel}
                  </label>
                  <p id="name-help" className="text-sm text-muted-foreground mb-4 leading-relaxed">{WELCOME_COPY.nameHelp}</p>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={WELCOME_COPY.namePlaceholder}
                    aria-describedby="name-help"
                    maxLength={80}
                    autoComplete="given-name"
                     required
                    className="text-lg py-6 bg-muted/50 focus:bg-background transition-colors"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-base py-6 shadow-sm" 
                  disabled={!name.trim()}
                  data-testid="start-simulation"
                >
                  {WELCOME_COPY.start} <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
