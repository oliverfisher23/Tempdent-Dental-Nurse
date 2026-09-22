import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { VIEWPORT_COPY } from '@shell/copy/experience-viewport';

interface ExperienceViewport {
  expanded: boolean;
  /**
   * False where the Fullscreen API is not available: a sandboxed frame without allow=fullscreen
   * (the Springpod hub and Studio), or an older browser. Controls that only expand should hide.
   */
  fullscreenAvailable: boolean;
  fullscreen: boolean;
  expanding: boolean;
  notice: string | null;
  expand: () => Promise<void>;
  openInline: () => void;
  collapse: () => Promise<void>;
}

const ViewportContext = createContext<ExperienceViewport | null>(null);

const FULLSCREEN_AVAILABLE =
  typeof document !== 'undefined' && document.fullscreenEnabled === true && typeof document.documentElement.requestFullscreen === 'function';

/** Fullscreen is requested only by a learner gesture, never by route changes. */
export function ExperienceViewportProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === document.documentElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const expand = useCallback(async () => {
    setExpanded(true);
    setNotice(null);
    if (document.fullscreenElement === document.documentElement) return;
    const fallback = () => setNotice(window.self !== window.top ? VIEWPORT_COPY.embeddedFallback : VIEWPORT_COPY.browserFallback);
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
      fallback();
      return;
    }
    setExpanding(true);
    try {
      // Do not defer this call: it must retain the browser's user activation.
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      setFullscreen(document.fullscreenElement === document.documentElement);
    } catch {
      // A restrictive LMS or unsupported browser must never prevent entry.
      fallback();
    } finally {
      setExpanding(false);
    }
  }, []);

  const collapse = useCallback(async () => {
    if (document.fullscreenElement === document.documentElement) {
      try {
        await document.exitFullscreen();
      } catch {
        setNotice(VIEWPORT_COPY.exitFailed);
        return;
      }
    }
    setFullscreen(false);
    setExpanded(false);
    setNotice(null);
  }, []);

  const openInline = useCallback(() => {
    setExpanded(true);
    setNotice(null);
  }, []);

  const value = useMemo(
    () => ({ expanded, fullscreenAvailable: FULLSCREEN_AVAILABLE, fullscreen, expanding, notice, expand, collapse, openInline }),
    [expanded, fullscreen, expanding, notice, expand, collapse, openInline],
  );
  return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
}

export function useExperienceViewport() {
  const context = useContext(ViewportContext);
  if (!context) throw new Error('useExperienceViewport requires ExperienceViewportProvider');
  return context;
}