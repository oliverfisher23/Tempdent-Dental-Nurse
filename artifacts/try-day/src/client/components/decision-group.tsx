import { useEffect, useRef, useState } from 'react';
import { Button } from '@kit/ui/button';
import { isAnswered, isCorrect, type Decision, type DecisionAnswer } from '@client/content/tasks';

interface DecisionGroupProps {
  taskId: string;
  decision: Decision;
  answer: DecisionAnswer;
  /** The task has been signed off; answers can be read but not changed. */
  frozen: boolean;
  onAnswer: (answer: DecisionAnswer) => void;
}

/**
 * One storyboard decision. A choice writes on tap; a checklist is confirmed as a
 * set; a sequence is judged once as many steps have been tapped as the answer
 * has. Feedback appears after an answer and a wrong answer can be changed; the
 * mentor's words coach the principle rather than list the answer.
 */
export function DecisionGroup({ taskId, decision, answer, frozen, onAnswer }: DecisionGroupProps) {
  const promptId = `${taskId}-${decision.id}-prompt`;
  const answered = isAnswered(answer);
  const right = answered && isCorrect(decision, answer);
  const groupRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  // Confirming a set or finishing a sequence swaps the buttons for a list, which drops
  // keyboard focus on the body. Hand it to the feedback instead so the reader carries on.
  const answerKey = JSON.stringify(answer);
  useEffect(() => {
    if (!answered || decision.kind === 'choice') return;
    const group = groupRef.current;
    const active = document.activeElement;
    if (!group || (active && active !== document.body && group.contains(active))) return;
    feedbackRef.current?.focus({ preventScroll: true });
  }, [answered, answerKey, decision.kind]);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-labelledby={promptId}
      data-testid={`decision-${decision.id}`}
      data-state={answered ? (right ? 'right' : 'wrong') : 'open'}
      className="rounded-md border border-border bg-card p-4"
    >
      {decision.context && <p className="mb-2 text-sm italic text-muted-foreground">{decision.context}</p>}
      <p id={promptId} className="font-semibold">
        {decision.prompt}
      </p>
      <div className="mt-3">
        {decision.kind === 'choice' && (
          <ChoiceInput decision={decision} answer={answer} frozen={frozen} onAnswer={onAnswer} />
        )}
        {decision.kind === 'checklist' && (
          <ChecklistInput decision={decision} answer={answer} frozen={frozen} onAnswer={onAnswer} />
        )}
        {decision.kind === 'sequence' && (
          <SequenceInput decision={decision} answer={answer} frozen={frozen} onAnswer={onAnswer} />
        )}
      </div>
      {answered && (
        <p
          ref={feedbackRef}
          tabIndex={-1}
          role="status"
          data-testid={`feedback-${decision.id}`}
          className={`mt-3 border-l-4 pl-3 text-sm leading-relaxed ${right ? 'border-primary' : 'border-destructive'}`}
        >
          <span className="font-semibold">{decision.feedback.speaker}: </span>
          {right ? decision.feedback.right : decision.feedback.wrong}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<DecisionGroupProps, 'taskId'>;

/**
 * The draft a checklist or sequence is being built in, or null while the saved
 * answer is shown read-only. It follows the saved answer whenever that changes
 * under the component (a confirm, a designer fixture, a reset) so a blank
 * answer always reopens for editing and a saved one is never edited by accident.
 */
function useDraft(saved: string[] | null) {
  const [draft, setDraft] = useState<string[] | null>(saved ? null : []);
  const savedKey = JSON.stringify(saved);
  useEffect(() => {
    setDraft(saved ? null : []);
  }, [savedKey]);
  return [draft, setDraft] as const;
}

/** A confirmed set or order, shown as a list rather than as buttons that no longer do anything. */
function AnswerList({ decision, marks }: { decision: Decision; marks: (optionId: string) => string | null }) {
  return (
    <ul className="flex flex-col gap-2">
      {decision.options.map((option) => {
        const mark = marks(option.id);
        const chosen = mark !== null;
        return (
          <li
            key={option.id}
            data-testid={optionTestId(decision, option.id)}
            data-chosen={chosen}
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${chosen ? 'border-primary bg-primary/10 font-medium' : 'border-border text-muted-foreground'}`}
          >
            <span className="w-5 shrink-0 font-mono" aria-hidden="true">{mark ?? ''}</span>
            {chosen && <span className="sr-only">{/^\d+\.$/.test(mark) ? `Step ${mark.slice(0, -1)}: ` : 'Ticked: '}</span>}
            <span>{option.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function optionTestId(decision: Decision, optionId: string) {
  return `option-${decision.id}-${optionId}`;
}

function ChoiceInput({ decision, answer, frozen, onAnswer }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {decision.options.map((option) => {
        const selected = answer === option.id;
        return (
          <Button
            key={option.id}
            type="button"
            variant={selected ? 'default' : 'outline'}
            aria-pressed={selected}
            disabled={frozen}
            data-testid={optionTestId(decision, option.id)}
            className="h-auto justify-start whitespace-normal py-2 text-left"
            onClick={() => onAnswer(option.id)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function ChecklistInput({ decision, answer, frozen, onAnswer }: InputProps) {
  const saved = Array.isArray(answer) && answer.length > 0 ? answer : null;
  // While editing, the draft holds the ticks; otherwise the saved answer is shown read-only.
  const [draft, setDraft] = useDraft(saved);
  const editing = draft !== null && !frozen;
  const ticked = editing ? draft : (saved ?? []);

  const toggle = (id: string) => {
    if (!editing) return;
    setDraft(ticked.includes(id) ? ticked.filter((t) => t !== id) : [...ticked, id]);
  };

  return (
    <div className="flex flex-col gap-2">
      {editing ? (
        decision.options.map((option) => {
          const on = ticked.includes(option.id);
          return (
            <Button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              variant={on ? 'default' : 'outline'}
              data-testid={optionTestId(decision, option.id)}
              className="h-auto justify-start whitespace-normal py-2 text-left"
              onClick={() => toggle(option.id)}
            >
              <span aria-hidden="true" className="mr-2 inline-block w-4 shrink-0 font-mono">
                {on ? 'x' : ' '}
              </span>
              {option.label}
            </Button>
          );
        })
      ) : (
        <AnswerList decision={decision} marks={(id) => (ticked.includes(id) ? 'x' : null)} />
      )}
      {!frozen && (
        <div className="mt-1 flex gap-2">
          {editing ? (
            <Button
              type="button"
              size="sm"
              disabled={ticked.length === 0}
              data-testid={`confirm-${decision.id}`}
              onClick={() => {
                onAnswer(ticked);
                setDraft(null);
              }}
            >
              Confirm
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid={`change-${decision.id}`}
              onClick={() => setDraft(saved ?? [])}
            >
              Change answer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SequenceInput({ decision, answer, frozen, onAnswer }: InputProps) {
  const saved = Array.isArray(answer) && answer.length > 0 ? answer : null;
  const steps = Array.isArray(decision.correct) ? decision.correct.length : 1;
  // Taps accumulate in the draft; the order is judged once it has enough steps.
  const [draft, setDraft] = useDraft(saved);
  const editing = draft !== null && !frozen;
  const order = editing ? draft : (saved ?? []);

  const pick = (id: string) => {
    if (!editing || order.includes(id)) return;
    const next = [...order, id];
    if (next.length >= steps) {
      onAnswer(next);
      setDraft(null);
    } else {
      setDraft(next);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground" data-testid={`sequence-progress-${decision.id}`}>
        {order.length} of {steps} steps
      </p>
      {editing ? (
        decision.options.map((option) => {
          const position = order.indexOf(option.id);
          const picked = position >= 0;
          return (
            <Button
              key={option.id}
              type="button"
              variant={picked ? 'default' : 'outline'}
              aria-pressed={picked}
              disabled={picked}
              data-testid={optionTestId(decision, option.id)}
              className="h-auto justify-start whitespace-normal py-2 text-left"
              onClick={() => pick(option.id)}
            >
              <span className="mr-2 inline-block w-5 shrink-0 font-mono" aria-hidden="true">
                {picked ? `${position + 1}.` : ''}
              </span>
              {picked && <span className="sr-only">Step {position + 1}: </span>}
              {option.label}
            </Button>
          );
        })
      ) : (
        <AnswerList
          decision={decision}
          marks={(id) => {
            const position = order.indexOf(id);
            return position >= 0 ? `${position + 1}.` : null;
          }}
        />
      )}
      {!frozen && (
        <div className="mt-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={order.length === 0}
            data-testid={`restart-${decision.id}`}
            onClick={() => setDraft([])}
          >
            Start again
          </Button>
        </div>
      )}
    </div>
  );
}
