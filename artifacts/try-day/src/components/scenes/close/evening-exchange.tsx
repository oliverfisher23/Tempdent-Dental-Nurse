import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { HANDOVER_FIELDS } from '@/content/activities';
import { CLOSE_SCENE } from '@/content/scenes/close';
import { EVENING_EXCHANGE, EXCHANGE_COPY, TIMING_CHALLENGE, exchangeText, type ExchangeTopic } from '@/content/scenes/close-exchange';
import type { CloseEvidence } from '@/lib/close-evidence';
import type { CloseRedesignState } from '@/lib/redesign-types';
import { answerKey, timingIssues, topicResolved, type FollowUpId } from '@/lib/redesign-close';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { WorkspaceOpener } from '../../kitchen/workspace-opener';

interface EveningExchangeProps {
  rs: CloseRedesignState;
  evidence: CloseEvidence;
  handover: Record<string, string>;
  onAnswer: (key: string, optionId: string) => void;
  onMoveBeforeService: (id: FollowUpId) => void;
  onConfirm: () => void;
  onRevise: () => void;
  onReviewWithTerence: () => void;
}

/**
 * The evening team's questions (approved decision P4): a finite set, asked only while a
 * topic is unresolved, with a repair line for each unsupported answer and a read-back of the
 * resolved handover for the learner to confirm. Answers persist, so a refresh resumes here.
 */
