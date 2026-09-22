import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { DraftNotice } from '@client/components/draft-notice';
import { CLOSE_COPY } from '@client/content/client';
import { useProgress } from '@client/lib/progress';
import { day } from '@client/lib/simulation';
import { Button } from '@kit/ui/button';

export default function ClosePage() {
  const { dayComplete, progress, reset, currentTaskId } = useProgress();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!dayComplete) setLocation(currentTaskId ? `/task/${currentTaskId}` : '/');
  }, [currentTaskId, dayComplete, setLocation]);

  if (!dayComplete) return null;

  return (
    <main id="main-activity" tabIndex={-1} className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-2xl border border-border border-t-4 border-t-primary bg-card p-8 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{CLOSE_COPY.eyebrow}</p>
        <DraftNotice />
        <h1 className="mt-3 text-4xl font-bold">{CLOSE_COPY.title(progress.studentName.split(' ')[0])}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{day.spec.FRAME.closeOfDay}</p>

        <div className="mt-8 border-l-4 border-primary pl-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{CLOSE_COPY.tutorHeading}</p>
          <p className="mt-1">{CLOSE_COPY.tutorMessage}</p>
        </div>

        <Button
          className="mt-8"
          variant="outline"
          onClick={() => {
            reset();
            setLocation('/');
          }}
        >
          {CLOSE_COPY.restart}
        </Button>
      </section>
    </main>
  );
}
