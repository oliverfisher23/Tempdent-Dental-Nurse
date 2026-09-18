import type { TaskId } from '@/content/activities';
import { ACCESSIBILITY_COPY as COPY, TASK_DEVICE_ADVICE } from '@/content/experience-accessibility';

export function DeviceAdvice({ taskId, compact = false }: { taskId?: TaskId; compact?: boolean }) {
  const advice = taskId ? TASK_DEVICE_ADVICE[taskId] : null;
  return (
    <aside aria-label={COPY.deviceTitle} className="space-y-3 border border-border bg-white p-4 text-sm leading-relaxed text-foreground">
      <p className="font-semibold">{compact ? COPY.currentAdvice : COPY.deviceTitle}</p>
      <p>{advice ? advice.advice : COPY.recommendation}</p>
      {!compact && (
        <details>
          <summary className="cursor-pointer py-2 font-semibold underline underline-offset-4">{COPY.taskAdvice}</summary>
          <ol className="mt-3 space-y-4">
            {Object.values(TASK_DEVICE_ADVICE).map(item => (
              <li key={item.title}>
                <p className="font-semibold">{item.title}</p>
                <p>{item.interaction}</p>
                <p className="mt-1 text-muted-foreground">{item.advice}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
      <details>
        <summary className="cursor-pointer py-2 font-semibold underline underline-offset-4">{COPY.controlsTitle}</summary>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          {COPY.controls.map(control => <li key={control}>{control}</li>)}
        </ul>
      </details>
      <p className="text-muted-foreground">{COPY.localProgress}</p>
    </aside>
  );
}