import { CHILL_RULES, MARCUS_TRAY_READINGS } from '@/content/activities';
import { CHILL_LABELS as L } from '@/content/scenes/chill';
import type { ChillState } from '@/lib/simulation';

/** Read-only view of the same record used by the final signature sheet. */
export function CoolingRecordSummary({ state }: { state: ChillState }) {
  return (
    <section className="space-y-2 border-t border-zinc-700 pt-3" aria-label={L.recordTitle}>
      <h3 className="text-sm font-semibold text-white">{L.recordTitle}</h3>
      <p className="text-xs leading-relaxed text-zinc-300">{L.comparisonNotice}</p>
      <div className="space-y-2 sm:hidden" data-testid="live-cooling-record-cards">
        {[...CHILL_RULES.intervals, CHILL_RULES.extraInterval].filter(minute => minute <= state.minutesElapsed).map(minute => (
          <article key={minute} className="rounded-lg border border-zinc-700 bg-black/20 p-3">
            <h4 className="font-semibold text-white">{minute} {L.min} · {state.readings[minute]?.time || 'Time not written'}</h4>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              <div><dt className="text-zinc-400">{L.columns.yours}</dt><dd className="mt-1 text-sm">{state.readings[minute]?.value ? `${state.readings[minute]!.value}°C` : 'Not written'}</dd></div>
              <div><dt className="text-zinc-400">{L.columns.marcus}</dt><dd className="mt-1 text-sm">{MARCUS_TRAY_READINGS[minute]}°C</dd></div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-xs text-zinc-200" data-testid="live-cooling-record">
          <thead>
            <tr>
              <th className="p-1 font-medium">{L.columns.time}</th>
              <th className="p-1 font-medium">{L.columns.elapsed}</th>
              <th className="p-1 font-medium">{L.columns.yours}</th>
              <th className="p-1 font-medium">{L.columns.marcus}</th>
            </tr>
          </thead>
          <tbody>
            {[...CHILL_RULES.intervals, CHILL_RULES.extraInterval].filter(minute => minute <= state.minutesElapsed).map(minute => (
              <tr key={minute} className="border-t border-zinc-800">
                <td className="p-1">{state.readings[minute]?.time || 'Not recorded'}</td>
                <td className="p-1">{minute} {L.min}</td>
                <td className="p-1">{state.readings[minute]?.value ? `${state.readings[minute]!.value}°C` : 'Not recorded'}</td>
                <td className="p-1">{MARCUS_TRAY_READINGS[minute]}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="rounded border border-zinc-700 p-2 text-xs text-zinc-300">
        <summary className="cursor-pointer font-semibold text-white">{L.limitsTitle}</summary>
        <p className="mt-2">{L.limits(CHILL_RULES.holdLineC, CHILL_RULES.serviceLineC)}</p>
      </details>
    </section>
  );
}