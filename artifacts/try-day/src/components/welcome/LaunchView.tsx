import { Button } from "@/components/ui/button";
import { Loader2, Maximize2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useExperienceViewport } from "@/lib/experience-viewport";
import { motion, useReducedMotion } from "framer-motion";
import { WELCOME_COPY } from "@/content/welcome";
import logoImg from "@/assets/artotel-logo.png";
// The kitchen line with Terence at the far range; the phone crop keeps him in frame under the copy.
import heroWide from "@/assets/kitchen/photos/kitchen-line.webp";
import heroPhone from "@/assets/kitchen/photos/kitchen-line-phone.webp";

export function LaunchView() {
  const { expand, expanding, openInline } = useExperienceViewport();
  const reduceMotion = useReducedMotion();
  const launchRef = useRef<HTMLButtonElement>(null);
  // Restore a usable keyboard position when returning from the briefing.
  useEffect(() => {
    if (document.activeElement === document.body) launchRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <main id="main-activity" tabIndex={-1} data-testid="welcome-launch" className="relative flex flex-col justify-end min-h-[100dvh] bg-secondary text-secondary-foreground overflow-hidden">
      <div className="absolute inset-0 z-0">
        <picture className="contents">
          <source media="(min-width: 768px)" srcSet={heroWide} />
          <img
            src={heroPhone}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-65"
            aria-hidden="true"
          />
        </picture>
        {/* Phones stack the copy under Terence, so the shade comes up from the bottom; wider screens keep it on the left. */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-secondary/20 md:bg-gradient-to-r md:from-secondary md:via-secondary/70 md:to-secondary/10" />
      </div>
      
      <div className="relative z-10 p-6 md:p-10 w-full max-w-6xl mx-auto flex flex-col min-h-[100dvh]">
        <header className="mb-auto flex items-center justify-between">
          <div className="bg-foreground px-5 py-4 border border-border/20 shadow-xl">
            <img src={logoImg} alt="art'otel" className="h-6 md:h-7 object-contain" />
          </div>
        </header>

        <div className="mt-auto pb-6 pt-12 md:max-w-[65%]">
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
            initial={false}
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
            <Button
              type="button"
              variant="outline"
              onClick={openInline}
              data-testid="continue-inline"
              className="mt-3 min-h-12 w-full border-white/60 bg-black/40 text-white hover:bg-white hover:text-black sm:ml-3 sm:mt-0 sm:w-auto"
            >
              {WELCOME_COPY.inlineButton}
            </Button>
            <p className="mt-3 text-xs text-secondary-foreground/75">{WELCOME_COPY.launchHint}</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
