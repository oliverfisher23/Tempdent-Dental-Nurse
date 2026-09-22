import { useProgress } from '@client/lib/progress';
import { DraftNotice } from '@client/components/draft-notice';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function ChangeTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks.change;
  const frozen = progress.completed.includes('change');

  return (
    <KitchenFrame
      id="change"
      dialogue={{
        speaker: 'Joanne',
        text: 'Sorry to interrupt your decontamination. The 10:40 cancelled, but we’ve had an emergency call — Mr Nowak is in pain. Also, the stock delivery just arrived in the corridor.',
      }}
      scenes={{
        decon: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Decontamination Room</p>
              <DraftNotice />
              <h1 className="mt-2 text-3xl font-bold">Unexpected Changes</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                A lot is happening at once. You must decide what the priority is to keep the practice running safely.
              </p>
              
              <div className="mt-6 flex flex-col gap-6">
                <div role="group" aria-labelledby="change-q1" className="space-y-2 border p-4 rounded-md bg-card">
                  <span id="change-q1" className="font-semibold block">What is your most urgent priority?</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.firstPriority === 'stock' ? 'default' : 'outline'} aria-pressed={state.firstPriority === 'stock'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('change', p => ({ ...p, firstPriority: 'stock'}))}>
                      Move the delivery boxes into the stock room so they are out of the way.
                    </Button>
                    <Button variant={state.firstPriority === 'emergency' ? 'default' : 'outline'} aria-pressed={state.firstPriority === 'emergency'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('change', p => ({ ...p, firstPriority: 'emergency'}))}>
                      Ensure Surgery 2 is set up with an emergency tray for Mr Nowak.
                    </Button>
                    <Button variant={state.firstPriority === 'decon' ? 'default' : 'outline'} aria-pressed={state.firstPriority === 'decon'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('change', p => ({ ...p, firstPriority: 'decon'}))}>
                      Finish bagging every single instrument in the decon room right now.
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ),
        reception: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <h1 className="text-2xl font-bold">Reception</h1>
              <p className="mt-4">Mr Nowak is arriving shortly.</p>
            </div>
          </section>
        ),
        stock: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <h1 className="text-2xl font-bold">Stock Room</h1>
              <p className="mt-4">The delivery boxes can wait until the clinical emergency is handled.</p>
            </div>
          </section>
        ),
        surgery2: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <h1 className="text-2xl font-bold">Surgery 2</h1>
              <p className="mt-4">Update Dr Reid about the cancellation and the emergency patient.</p>
            </div>
          </section>
        ),
      }}
    />
  );
}