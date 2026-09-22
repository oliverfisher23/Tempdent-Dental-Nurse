import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useProgress } from '@client/lib/progress';
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
        <p className="text-xs font-bold uppercase tracking-widest text-primary">DRAFT close</p>
        <h1 className="mt-3 text-4xl font-bold">Placeholder day complete, {progress.studentName.split(' ')[0]}.</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Replace this page with the approved recap and close-of-day message.
        </p>
        <Button
          className="mt-8"
          variant="outline"
          onClick={() => {
            reset();
            setLocation('/');
          }}
        >
          Start again
        </Button>
      </section>
    </main>
  );
}
