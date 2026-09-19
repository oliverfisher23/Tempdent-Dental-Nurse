import { useEffect, useMemo, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { HANDOVER_FIELDS, type HandoverField } from '@/content/activities';
import { CLOSE_SCENE } from '@/content/scenes/close';
import { CLOSE_INTERACTION } from '@/content/scenes/close-interaction';
import { TEAM_EVIDENCE, exchangeText } from '@/content/scenes/close-exchange';
import { useProgress } from '@/lib/progress-store';
import { buildCloseEvidence, type CloseEvidence } from '@/lib/close-evidence';
import type { CloseRedesignState } from '@/lib/redesign-types';
import { clearAnswersForHeading, followUpsGrouped, headingsFilled, isHandoverReady, type FollowUpId } from '@/lib/redesign-close';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard } from '../../kitchen/paper';
import { EveningExchange } from './evening-exchange';

const COPY = CLOSE_INTERACTION.handover;
const EVIDENCE = CLOSE_INTERACTION.evidence;

const EMPTY_REDESIGN: CloseRedesignState = {
  version: 1, wasteFocus: '', wasteReason: '', priorities: {}, clarifications: {}, recipientConfirmed: false, attempted: false,
};

/**
 * Handover workspace (approved decisions P2–P5): read-only evidence labelled by where it
 * came from, the four approved headings written once in the learner's own words, follow-ups
 * grouped before service or later with an owner, then the evening team's questions.
 */
