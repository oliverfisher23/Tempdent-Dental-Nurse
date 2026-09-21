import { ADDED_GUESTS } from '@/content/activities';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';
import { PREPARATION_CHECKS } from '@/content/scenes/dietary-redesign';
import {
  COURSES,
  PLANNED_DISH,
  boardComplete,
  decisionKey,
  dietaryChanges,
  dishById,
  openItemsForTerence,
  renderBoardNote,
  type DietaryRedesignState,
} from '@/lib/redesign-dietary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';
import { WorkspaceOpener } from '../../kitchen/workspace-opener';

interface BoardWorkspaceProps {
  redesign: DietaryRedesignState;
  boardPosted: boolean;
  onUpdateRedesign: (updater: (prev: DietaryRedesignState) => DietaryRedesignState) => void;
  onPostBoard: () => void;
  onBack?: () => void;
}

const COURSE_LABEL = { main: 'Main', dessert: 'Dessert' } as const;

/**
 * The evening board as a structured record (D06/D11/D12): one entry per actual change,
 * each with a learner-written reason and, for allergy-driven changes, a preparation
 * status that stays pending. Nothing here can be marked cleared.
 */
export function BoardWorkspace({ redesign, boardPosted, onUpdateRedesign, onPostBoard, onBack }: BoardWorkspaceProps) {
  const copy = DIETARY_UI.board;
  const changes = dietaryChanges({ redesign });
  const complete = boardComplete({ redesign });
  const canPost = !boardPosted && complete && redesign.serviceHoldAcknowledged;
  const changesWritten = changes.filter((change) => change.boardReason.trim()).length;
  const kept = ADDED_GUESTS.flatMap((guest) =>
    COURSES.filter((course) => {
      const dec = redesign.decisions[decisionKey(guest.id, course)];
      return dec?.action && (!dec.proposedDishId || dec.proposedDishId === PLANNED_DISH[course]);
    }).map((course) => ({ guest, course })),
  );

  const setReason = (key: string, reason: string) =>
    onUpdateRedesign((prev) => ({ ...prev, board: { ...(prev.board ?? {}), [key]: { reason } } }));

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 md:p-6 gap-4 overflow-y-auto" data-testid="board-workspace">
      <WorkspaceOpener
        taskId="check-the-dietary-list"
        what={copy.opener.what}
        how={copy.opener.how}
        done={copy.opener.done}
        progress={changes.length > 0 ? { done: changesWritten, total: changes.length, noun: copy.progressNoun } : undefined}
        pattern="list"
        tone="dark"
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-red-500">{copy.title}</h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base max-w-2xl">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {onBack && !boardPosted && (
            <Button variant="outline" onClick={onBack} className="text-black bg-white hover:bg-gray-200 border-none">
              <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> {copy.back}
            </Button>
          )}
          <div className="flex flex-col items-start gap-1 md:items-end">
            <Button onClick={onPostBoard} disabled={!canPost} className="bg-red-600 text-white hover:bg-red-700 font-semibold" data-testid="post-board">
              {boardPosted ? <><CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" /> {copy.posted}</> : copy.postAndSignOff}
            </Button>
            {!boardPosted && !canPost && <p className="max-w-72 text-xs text-gray-400">{copy.postLocked}</p>}
          </div>
        </div>
      </div>

      {boardPosted && (
        <div role="status" className="rounded border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-100" data-testid="board-posted-notice">
          {copy.postedNotice}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-8">
        <div className="flex-1 space-y-4">
          <h3 className="uppercase tracking-widest text-xs text-gray-500 font-bold">{copy.changesTitle}</h3>
          {changes.length === 0 && <p className="text-sm text-gray-400">{copy.noChanges}</p>}
          {changes.map((change) => {
            const original = dishById(change.originalDishId)!;
            const replacement = dishById(change.replacementDishId)!;
            const reasonId = `board-reason-${change.key}`;
            return (
              <article key={change.key} aria-labelledby={`${change.key}-board-title`} data-testid={`board-entry-${change.key}`} className="rounded-md border border-gray-800 bg-gray-900/70 p-4 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 id={`${change.key}-board-title`} className="font-serif font-bold text-lg">
                    Table {change.table} · {change.guestName} <span className="text-gray-400 font-sans text-sm font-normal">· {COURSE_LABEL[change.course]}</span>
                  </h4>
                </div>
                <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{copy.original}</dt>
                    <dd className="text-gray-300 line-through decoration-red-500/70">{original.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{copy.replacement}</dt>
                    <dd className="text-white font-semibold">{replacement.name}</dd>
                  </div>
                </dl>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor={reasonId} className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{copy.reasonLabel}</label>
                    {!boardPosted && change.decisionReason.trim() && change.boardReason !== change.decisionReason && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-300 hover:text-white" onClick={() => setReason(change.key, change.decisionReason)} aria-label={`${copy.useMyReason}: ${change.guestName} ${COURSE_LABEL[change.course].toLowerCase()}`}>
                        {copy.useMyReason}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id={reasonId}
                    value={change.boardReason}
                    onChange={(event) => setReason(change.key, event.target.value)}
                    disabled={boardPosted}
                    placeholder={copy.reasonPlaceholder}
                    aria-invalid={!change.boardReason.trim() || undefined}
                    className={cn('bg-black text-white text-sm min-h-[60px]', change.boardReason.trim() ? 'border-gray-700' : 'border-amber-600')}
                  />
                  {!change.boardReason.trim() && <p className="mt-1 text-xs text-amber-200">{copy.missingReason}</p>}
                </div>
                <div className={cn('rounded border p-2 text-xs flex items-center gap-2', change.preparationStatus === 'pending' ? 'border-amber-800 bg-amber-950/40 text-amber-100' : 'border-gray-800 bg-black text-gray-400')} data-testid={`prep-status-${change.key}`}>
                  {change.preparationStatus === 'pending' && <Clock3 className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />}
                  <span className="font-bold uppercase tracking-wider text-[10px] mr-1">{copy.prepStatusLabel}:</span>
                  <span>{change.preparationStatus === 'pending' ? copy.prepPending : copy.prepNotRequired}</span>
                </div>
              </article>
            );
          })}

          {kept.length > 0 && (
            <div className="rounded border border-gray-800 bg-black p-3 text-xs text-gray-400">
              <div className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-1">{copy.keptTitle}</div>
              <ul className="space-y-0.5">
                {kept.map(({ guest, course }) => (
                  <li key={`${guest.id}:${course}`}>
                    {guest.name}, table {guest.table} · {COURSE_LABEL[course].toLowerCase()}: {dishById(PLANNED_DISH[course])!.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-96 shrink-0 space-y-4" aria-label={copy.forTerenceTitle}>
          <div className="rounded-md border border-gray-800 bg-gray-900 p-4 space-y-3">
            <h3 className="font-bold text-red-500 uppercase tracking-widest text-xs">{copy.forTerenceTitle}</h3>
            <ul className="space-y-2 text-sm text-gray-200" data-testid="open-items">
              {openItemsForTerence({ redesign }).map((item) => (
                <li key={item} className="rounded border border-gray-800 bg-black p-2 leading-snug">{item}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 leading-snug">{PREPARATION_CHECKS.pear}</p>
          </div>

          <label className={cn('flex items-start gap-3 rounded-md border p-3', boardPosted ? 'border-gray-800 bg-black' : 'cursor-pointer border-gray-700 bg-gray-800/50 hover:bg-gray-800')}>
            <Checkbox
              checked={redesign.serviceHoldAcknowledged}
              onCheckedChange={(checked) => onUpdateRedesign((prev) => ({ ...prev, serviceHoldAcknowledged: checked === true }))}
              disabled={boardPosted}
              aria-label={copy.holdCheckboxLabel}
              data-testid="hold-acknowledged"
              className="mt-0.5 bg-black border-gray-500"
            />
            <span className="text-sm leading-tight text-gray-300 font-medium">{copy.holdCheckboxLabel}</span>
          </label>

          <div className="rounded-md border border-gray-800 bg-[#111] p-4">
            <h3 className="font-bold text-gray-300 uppercase tracking-widest text-xs mb-2">{copy.boardPreviewTitle}</h3>
            <pre className="whitespace-pre-wrap font-mono text-xs text-gray-200 leading-relaxed" data-testid="board-preview">
              {changes.length ? renderBoardNote({ redesign }) : copy.noChanges}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
}