export function EveningExchange({ rs, evidence, handover, onAnswer, onMoveBeforeService, onConfirm, onRevise, onReviewWithTerence }: EveningExchangeProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const issues = timingIssues(rs);
  const activeTopic = EVENING_EXCHANGE.find((topic) => !topicResolved(rs, topic.id)) ?? null;
  const resolvedTopics = EVENING_EXCHANGE.filter((topic) => topicResolved(rs, topic.id));
  const stage = rs.recipientConfirmed ? 'accepted' : issues.length ? 'timing' : activeTopic ? 'question' : 'read-back';

  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <section
      className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 sm:p-6 shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
      aria-labelledby="evening-exchange-title"
      data-testid="evening-exchange"
    >
      <WorkspaceOpener
        taskId="hand-the-kitchen-on"
        what={EXCHANGE_COPY.opener.what}
        how={EXCHANGE_COPY.opener.how}
        done={EXCHANGE_COPY.opener.done}
        progress={{ done: resolvedTopics.length, total: EVENING_EXCHANGE.length, noun: EXCHANGE_COPY.opener.noun }}
        pattern="tap"
        tone="dark"
        className="mb-6"
        testId="evening-exchange-opener"
      />
      <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-400" aria-hidden="true">ET</div>
        <div>
          <h3 id="evening-exchange-title" ref={headingRef} tabIndex={-1} className="font-bold text-zinc-100 text-lg focus:outline-none">{EXCHANGE_COPY.title}</h3>
          <p className="text-xs text-zinc-400">{EXCHANGE_COPY.help}</p>
        </div>
      </div>

      {stage !== 'accepted' && resolvedTopics.length > 0 && (
        <ul className="mb-6 space-y-2" aria-label="Understood so far">
          {resolvedTopics.map((topic) => (
            <li key={topic.id} className="flex gap-2 text-xs leading-5 text-zinc-300">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span><span className="sr-only">{EXCHANGE_COPY.resolved}: </span>{topic.readBack(evidence)}</span>
            </li>
          ))}
        </ul>
      )}

      {stage === 'timing' && (
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 flex flex-col gap-4" role="group" aria-label={EXCHANGE_COPY.timingTitle}>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{EXCHANGE_COPY.timingTitle}</p>
          {issues.map((id) => (
            <div key={id} className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-zinc-200">“{TIMING_CHALLENGE[id as 'larder2' | 'table3'](evidence)}”</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { kitchenAudio.play('confirm'); onMoveBeforeService(id); }} className="min-h-11 rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200">
                  {EXCHANGE_COPY.moveBefore}
                </button>
                <button type="button" onClick={onRevise} className="min-h-11 rounded border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-800">
                  {EXCHANGE_COPY.backToSheet}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {stage === 'question' && activeTopic && (
        <TopicCard topic={activeTopic} rs={rs} evidence={evidence} handover={handover} onAnswer={onAnswer} />
      )}

      {(stage === 'timing' || stage === 'question') && (
        <div className="mt-4">
          <button type="button" disabled className="min-h-11 rounded bg-zinc-700 px-5 py-2 text-sm font-bold text-zinc-400">
            {EXCHANGE_COPY.confirm}
          </button>
          <p className="mt-2 text-xs text-zinc-400">{EXCHANGE_COPY.confirmReason}</p>
        </div>
      )}

      {stage === 'read-back' && (
        <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 flex flex-col gap-4" data-testid="read-back">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{EXCHANGE_COPY.readBackTitle}</h4>
          <p className="text-sm leading-6 text-zinc-200">“{EXCHANGE_COPY.readBackIntro}</p>
          <ul className="space-y-2 text-sm leading-6 text-zinc-200">
            {EVENING_EXCHANGE.map((topic) => <li key={topic.id}>{topic.readBack(evidence)}</li>)}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['before-service', 'later'] as const).map((timing) => {
              const items = CLOSE_SCENE.priorities.filter((p) => rs.priorities[p.id] === timing);
              return (
                <div key={timing} className="rounded border border-zinc-800 p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{timing === 'before-service' ? EXCHANGE_COPY.beforeService : EXCHANGE_COPY.laterFollowUp}</p>
                  {items.length ? (
                    <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                      {items.map((p) => <li key={p.id}>{p.label}: {rs.responsibilities?.[p.id]?.trim()}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-400">{EXCHANGE_COPY.nothingHere}</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm leading-6 text-zinc-200">{EXCHANGE_COPY.readBackQuestion}”</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { kitchenAudio.play('confirm'); onConfirm(); }} className="min-h-11 rounded bg-white px-5 py-2 text-sm font-bold text-black hover:bg-zinc-200" data-testid="confirm-read-back">
              {EXCHANGE_COPY.confirm}
            </button>
            <button type="button" onClick={onRevise} className="min-h-11 rounded border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-800">
              {EXCHANGE_COPY.revise}
            </button>
          </div>
        </div>
      )}

      {stage === 'accepted' && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-xl flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between" role="status">
          <div>
            <p className="text-emerald-200 font-bold text-lg mb-1">{EXCHANGE_COPY.acceptedTitle}</p>
            <p className="text-emerald-200/90 text-sm leading-6">{EXCHANGE_COPY.acceptedBody}</p>
          </div>
          <button type="button" onClick={onReviewWithTerence} className="min-h-11 shrink-0 rounded bg-white px-4 py-2 text-sm font-bold text-black">
            {CLOSE_SCENE.elena}
          </button>
        </div>
      )}
    </section>
  );
}

function TopicCard({ topic, rs, evidence, handover, onAnswer }: {
  topic: ExchangeTopic;
  rs: CloseRedesignState;
  evidence: CloseEvidence;
  handover: Record<string, string>;
  onAnswer: (key: string, optionId: string) => void;
}) {
  return (
    <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" data-testid={`exchange-${topic.id}`}>
      <div className="space-y-2">
        {topic.headings.map((headingId) => {
          const field = HANDOVER_FIELDS.find((f) => f.id === headingId)!;
          const text = (handover[headingId] ?? '').trim();
          return (
            <blockquote key={headingId} className="border-l-2 border-zinc-700 pl-3 text-xs leading-5 text-zinc-400">
              <span className="font-bold text-zinc-300">{EXCHANGE_COPY.youWrote(field.label)}: </span>
              {text || EXCHANGE_COPY.nothingWritten}
            </blockquote>
          );
        })}
      </div>
      <p className="text-base font-bold leading-6 text-zinc-100">“{topic.question}”</p>

      {topic.parts.map((part) => {
        const key = answerKey(topic.id, part.id);
        const chosen = rs.clarifications[key];
        const chosenOption = part.options.find((o) => o.id === chosen);
        const isRight = !!chosenOption?.correct;
        return (
          <fieldset key={part.id} className="flex flex-col gap-2">
            <legend className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{part.prompt}</legend>
            {part.options.map((opt) => {
              const selected = chosen === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    kitchenAudio.play(opt.correct ? 'confirm' : 'wrong');
                    onAnswer(key, opt.id);
                  }}
                  aria-pressed={selected}
                  className={cn(
                    'min-h-11 w-full text-left px-3 py-2 rounded border text-sm leading-5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    selected && opt.correct && 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100',
                    selected && !opt.correct && 'bg-red-950/40 border-red-500/50 text-red-100',
                    !selected && 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700',
                  )}
                >
                  {exchangeText(opt.label, evidence)}
                </button>
              );
            })}
            {chosenOption && (
              <p className={cn('text-sm leading-6 border-l-2 pl-3', isRight ? 'border-emerald-500 text-emerald-200' : 'border-red-500 text-red-200')} role={isRight ? 'status' : 'alert'}>
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70">Evening team</span>
                {exchangeText(chosenOption.reply, evidence)}
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
