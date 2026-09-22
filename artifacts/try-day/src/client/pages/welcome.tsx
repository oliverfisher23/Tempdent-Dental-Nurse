import { useProgress } from '@client/lib/progress';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function WelcomeTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks.welcome;
  const frozen = progress.completed.includes('welcome');

  return (
    <KitchenFrame
      id="welcome"
      dialogue={{
        speaker: 'Priya',
        text: 'Amira is here for her first filling. Both the patient and the parent will be anxious. Go call them through.',
      }}
      scenes={{
        reception: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Waiting Room</p>
              <h1 className="mt-2 text-3xl font-bold">Welcome Amira</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Amira (10) looks nervous. Karim, her dad, asks: "Can I come in with her?"
              </p>
              
              <div className="mt-6 flex flex-col gap-6">
                <div className="space-y-2 border p-4 rounded-md bg-card">
                  <span className="font-semibold block">How do you greet Amira?</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.greeting === 'child_focused' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('welcome', p => ({ ...p, greeting: 'child_focused'}))}>
                      "Hi Amira, I'm {progress.studentName || 'your nurse'}. We're going to look after you today. Come on through."
                    </Button>
                    <Button variant={state.greeting === 'parent_focused' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('welcome', p => ({ ...p, greeting: 'parent_focused'}))}>
                      "Mr Hassan? Dr Reid is ready for Amira now."
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border p-4 rounded-md bg-card">
                  <span className="font-semibold block">Reply to Karim's question</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={state.dadQuestion === 'wait' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('welcome', p => ({ ...p, dadQuestion: 'wait'}))}>
                      "It's better if parents wait outside so we have space."
                    </Button>
                    <Button variant={state.dadQuestion === 'allow_in' ? 'default' : 'outline'} disabled={frozen} className="justify-start h-auto text-left py-2" onClick={() => updateTask('welcome', p => ({ ...p, dadQuestion: 'allow_in'}))}>
                      "Of course you can come in. You can sit right beside her."
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
              <h1 className="mt-2 text-3xl font-bold">Settling In</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Amira is now in the chair. Once you have communicated effectively in the waiting room, check your task progress on the right.
              </p>
            </div>
          </section>
        ),
      }}
    />
  );
}