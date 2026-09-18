import { useState } from 'react';
import { BookOpen, Subtitles } from 'lucide-react';
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
import { MEDIA_ACCESSIBILITY_COPY as COPY } from '@/content/accessibility-media';

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
          <BookOpen className="h-4 w-4" aria-hidden />
          {COPY.open}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-3xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-7">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl">{video.title}</DialogTitle>
              <DialogDescription>{COPY.pendingDescription}</DialogDescription>
            </DialogHeader>
            <details open className="rounded border border-border bg-muted/40">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-bold">
                <Subtitles className="h-4 w-4" aria-hidden />
                {COPY.transcript}
              </summary>
              <div className="space-y-3 border-t border-border px-4 py-4 text-base leading-relaxed text-foreground">
                {video.transcript.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </details>
            <p className="text-sm text-muted-foreground">{COPY.releaseNote}</p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>{COPY.close}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}