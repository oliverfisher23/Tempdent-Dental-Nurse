import { Button } from "@/components/ui/button";
import { Loader2, Maximize2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { PLACES, PEOPLE } from "@/content/kitchen";
import { useExperienceViewport } from "@/lib/experience-viewport";
import { MECHANIC } from "@/lib/simulation";
import { motion, useReducedMotion } from "framer-motion";
import { WELCOME_COPY } from "@/content/welcome";
import logoImg from "@/assets/artotel-logo.png";

export function LaunchView() {
  const { expand, expanding } = useExperienceViewport();
  const reduceMotion = useReducedMotion();
  const marcus = PEOPLE.find(p => p.id === 'marcus');
  const launchRef = useRef<HTMLButtonElement>(null);
  // Restore a usable keyboard position when returning from the briefing.
  useEffect(() => {
    if (document.activeElement === document.body) launchRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div data-testid="welcome-launch" className="relative flex flex-col justify-end min-h-[100dvh] bg-secondary text-secondary-foreground overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={PLACES.pass.backdrop} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-65"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/70 to-secondary/10" />
      </div>
      
      {marcus?.portrait && (
        <motion.img 
          src={marcus.portrait} 
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-6 h-[76dvh] max-h-[650px] max-w-[42%] object-contain object-bottom opacity-90 hidden md:block z-0 pointer-events-none drop-shadow-2xl"
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 0.9, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      )}

      <div className="relative z-10 p-6 md:p-10 w-full max-w-6xl mx-auto flex flex-col min-h-[100dvh]">
        <header className="mb-auto flex items-center justify-between">
          <div className="bg-foreground px-5 py-4 border border-border/20 shadow-xl">
            <img src={logoImg} alt="art'otel" className="h-6 md:h-7 object-contain" />
          </div>
        </header>

        <div className="mt-auto pb-6 pt-12 md:max-w-[65%]">
          <motion.p 
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-primary font-bold tracking-widest uppercase text-[11px] md:text-xs mb-4"
          >
            {MECHANIC.config.employer}
          </motion.p>
          <motion.h1 
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 text-white text-balance leading-[1.05]"
          >
            {WELCOME_COPY.title}
          </motion.h1>
          <motion.p 
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-secondary-foreground/90 text-balance mb-7 leading-relaxed max-w-lg"
          >
            {WELCOME_COPY.shortBrief}
          </motion.p>
          
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button 
              ref={launchRef}
              size="lg" 
              onClick={() => void expand()} 
              disabled={expanding}
              data-testid="expand-experience"
              className="w-full sm:w-auto text-base px-7 py-6 shadow-lg motion-safe:hover:scale-[1.02] transition-transform"
            >
              {expanding ? <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none mr-3" /> : <Maximize2 className="w-4 h-4 mr-3" />}
              {WELCOME_COPY.launchButton}
            </Button>
            <p className="mt-3 text-xs text-secondary-foreground/75">{WELCOME_COPY.launchHint}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
