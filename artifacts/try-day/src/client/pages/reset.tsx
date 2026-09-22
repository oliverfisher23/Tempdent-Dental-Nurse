import { useProgress } from '@client/lib/progress';
import { DraftNotice } from '@client/components/draft-notice';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function ResetTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks.reset;
  const frozen = progress.completed.includes('reset');

  return (
    <KitchenFrame
      id="reset"
      dialogue={{
        speaker: 'Priya',
        text: 'The filling is done. Give dad the aftercare advice about the local anaesthetic. Then we’ll record the notes and wipe the surgery down.',
      }}
      scenes={{
        surgery2: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Surgery 2</p>
              <DraftNotice />
              <h1 className="mt-2 text-3xl font-bold">Notes & Reset</h1>
              
              <div className="mt-6 flex flex-col gap-6">
                <div role="group" aria-labelledby="reset-q1" className="space-y-2 border p-4 rounded-md bg-card">
                  <span id="reset-q1" className="font-semibold block">Aftercare Advice</span>
                  <p className="text-sm text-muted-foreground mb-2">What must Karim know about Amira's numb mouth?</p>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.aftercare === 'numbness' ? 'default' : 'outline'} aria-pressed={state.aftercare === 'numbness'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('reset', p => ({ ...p, aftercare: 'numbness'}))}>
                      "Her lip will be numb for a few hours. Be careful she doesn't bite it."
                    </Button>
                    <Button variant={state.aftercare === 'brushing' ? 'default' : 'outline'} aria-pressed={state.aftercare === 'brushing'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('reset', p => ({ ...p, aftercare: 'brushing'}))}>
                      "Don't brush her teeth for 48 hours."
                    </Button>
                  </div>
                </div>

                <div role="group" aria-labelledby="reset-q2" className="space-y-2 border p-4 rounded-md bg-card">
                  <span id="reset-q2" className="font-semibold block">Surgery Decontamination Wipe-down</span>
                  <p className="text-sm text-muted-foreground mb-2">Which sequence is correct for wiping down the work surfaces?</p>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.wipeDown === 'complete' ? 'default' : 'outline'} aria-pressed={state.wipeDown === 'complete'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('reset', p => ({ ...p, wipeDown: 'complete'}))}>
                      Wipe from clean areas to dirty areas, then dispose of wipes in clinical waste.
                    </Button>
                    <Button variant={state.wipeDown === 'wrong_order' ? 'default' : 'outline'} aria-pressed={state.wipeDown === 'wrong_order'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('reset', p => ({ ...p, wipeDown: 'wrong_order'}))}>
                      Wipe the dirty spittoon first, then use the same wipe on the clean computer keyboard.
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
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Reception</p>
              <DraftNotice />
              <h1 className="mt-2 text-3xl font-bold">Handover</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Amira is escorted out. You return to the surgery to continue the reset.
              </p>
            </div>
          </section>
        ),
      }}
    />
  );
}