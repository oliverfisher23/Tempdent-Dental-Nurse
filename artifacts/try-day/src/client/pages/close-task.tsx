import { useProgress } from '@client/lib/progress';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function CloseTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks.close;
  const frozen = progress.completed.includes('close');

  return (
    <KitchenFrame
      id="close"
      dialogue={{
        speaker: 'Priya',
        text: 'Last patient. Graham hasn’t been here in a decade and he’s terrified. You take the lead — collect him, go at his pace, no judgment.',
      }}
      scenes={{
        reception: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Waiting Room</p>
              <h1 className="mt-2 text-3xl font-bold">Collect Graham</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Graham (54) is sitting rigidly. How you greet him sets the tone.
              </p>
              <div className="mt-6 flex flex-col gap-6">
                <div className="space-y-2 border p-4 rounded-md bg-card">
                  <span className="font-semibold block">Greet Graham</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.greeting === 'judgmental' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('close', p => ({ ...p, greeting: 'judgmental'}))}>
                      "Graham? You haven't been here in ten years. Come on through."
                    </Button>
                    <Button variant={state.greeting === 'calm_no_judgment' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('close', p => ({ ...p, greeting: 'calm_no_judgment'}))}>
                      "Hi Graham. I'm {progress.studentName || 'your nurse'}. We'll take everything at your pace today. Come through when you're ready."
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ),
        surgery2: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Surgery 2</p>
              <h1 className="mt-2 text-3xl font-bold">Charting</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Dr Reid examines Graham. "Upper right 6, occlusal composite present and intact."
              </p>
              
              <div className="mt-6 flex flex-col gap-6">
                <div className="space-y-2 border p-4 rounded-md bg-card">
                  <span className="font-semibold block">Log the charting</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.charting === 'logged' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('close', p => ({ ...p, charting: 'logged'}))}>
                      Select UR6 and mark Occlusal Composite in the digital record.
                    </Button>
                    <Button variant={state.charting === 'wrong' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('close', p => ({ ...p, charting: 'wrong'}))}>
                      Select UL6 and mark Decay.
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