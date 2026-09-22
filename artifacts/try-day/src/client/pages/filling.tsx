import { useProgress } from '@client/lib/progress';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function FillingTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks.filling;
  const frozen = progress.completed.includes('filling');

  return (
    <KitchenFrame
      id="filling"
      dialogue={{
        speaker: 'Priya',
        text: 'Watch Dr Reid so you know what she needs next, but watch Amira too — if she raises her hand, you tell us immediately.',
      }}
      scenes={{
        surgery2: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Surgery 2</p>
              <h1 className="mt-2 text-3xl font-bold">Support the Filling</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Dr Reid is ready to examine the tooth before starting the composite filling. 
              </p>
              
              <div className="mt-6 flex flex-col gap-6">
                <div className="space-y-2 border p-4 rounded-md bg-card">
                  <span className="font-semibold block">What instruments do you hand to Dr Reid first?</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.firstInstrument === 'mirror_probe' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('filling', p => ({ ...p, firstInstrument: 'mirror_probe'}))}>
                      Mouth mirror and dental probe
                    </Button>
                    <Button variant={state.firstInstrument === 'curing_light' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('filling', p => ({ ...p, firstInstrument: 'curing_light'}))}>
                      Curing light and composite material
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border p-4 rounded-md bg-card">
                  <span className="font-semibold block">Midway through, Amira raises her hand. What do you do?</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.patientSignal === 'ignore' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('filling', p => ({ ...p, patientSignal: 'ignore'}))}>
                      Ignore it and keep holding the suction.
                    </Button>
                    <Button variant={state.patientSignal === 'pause_alert' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('filling', p => ({ ...p, patientSignal: 'pause_alert'}))}>
                      Quietly tell Dr Reid to pause the treatment.
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ),
      }}
    />
  );
}