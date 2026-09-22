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
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Shift Complete</p>
        <h1 className="mt-3 text-4xl font-bold">Great work today, {progress.studentName.split(' ')[0] || 'Apprentice'}.</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Half five. Good shift. You checked the safety critical stuff, you listened to the patients, and you adapted when the morning went sideways.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          It’s not just passing instruments, is it? We’re managing the people, the infection control, and the clinician’s time all at once. Some days it is exhausting, but it’s real healthcare. Have a think tonight if this is what you want to do. If it is, you’ve got the right attitude for it. I’ll sign off your day.
        </p>
        
        <div className="mt-8 border-l-4 border-primary pl-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Message from Nadia Brooks, Tutor Assessor</p>
          <p className="mt-1">Don't forget to log your protected apprenticeship time for today's shift on Bud. See you at our one-to-one next week!</p>
        </div>

        <Button
          className="mt-8"
          variant="outline"
          onClick={() => {
            reset();
            setLocation('/');
          }}
        >
          Start a new shift
        </Button>
      </section>
    </main>
  );
}