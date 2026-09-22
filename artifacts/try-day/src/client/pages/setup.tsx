import { useProgress } from '@client/lib/progress';
import { DraftNotice } from '@client/components/draft-notice';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function SetupTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks.setup;
  const frozen = progress.completed.includes('setup');

  return (
    <KitchenFrame
      id="setup"
      dialogue={{
        speaker: 'Priya',
        text: 'Let’s get Surgery 2 ready. According to the infection prevention rules, how long do we flush the water lines at the start of the day? And make sure to check the emergency drugs.',
      }}
      scenes={{
        surgery2: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Surgery 2</p>
              <DraftNotice />
              <h1 className="mt-2 text-3xl font-bold">Morning Checks</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Consult the practice policy and complete the safety critical checks.
              </p>
              
              <div className="mt-6 flex flex-col gap-6">
                <div role="group" aria-labelledby="setup-q1" className="space-y-2 border p-4 rounded-md bg-card">
                  <span id="setup-q1" className="font-semibold block">Water Line Flushing (Start of Day)</span>
                  <div className="flex gap-2">
                    {[20, 60, 120].map(sec => (
                      <Button
                        key={sec}
                        variant={state.waterFlushMinutes === (sec === 120 ? 2 : sec) ? "default" : "outline"} aria-pressed={state.waterFlushMinutes === (sec === 120 ? 2 : sec)}
                        disabled={frozen}
                        onClick={() => updateTask('setup', (prev) => ({ ...prev, waterFlushMinutes: sec === 120 ? 2 : sec }))}
                      >
                        {sec === 120 ? '2 minutes' : `${sec} seconds`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div role="group" aria-labelledby="setup-q2" className="space-y-2 border p-4 rounded-md bg-card">
                  <span id="setup-q2" className="font-semibold block">Emergency Kit Verification</span>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={state.emergencyKit === 'ignored' ? "default" : "outline"} aria-pressed={state.emergencyKit === 'ignored'}
                      disabled={frozen}
                      onClick={() => updateTask('setup', (prev) => ({ ...prev, emergencyKit: 'ignored' }))}
                      className="justify-start"
                    >
                      Skip (checked yesterday)
                    </Button>
                    <Button
                      variant={state.emergencyKit === 'checked' ? "default" : "outline"} aria-pressed={state.emergencyKit === 'checked'}
                      disabled={frozen}
                      onClick={() => updateTask('setup', (prev) => ({ ...prev, emergencyKit: 'checked' }))}
                      className="justify-start"
                    >
                      Check adrenaline, aspirin, glucagon and oxygen
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