import { Button } from "@kit/ui/button";
import { ArrowRight, Loader2, Maximize2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useExperienceViewport } from "@shell/lib/experience-viewport";
import { motion, useReducedMotion } from "framer-motion";
import { useClient } from "@shell/app/client-context";
// The client's hero: a wide crop for desktop and a phone crop that keeps the subject in frame under the copy.

export function LaunchView() {
  const { fullscreenAvailable, expand, expanding, openInline } = useExperienceViewport();
  const { brand, welcome: { copy: WELCOME_COPY, hero: { wide: heroWide, phone: heroPhone } } } = useClient();
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
        {/* Phones stack the copy under the picture, so the shade comes up from the bottom; wider screens keep it on the left. */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-secondary/20 md:bg-gradient-to-r md:from-secondary md:via-secondary/70 md:to-secondary/10" />
      </div>

      <div className="relative z-10 p-6 md:p-10 short:p-6 w-full max-w-6xl mx-auto flex flex-col min-h-[100dvh]">
        <header className="mb-auto flex items-center justify-between">
          <div className="bg-foreground px-5 py-4 border border-border/20 shadow-xl">
            <img src={brand.logo} alt={brand.logoAlt} className="h-6 md:h-7 object-contain" />
          </div>
        </header>

        {/* A short, wide frame (an LMS activity column at 480px) keeps the button on the first screen. */}
        <div className="mt-auto pb-6 pt-12 short:pb-2 short:pt-4 md:max-w-[65%]">
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl short:text-3xl font-bold tracking-tight mb-5 short:mb-2 text-white text-balance leading-[1.05]"
          >
            {WELCOME_COPY.title}
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg short:text-sm text-secondary-foreground/90 text-balance mb-7 short:mb-3 leading-relaxed max-w-lg"
          >
            {WELCOME_COPY.shortBrief}
          </motion.p>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {fullscreenAvailable ? (
              <>
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
              </>
            ) : (
              // No Fullscreen API here (a sandboxed LMS frame): one plain way in, no control that can only apologise.
              <Button
                ref={launchRef}
                type="button"
                size="lg"
                onClick={openInline}
                data-testid="continue-inline"
                className="w-full sm:w-auto text-base px-7 py-6 shadow-lg motion-safe:hover:scale-[1.02] transition-transform"
              >
                {WELCOME_COPY.startButton}
                <ArrowRight className="w-4 h-4 ml-3" />
              </Button>
            )}
            <p className="mt-3 text-xs text-secondary-foreground/75">{fullscreenAvailable ? WELCOME_COPY.launchHint : WELCOME_COPY.launchHintFramed}</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