export function HandoverWorkspace({ onHandover, onReviewWithTerence }: { onHandover: () => void; onReviewWithTerence: () => void }) {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks['hand-the-kitchen-on'];
  const rs = state.redesign ?? EMPTY_REDESIGN;
  const evidence = useMemo(() => buildCloseEvidence(progress.tasks), [progress.tasks]);

  const [error, setError] = useState<string | null>(null);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const exchangeRef = useRef<HTMLDivElement | null>(null);
  const [exchangeRequested, setExchangeRequested] = useState(false);

  const ready = isHandoverReady(state);
  const exchangeOpen = !!rs.attempted && ready;

  useEffect(() => {
    if (exchangeRequested && exchangeOpen) {
      exchangeRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      setExchangeRequested(false);
    }
  }, [exchangeRequested, exchangeOpen]);

  const patchRedesign = (
    changes: Partial<CloseRedesignState>,
    options: { reopen?: boolean } = {},
  ) => {
    updateTask('hand-the-kitchen-on', (prev) => ({
      ...prev,
      ...(options.reopen ? { handedOver: false, elenaSigned: false } : {}),
      redesign: {
        ...(prev.redesign ?? EMPTY_REDESIGN),
        ...changes,
        ...(options.reopen ? { recipientConfirmed: false } : {}),
      },
    }));
  };

  const writeHeading = (fieldId: HandoverField['id'], value: string) => {
    // Changing a heading re-opens only the questions that heading answers (P4).
    updateTask('hand-the-kitchen-on', (prev) => {
      const redesign = prev.redesign ?? EMPTY_REDESIGN;
      return {
        ...prev,
        handover: { ...prev.handover, [fieldId]: value },
        handedOver: false,
        elenaSigned: false,
        redesign: {
          ...redesign,
          clarifications: clearAnswersForHeading(redesign.clarifications, fieldId),
          recipientConfirmed: false,
        },
      };
    });
  };

  const setTiming = (id: FollowUpId, timing: 'before-service' | 'later') => {
    patchRedesign({ priorities: { ...rs.priorities, [id]: timing } }, { reopen: true });
  };

  const setOwner = (id: FollowUpId, who: string) => {
    patchRedesign({ responsibilities: { ...rs.responsibilities, [id]: who } }, { reopen: true });
  };

  const walkThrough = () => {
    const filled = headingsFilled(state);
    const grouped = followUpsGrouped(rs);
    patchRedesign({ attempted: true });
    if (!filled) {
      setError(COPY.fieldsError);
      setShowFieldErrors(true);
      return;
    }
    if (!grouped) {
      setError(COPY.groupingError);
      setShowFieldErrors(true);
      return;
    }
    setError(null);
    setShowFieldErrors(false);
    setExchangeRequested(true);
    kitchenAudio.play('page');
  };

  const answer = (key: string, optionId: string) => {
    patchRedesign({ clarifications: { ...rs.clarifications, [key]: optionId } });
  };

  const confirmReadBack = () => {
    patchRedesign({ recipientConfirmed: true });
    onHandover();
  };

  const backToSheet = () => {
    patchRedesign({ attempted: false });
    document.getElementById('handover-prepared')?.focus();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-[90vh] overflow-y-auto lg:overflow-hidden p-4 lg:p-6">
      <EvidenceRail evidence={evidence} rs={rs} />

      <div className="flex-1 lg:overflow-y-auto lg:pr-2 pb-12 flex flex-col gap-6">
        {/* shrink-0 keeps the sheet at its full height so the column scrolls as one, not paper-inside-column. */}
        <Clipboard className="shrink-0">
          <div className="p-6 md:p-10 text-zinc-900 flex flex-col h-full min-h-[600px]">
            <div className="border-b-2 border-zinc-800 pb-3 mb-6 flex justify-between items-end gap-2 bg-zinc-100/50 -mx-6 md:-mx-10 px-6 md:px-10 pt-4">
              <h2 className="font-bold text-lg uppercase tracking-widest font-sans">{COPY.title}</h2>
              <div className="text-xs font-mono text-zinc-500 font-bold bg-zinc-200 px-2 py-1 rounded">{COPY.shift}</div>
            </div>

            <p className="mb-2 text-sm leading-6 text-zinc-700">{COPY.instructions}</p>
            <p className="mb-6 text-xs leading-5 text-zinc-500">{rs.attempted ? '' : COPY.promptsLocked}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
              {[HANDOVER_FIELDS.slice(0, 2), HANDOVER_FIELDS.slice(2, 4)].map((column, index) => (
                <div key={index} className="space-y-6">
                  {column.map((field) => {
                    const empty = !state.handover[field.id]?.trim();
                    const showError = showFieldErrors && empty;
                    return (
                      <div key={field.id} className="space-y-2 group">
                        <label htmlFor={`handover-${field.id}`} className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-primary motion-safe:transition-colors">{field.label}</label>
                        <Textarea
                          id={`handover-${field.id}`}
                          value={state.handover[field.id] || ''}
                          onChange={(e) => writeHeading(field.id, e.target.value)}
                          placeholder={COPY.placeholder}
                          aria-invalid={showError}
                          aria-describedby={showError ? `handover-${field.id}-error` : rs.attempted ? `handover-${field.id}-prompts` : undefined}
                          className="kitchen-input min-h-[80px] resize-none text-sm border-b-2 border-zinc-200 border-t-0 border-l-0 border-r-0 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent hover:border-zinc-300 transition-colors"
                        />
                        {showError && <p id={`handover-${field.id}-error`} className="text-xs font-bold text-red-700">{COPY.fieldError}</p>}
                        {rs.attempted && (
                          <div id={`handover-${field.id}-prompts`} className="rounded bg-zinc-50 border border-zinc-200 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{COPY.promptsTitle}</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-zinc-600">
                              {field.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t-2 border-zinc-800 pt-6">
              <h3 className="font-bold text-sm text-zinc-800">{COPY.prioritiesTitle}</h3>
              <p className="mb-4 mt-2 text-xs leading-5 text-zinc-600">{COPY.prioritiesHelp}</p>
              <div className="space-y-3">
                {CLOSE_SCENE.priorities.map((p) => {
                  const id = p.id as FollowUpId;
                  const timing = rs.priorities[id];
                  const owner = rs.responsibilities?.[id] ?? '';
                  const missing = showFieldErrors && (!timing || !owner.trim());
                  return (
                    <fieldset key={p.id} className={cn('flex flex-col gap-2 p-3 bg-zinc-50 border rounded', missing ? 'border-red-400' : 'border-zinc-200')}>
                      <legend className="px-1 text-sm font-bold text-zinc-700">{p.label}</legend>
                      <span className="text-xs text-amber-800">{p.status}</span>
                      <div className="grid grid-cols-2 gap-2" role="group" aria-label={`When: ${p.label}`}>
                        {(['before-service', 'later'] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setTiming(id, option)}
                            aria-pressed={timing === option}
                            className={cn('min-h-11 px-3 py-2 text-xs font-bold rounded motion-safe:transition-colors', timing === option ? 'bg-black text-white' : 'bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100')}
                          >
                            {option === 'before-service' ? COPY.beforeService : COPY.later}
                          </button>
                        ))}
                      </div>
                      <label htmlFor={`responsibility-${p.id}`} className="text-xs text-zinc-600">
                        {COPY.whoLabel}
                        <Input
                          id={`responsibility-${p.id}`}
                          className="mt-1 bg-white"
                          data-testid={`responsibility-${p.id}`}
                          value={owner}
                          onChange={(event) => setOwner(id, event.target.value)}
                          placeholder={COPY.whoPlaceholder}
                          aria-invalid={missing && !owner.trim()}
                        />
                      </label>
                      {timing && (
                        <p className="text-xs text-zinc-600" role="status">
                          {(COPY.priorityFeedback as Record<string, Record<string, string>>)[p.id]?.[timing]}
                        </p>
                      )}
                    </fieldset>
                  );
                })}
              </div>
              {error && (
                <div className="mt-4 text-red-700 font-bold text-sm" role="alert">{error}</div>
              )}
              {!rs.recipientConfirmed && (
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={walkThrough}
                    className="min-h-11 bg-black text-white font-bold px-8 py-3 rounded hover:bg-zinc-800 motion-safe:transition-colors text-sm"
                    data-testid="walk-through"
                  >
                    {COPY.walkThrough}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Clipboard>

        {exchangeOpen && (
          <div ref={exchangeRef}>
            <EveningExchange
              rs={rs}
              evidence={evidence}
              handover={state.handover}
              onAnswer={answer}
              onMoveBeforeService={(id) => setTiming(id, 'before-service')}
              onConfirm={confirmReadBack}
              onRevise={backToSheet}
              onReviewWithTerence={onReviewWithTerence}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceRail({ evidence, rs }: { evidence: CloseEvidence; rs: CloseRedesignState }) {
  const e = evidence;
  const notRecorded = EVIDENCE.notRecorded;
  const wasteFocus = CLOSE_SCENE.wasteQuestion.options.find((o) => o.id === rs.wasteFocus);

  const signed: { title: string; lines: string[] }[] = [
    {
      title: 'Temperature board',
      lines: [
        e.larder2.recorded
          ? `${e.larder2.name}: ${e.larder2.reading}°C at ${e.larder2.time || notRecorded}${e.larder2.initials ? `, initials ${e.larder2.initials}` : ''} (limit ${e.larder2.limitLabel}).`
          : `${e.larder2.name}: reading ${notRecorded}.`,
        e.larder2.note ? `Your note: “${e.larder2.note}”` : 'No note written beside it.',
        e.walkIn.recorded ? `${e.walkIn.name}: ${e.walkIn.reading}°C at ${e.walkIn.time || notRecorded}.` : `${e.walkIn.name}: reading ${notRecorded}.`,
      ],
    },
    {
      title: 'Delivery note',
      lines: [
        `${e.salmon.item}: ${e.salmon.ordered} kg ordered, you counted ${e.salmon.counted}${e.salmon.counted !== notRecorded ? ' kg' : ''}, marked ${e.salmon.status ?? notRecorded}.`,
        e.salmon.noteAmendedTo ? `You crossed out ${e.salmon.ordered} and wrote ${e.salmon.noteAmendedTo}${e.salmon.signed ? ', then signed the note' : ''}.` : 'The note was not amended.',
        e.salmon.radioed ? 'You radioed Terence about the short line.' : 'No radio call to Terence is recorded.',
      ],
    },
    {
      title: 'Chill record',
      lines: [
        `Beef shin: ${e.beef.trays} trays, ${e.beef.kg} kg, your share.`,
        e.beef.readings.length
          ? `Readings: ${e.beef.readings.map((r) => `${r.time} ${r.value}°C`).join(', ')}.`
          : `Readings: ${notRecorded}.`,
        e.beef.signed ? 'Signed by you. Terence has not signed yet.' : 'Not signed yet.',
      ],
    },
    {
      title: 'Events board',
      lines: [e.board.posted && e.board.note ? `Posted: “${e.board.note}”` : 'Nothing posted on the board.'],
    },
    {
      title: 'Waste sheet',
      lines: [e.waste.map((w) => `${w.label}: ${w.value ? `${w.value} kg` : notRecorded}`).join('; ') + '.'],
    },
  ];

  const team = TEAM_EVIDENCE.map((line) => exchangeText(line, e));

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-zinc-900 border border-zinc-700 p-5 rounded-xl text-zinc-100 lg:overflow-y-auto shadow-2xl flex flex-col gap-5" aria-labelledby="evidence-title">
      <div>
        <h3 id="evidence-title" className="font-bold text-base text-zinc-100 flex items-center gap-2">
          <Info className="w-4 h-4" aria-hidden="true" /> {EVIDENCE.title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-zinc-400">{EVIDENCE.help}</p>
      </div>

      <EvidenceGroup label={EVIDENCE.signed} help={EVIDENCE.signedHelp} tone="signed" defaultOpen>
        {signed.map((group) => (
          <div key={group.title} className="bg-black/50 p-3 rounded border border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">{group.title}</p>
            {group.lines.map((line) => <p key={line} className="text-xs leading-5 text-zinc-300">{line}</p>)}
          </div>
        ))}
      </EvidenceGroup>

      <EvidenceGroup label={EVIDENCE.team} help={EVIDENCE.teamHelp} tone="team">
        {team.map((line) => (
          <p key={line} className="bg-black/50 p-3 rounded border border-zinc-800 text-xs leading-5 text-zinc-300">{line}</p>
        ))}
      </EvidenceGroup>

      <EvidenceGroup label={EVIDENCE.proposed} help={EVIDENCE.proposedHelp} tone="proposed" defaultOpen>
        {CLOSE_SCENE.priorities.map((p) => (
          <div key={p.id} className="bg-black/50 p-3 rounded border border-zinc-800 border-l-4 border-l-primary">
            <p className="text-xs font-bold text-zinc-100">{p.label}</p>
            <p className="text-xs leading-5 text-zinc-300">{p.status}.</p>
            <p className="text-xs leading-5 text-zinc-400">
              {rs.priorities[p.id] ? (rs.priorities[p.id] === 'before-service' ? COPY.beforeService : COPY.later) : 'Not grouped yet'}
              {rs.responsibilities?.[p.id]?.trim() ? ` — ${rs.responsibilities[p.id].trim()}` : ''}
            </p>
          </div>
        ))}
        <div className="bg-black/50 p-3 rounded border border-zinc-800 border-l-4 border-l-primary">
          <p className="text-xs font-bold text-zinc-100">Waste</p>
          {wasteFocus ? (
            <>
              <p className="text-xs leading-5 text-zinc-300">Look into: {wasteFocus.label}.</p>
              {rs.wasteReason.trim() && <p className="text-xs leading-5 text-zinc-400">Check next: {rs.wasteReason.trim()}</p>}
            </>
          ) : (
            <p className="text-xs leading-5 text-zinc-400">{EVIDENCE.noWasteFollowUp}</p>
          )}
        </div>
      </EvidenceGroup>
    </aside>
  );
}

function EvidenceGroup({ label, help, tone, defaultOpen, children }: {
  label: string;
  help: string;
  tone: 'signed' | 'team' | 'proposed';
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-zinc-800">
      <summary className="cursor-pointer list-none p-3 flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg">
        <span className={cn('text-xs font-bold uppercase tracking-widest', tone === 'proposed' ? 'text-primary' : tone === 'team' ? 'text-sky-300' : 'text-emerald-300')}>
          {label}
        </span>
        <span className="text-[11px] leading-4 text-zinc-400">{help}</span>
      </summary>
      <div className="flex flex-col gap-2 p-3 pt-0">{children}</div>
    </details>
  );
}
