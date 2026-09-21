import { useState } from 'react';
import { Clapperboard, Play, Subtitles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KitchenModal } from '@/components/kitchen/kitchen-modal';
import { BRIEFING_VIDEOS, type BriefingVideoId } from '@/content/briefing-videos';
import { MEDIA_ACCESSIBILITY_COPY as COPY } from '@/content/accessibility-media';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';

interface BriefingVideoModalProps {
  videoId: BriefingVideoId;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Terence's filmed briefing for a task. While the film is still to come the
 * player is a placeholder frame and his words are written out underneath, so
 * nobody needs sound or video to carry on.
 */
export function BriefingVideoModal({ videoId, isOpen, onClose }: BriefingVideoModalProps) {
  const video = BRIEFING_VIDEOS[videoId];
  const placeholder = !video.src;

  return (
    <KitchenModal isOpen={isOpen} onClose={onClose} title={video.title} eyebrow={COPY.eyebrow} closeLabel={COPY.close} testId="briefing-video">
      <div className="flex flex-col gap-4">
        {/* The frame keeps the film's shape, but on a narrow phone it grows to fit the placeholder words rather than clipping them. */}
        <div className={cn('relative w-full overflow-hidden rounded-xl bg-zinc-950 text-white shadow-inner ring-1 ring-white/10', placeholder ? 'sm:aspect-video' : 'aspect-video')}>
          {placeholder ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center sm:absolute sm:inset-0 sm:py-0" data-testid="briefing-video-placeholder">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 sm:h-16 sm:w-16" aria-hidden="true">
                <Play className="ml-1 h-7 w-7" />
              </span>
              <p className="text-base font-bold sm:text-lg">{COPY.placeholderLabel}</p>
              <p className="max-w-md text-sm text-white/75">{COPY.placeholderHint}</p>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/60">
                <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
                {video.filename} · {COPY.duration(video.duration)}
              </p>
            </div>
          ) : (
            <video
              className="absolute inset-0 h-full w-full"
              src={video.src}
              poster={video.poster}
              controls
              playsInline
              preload="metadata"
              aria-label={video.title}
            />
          )}
        </div>
        <details open={placeholder} className="rounded-lg border border-border bg-muted/40">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <Subtitles className="h-4 w-4" aria-hidden="true" />
            {COPY.transcript}
            <span className="ml-auto text-xs font-normal text-muted-foreground">{COPY.transcriptHint}</span>
          </summary>
          <div className="space-y-3 border-t border-border px-4 py-4 text-base leading-relaxed text-foreground">
            {video.transcript.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </details>
        {placeholder && <p className="text-xs text-muted-foreground">{COPY.releaseNote}</p>}
        <div className="flex justify-end">
          <Button type="button" onClick={onClose} className="font-bold">{COPY.close}</Button>
        </div>
      </div>
    </KitchenModal>
  );
}

interface BriefingVideoButtonProps {
  videoId: BriefingVideoId;
  tone?: 'light' | 'dark';
  label?: string;
  size?: 'sm' | 'default';
  className?: string;
}

/** A button that opens the briefing film for one task or for the whole day. */
export function BriefingVideoButton({ videoId, tone = 'light', label = COPY.open, size = 'sm', className }: BriefingVideoButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        data-testid="briefing-video-button"
        onClick={() => { kitchenAudio.play('tap'); setOpen(true); }}
        className={cn(
          'gap-2 font-bold',
          tone === 'dark' && 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white',
          className,
        )}
      >
        <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </Button>
      <BriefingVideoModal videoId={videoId} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
