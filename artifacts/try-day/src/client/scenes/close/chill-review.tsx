import { CHILL_MARKS, CHILL_RULES, ELENA_QUESTION, MARCUS_TRAY_READINGS } from '@client/content/activities';
import { addMinutes } from '@client/lib/simulation';
import { CLOSE_INTERACTION } from '@client/content/scenes/close-interaction';
import { useProgress } from '@client/lib/progress';
import { kitchenAudio } from '@kit/lib/audio';
import { cn } from '@kit/lib/utils';
import { Sheet } from '@kit/paper';
import { WorkspaceOpener } from '@shell/frame/workspace-opener';

/**
 * Terence reviews the chill record. The cooling comparison content (question, reference
 * scenario and feedback) is on hold pending the employer's cooling decision and is used
 * here exactly as supplied. Only the signature treatment follows approved decision P7.
 */
export function ChillReview({ onElenaAnswer }: { onElenaAnswer: (id: string) => void }) {
  const { progress, updateTask } = useProgress();
  const chillState = progress.tasks['chill-the-event-batch'];
  const state = progress.tasks['hand-the-kitchen-on'];
  const elenaCorrect = !!state.elenaAnswer && !!ELENA_QUESTION.options.find((o) => o.id === state.elenaAnswer)?.correct;

  return (
    <div className="w-full max-w-5xl mx-auto h-[85vh] overflow-y-auto p-4 lg:p-6 min-w-0">
      <WorkspaceOpener
        taskId="hand-the-kitchen-on"
        what={CLOSE_INTERACTION.review.opener.what}
        how={CLOSE_INTERACTION.review.opener.how}
        done={CLOSE_INTERACTION.review.opener.done}
        pattern="tap"
        tone="dark"
        className="mb-6"
      />
      <div className="flex flex-col md:flex-row gap-6 md:h-[calc(85vh-9rem)]">
      {/* Left: Chill Record Sheet */}
      <div className="order-2 flex-1 min-w-0 md:order-1 md:overflow-y-auto pb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-xl" role="region" aria-label="Chill record" tabIndex={0}>
        <Sheet>
          <div className="p-8 font-sans text-zinc-900">
            <div className="border-b-4 border-zinc-900 pb-4 mb-8">
              <h2 data-dialog-title className="text-3xl font-black uppercase tracking-tighter text-center">Chill Record</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-10 text-sm bg-zinc-50 p-5 rounded border border-zinc-200">
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="font-bold text-zinc-500 uppercase text-xs tracking-widest mt-1">Product</span>
                <span className="font-bold text-base">Braised Beef Shin</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="font-bold text-zinc-500 uppercase text-xs tracking-widest mt-1">Date</span>
                <span className="font-bold text-base">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="font-bold text-zinc-500 uppercase text-xs tracking-widest mt-1">Batch Size</span>
                <span className="font-bold text-base">{chillState.trays.reduce((a, b) => a + b, 0).toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="font-bold text-zinc-500 uppercase text-xs tracking-widest mt-1">Trays</span>
                <span className="font-bold text-base">{chillState.trays.filter((t) => t > 0).length}</span>
              </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 min-w-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Your Record</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-900">
                      <th className="py-2 px-3 font-bold uppercase tracking-widest text-xs">Time</th>
                      <th className="py-2 px-3 font-bold uppercase tracking-widest text-xs">Temp °C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(chillState.readings).map(([mins, reading]) => (
                      <tr key={mins} className="border-b border-zinc-200 even:bg-zinc-50/50">
                        <td className="py-3 px-3 font-mono text-sm text-zinc-600">{reading.time}</td>
                        <td className="py-3 px-3 font-mono text-lg" style={{ fontFamily: 'cursive' }}>{reading.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex-1 min-w-0 bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Reference Scenario</h3>
                <table className="w-full text-left border-collapse opacity-70">
                  <thead>
                    <tr className="border-b border-zinc-400">
                      <th className="py-2 px-3 font-bold uppercase tracking-widest text-xs">Time</th>
                      <th className="py-2 px-3 font-bold uppercase tracking-widest text-xs">Temp °C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHILL_MARKS.map((mark) => (
                      <tr key={mark} className="border-b border-zinc-200"><td className="py-2 px-3 font-mono text-xs text-zinc-500">{addMinutes(CHILL_RULES.startClock, mark)}</td><td className="py-2 px-3 font-mono text-sm text-zinc-600">{MARCUS_TRAY_READINGS[mark].toFixed(1)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mt-12 pt-8 border-t-2 border-zinc-900">
              <div>
                <div className="text-xs uppercase text-zinc-500 font-bold tracking-widest mb-2">Prepared By</div>
                <div className="font-mono text-2xl text-zinc-800" style={{ fontFamily: 'cursive' }}>{progress.initials || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-zinc-500 font-bold tracking-widest mb-2">{CLOSE_INTERACTION.review.checkedBy}</div>
                {state.elenaSigned && elenaCorrect ? (
                  <div className="text-base font-bold text-zinc-900 border-b-2 border-zinc-900 pb-1 pr-4" data-testid="mentor-signature">
                    {CLOSE_INTERACTION.review.signature}
                  </div>
                ) : (
                  <div className="w-56 border-b-2 border-zinc-400 border-dashed h-8 flex items-end">
                    {state.elenaSigned && !elenaCorrect && <span className="text-xs text-red-500 ml-2 mb-1">Answer question first</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Sheet>
      </div>

      {/* Right: Terence's question */}
      <div className="order-1 w-full md:order-2 md:w-[400px] shrink-0 bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl flex flex-col text-zinc-100 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" role="region" aria-label="Terence’s question" tabIndex={0}>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
          <div>
            <div className="font-bold text-lg">Terence</div>
            <div className="text-xs uppercase tracking-widest text-zinc-400 font-bold mt-1">{CLOSE_INTERACTION.review.role}</div>
          </div>
        </div>
        <h2 className="text-xl font-bold">{CLOSE_INTERACTION.review.title}</h2>
        <p className="mt-2 mb-6 text-sm leading-6 text-zinc-300">{CLOSE_INTERACTION.review.instructions}</p>

        <p className="text-sm leading-relaxed mb-8 text-zinc-200 border-l-2 border-zinc-700 pl-4 py-1">
          "{ELENA_QUESTION.question}"
        </p>

        <div className="space-y-3 flex-1">
          {ELENA_QUESTION.options.map((opt) => {
            const isSelected = state.elenaAnswer === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onElenaAnswer(opt.id)}
                disabled={!!elenaCorrect}
                className={cn(
                  'w-full min-h-11 text-left p-4 rounded-lg border motion-safe:transition-[background-color,border-color,color] motion-safe:duration-200 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  isSelected
                    ? (opt.correct ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-950/40 border-red-500/50 text-red-100')
                    : 'bg-black/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {state.elenaAnswer && (
          <div className={cn('p-4 mt-6 rounded-lg border text-sm leading-relaxed motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200', elenaCorrect ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-red-950/40 border-red-500/30 text-red-200')} role={elenaCorrect ? 'status' : 'alert'}>
            <strong className="block mb-1 opacity-70 text-xs uppercase tracking-widest">Terence</strong>
            {ELENA_QUESTION.options.find((o) => o.id === state.elenaAnswer)?.response}
          </div>
        )}

        {!state.elenaSigned && (
          <div className="mt-8 pt-6 border-t border-zinc-800 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200">
            <button
              type="button"
              disabled={!elenaCorrect}
              onClick={() => {
                kitchenAudio.play('write');
                updateTask('hand-the-kitchen-on', (prev) => ({ ...prev, elenaSigned: true }));
              }}
              className="w-full min-h-11 bg-white text-black font-bold py-4 rounded-lg shadow-xl hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none motion-safe:transition-colors motion-safe:duration-200 text-sm"
            >
              {CLOSE_INTERACTION.review.askToSign}
            </button>
            {!elenaCorrect && <p className="mt-2 text-xs text-zinc-400">{CLOSE_INTERACTION.review.signReason}</p>}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
