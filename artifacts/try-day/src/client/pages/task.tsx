import { PLACE_ID } from '@client/content/client';
import { useProgress } from '@client/lib/progress';
import { TASK_ID } from '@client/lib/simulation';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function DraftTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks[TASK_ID];
  const frozen = progress.completed.includes(TASK_ID);

  return (
    <KitchenFrame
      id={TASK_ID}
      dialogue={{ speaker: 'DRAFT mentor', text: 'DRAFT: Add the approved mentor guidance for this task.' }}
      scenes={{
        [PLACE_ID]: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">DRAFT task scaffold</p>
              <h1 className="mt-2 text-3xl font-bold">Replace this task</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                This control proves the client state, done-when check and task sign-off path are connected.
              </p>
              <Button
                className="mt-6 w-full"
                disabled={frozen || state.complete}
                onClick={() => updateTask(TASK_ID, (previous) => ({ ...previous, complete: true }))}
              >
                {state.complete ? 'Placeholder complete' : 'Mark placeholder complete'}
              </Button>
            </div>
          </section>
        ),
      }}
    />
  );
}
