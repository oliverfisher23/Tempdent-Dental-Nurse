import { Maximize2, Minimize2 } from 'lucide-react';
import { useExperienceViewport } from '@shell/lib/experience-viewport';
import { VIEWPORT_COPY } from '@shell/copy/experience-viewport';

/** Kept available during the simulation, including after Escape exits fullscreen. */
export function ExperienceSizeControl() {
  const { fullscreenAvailable, fullscreen, expanding, notice, expand, collapse } = useExperienceViewport();
  const label = fullscreen ? VIEWPORT_COPY.collapse : VIEWPORT_COPY.expand;
  // Inside a frame that cannot go fullscreen the button could only show an apology; the host's own expand control does the job.
  if (!fullscreenAvailable) return null;
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded border border-border bg-white text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        onClick={() => void (fullscreen ? collapse() : expand())}
        disabled={expanding}
        aria-label={label}
        title={notice ?? label}
        data-testid="experience-size-control"
      >
        {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      {notice && <span role="status" className="sr-only">{notice}</span>}
    </div>
  );
}