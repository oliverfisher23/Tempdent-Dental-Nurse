import { useState } from 'react';
import { Film, Play, Subtitles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BRIEFING_VIDEOS, type BriefingVideoId } from '@/content/briefing-videos';

interface BriefingVideoModalProps {
  videoId: BriefingVideoId;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: boolean;
  autoOpen?: boolean;
}

export function BriefingVideoModal({
  videoId,
  open: controlledOpen,
  onOpenChange,
  trigger = false,
  autoOpen = false,
}: BriefingVideoModalProps) {
  const [internalOpen, setInternalOpen] = useState(autoOpen);
  const video = BRIEFING_VIDEOS[videoId];
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      {trigger && (
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
          <Play className="h-4 w-4" aria-hidden />
          Watch Terence’s briefing
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-3xl p-0 overflow-hidden">
          <div className="aspect-video bg-zinc-950 text-white flex flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full border border-white/20 bg-white/10 p-4">
              <Film className="h-8 w-8" aria-hidden />
            </div>
            <p className="mt-4 text-lg font-bold">Terence’s video will appear here</p>
            <p className="mt-1 max-w-md text-sm text-white/70">
              The filmed clip is still in production. Read the approved transcript below for the complete briefing.
            </p>
          </div>
          <div className="space-y-4 px-5 pb-5 md:px-7 md:pb-7">
            <DialogHeader>
              <DialogTitle className="text-xl">{video.title}</DialogTitle>
              <DialogDescription>{video.duration} · Captions and playback controls will be included with the final film.</DialogDescription>
            </DialogHeader>
            <details open className="rounded border border-border bg-muted/40">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-bold">
                <Subtitles className="h-4 w-4" aria-hidden />
                Transcript
              </summary>
              <div className="max-h-56 space-y-3 overflow-y-auto border-t border-border px-4 py-4 text-sm leading-relaxed text-foreground/85">
                {video.transcript.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </details>
            <p className="sr-only">Expected local video file: {video.filename}</p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>Continue</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}