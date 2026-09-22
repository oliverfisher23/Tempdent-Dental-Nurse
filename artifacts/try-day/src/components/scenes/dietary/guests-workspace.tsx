import { CheckFeedback } from '@/components/kitchen/check-feedback';
import { CHECK_COPY } from '@/content/check';
import { useState } from 'react';
import { ADDED_GUESTS, type AddedGuest, type Line } from '@/content/activities';
import { DECISION_ACTIONS, DECISION_CATEGORIES, OUT_OF_SCOPE_ITEMS } from '@/content/scenes/dietary-redesign';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';
import type { GuestAssignment } from '@/lib/simulation';
import {
  COURSES,
  PLANNED_DISH,
  allergenLabel,
  courseOptions,
  decisionKey,
  dishById,
  emptyDecision,
  courseChecked,
  evidenceOptions,
  type DecisionFeedback,
  type DietaryCourse,
  type DietaryDecision,
  type DietaryRedesignState,
} from '@/lib/redesign-dietary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn, upperFirst } from '@/lib/utils';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WorkspaceOpener } from '../../kitchen/workspace-opener';

export interface GuestsWorkspaceProps {
  chart: Record<string, string[]>;
  redesign: DietaryRedesignState;
  guests: Record<string, GuestAssignment>;
  activeGuestId: string;
  onSelectGuest: (guestId: string) => void;
  onDecide: (guestId: string, course: DietaryCourse, patch: Partial<DietaryDecision>) => void;
  onCheckWithTerence: (guestId: string, course: DietaryCourse) => void;
  feedback: Record<string, DecisionFeedback | undefined>;
  decisionsReady: boolean;
  onOpenChart: () => void;
  onBack?: () => void;
}

const COURSE_LABEL: Record<DietaryCourse, string> = { main: 'Main', dessert: 'Dessert' };

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  name,
}: {
  label: string;
  value: T | null;
  options: { id: T; label: string; hint?: string }[];
  onChange: (id: T) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1.5 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`${name}-${option.id}`}
            onClick={() => onChange(option.id)}
            className={cn(
              'text-left rounded border px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400',
              selected ? 'border-red-500 bg-red-950/40 text-white' : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500',
            )}
          >
            <span className="block font-semibold">{option.label}</span>
            {option.hint && <span className="block text-xs text-gray-400 mt-0.5">{option.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

function TerenceLine({ line, kind, testId }: { line: Line; kind: DecisionFeedback['kind']; testId: string }) {
  const outcome = kind === 'stands' ? 'ok' : kind === 'unnecessary-change' ? 'note' : 'issue';
  return (
    <CheckFeedback kind={outcome} speaker={line.speaker} testId={testId}>
      <p>{line.text}</p>
    </CheckFeedback>
  );
}

export function GuestsWorkspace({
  chart,
  redesign,
  guests,
  activeGuestId,
  onSelectGuest,
  onDecide,
  onCheckWithTerence,
  feedback,
  decisionsReady,
  onOpenChart,
  onBack,
}: GuestsWorkspaceProps) {
  const copy = DIETARY_UI.guests;
  const guest = ADDED_GUESTS.find((g) => g.id === activeGuestId) ?? ADDED_GUESTS[0];
  const guestIndex = ADDED_GUESTS.findIndex((g) => g.id === guest.id);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  const assignedFor = (g: AddedGuest): GuestAssignment => guests[g.id] ?? { main: null, dessert: null };
  const guestReady = (g: AddedGuest) => COURSES.every((course) => courseChecked(redesign, g.id, course, assignedFor(g), chart));
  const coursesChecked = ADDED_GUESTS.reduce(
    (total, currentGuest) => total + COURSES.filter((course) => courseChecked(redesign, currentGuest.id, course, assignedFor(currentGuest), chart)).length,
    0,
  );

  const renderCourse = (course: DietaryCourse) => {
    const key = decisionKey(guest.id, course);
    const dec = redesign.decisions[key] ?? emptyDecision();
    const planned = dishById(PLANNED_DISH[course])!;
    const proposed = dishById(dec.proposedDishId);
    // The badge follows the recorded check with Terence, not the state of the form.
    const valid = courseChecked(redesign, guest.id, course, assignedFor(guest), chart);
    const options = evidenceOptions(guest, course, dec.proposedDishId, chart);
    const alternatives = courseOptions(course).filter((dish) => dish.id !== planned.id);
    const cardOpen = !!openCards[key];
    const response = feedback[key];
    const plannedMarks = (chart[planned.id] ?? []).map(allergenLabel);
    const checkLocked = dec.evidence.length === 0 || !dec.reason.trim();

    return (
      <section key={key} aria-labelledby={`${key}-title`} data-testid={`course-${key}`} className="rounded-md border border-gray-800 bg-gray-900/60 p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 id={`${key}-title`} className="text-xs uppercase tracking-widest text-gray-400 font-bold">{COURSE_LABEL[course]} · {copy.plannedDish}</h4>
            <p className="font-serif font-bold text-lg leading-tight">{planned.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {copy.chartRow(planned.short)}: <span className="text-gray-200">{plannedMarks.length ? plannedMarks.join(', ') : copy.noMarks}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {valid && (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-200">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {copy.checked}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-transparent border-gray-600 text-gray-100"
              aria-expanded={cardOpen}
              aria-label={`${cardOpen ? copy.hideRecipe : copy.openRecipe}: ${guest.name} ${COURSE_LABEL[course].toLowerCase()}`}
              onClick={() => setOpenCards((prev) => ({ ...prev, [key]: !cardOpen }))}
            >
              {cardOpen ? copy.hideRecipe : copy.openRecipe}
            </Button>
          </div>
        </div>

        {cardOpen && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[planned, ...(proposed && proposed.id !== planned.id ? [proposed] : [])].map((dish) => (
              <div key={dish.id} className="bg-[#f7f3e8] text-zinc-900 rounded-sm p-3 text-sm border border-amber-100">
                <div className="text-xs uppercase tracking-widest text-zinc-400 font-bold">{dish.course}</div>
                <div className="font-serif font-bold leading-tight">{dish.name}</div>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs">
                  {dish.ingredients.map((ingredient) => (
                    <li key={ingredient}>{ingredient}</li>
                  ))}
                </ul>
                {dish.note && <p className="mt-2 text-xs border-t border-amber-200 pt-1"><span className="font-bold">Card note:</span> {dish.note}</p>}
                <p className="mt-2 text-xs text-zinc-600">
                  {copy.chartRow(dish.short)}: {(chart[dish.id] ?? []).length ? (chart[dish.id] ?? []).map(allergenLabel).join(', ') : copy.noMarks}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-100">{copy.stepFlag}</h5>
          <ChoiceGroup
            name={`${key}-category`}
            label={`${copy.stepFlag} ${guest.name} ${COURSE_LABEL[course].toLowerCase()}`}
            value={dec.category}
            options={DECISION_CATEGORIES}
            onChange={(category) => onDecide(guest.id, course, { category })}
          />
        </div>

        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-100">{copy.stepEvidence}</h5>
          <p className="text-xs text-gray-400">{copy.evidenceHint}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {options.map((option) => {
              const ticked = dec.evidence.includes(option.id);
              return (
                <label key={option.id} className={cn('flex items-start gap-2 rounded border px-2 py-1.5 text-xs cursor-pointer', ticked ? 'border-red-800 bg-red-950/40' : 'border-gray-800 bg-black')}>
                  <Checkbox
                    checked={ticked}
                    onCheckedChange={(checked) => {
                      const next = checked === true ? [...dec.evidence, option.id] : dec.evidence.filter((item) => item !== option.id);
                      onDecide(guest.id, course, { evidence: next });
                    }}
                    aria-label={`${option.label} (${guest.name} ${COURSE_LABEL[course].toLowerCase()})`}
                    className="mt-0.5 bg-black border-gray-500"
                  />
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-gray-400">
                      {option.group === 'sheet'
                        ? 'Function sheet'
                        : option.group === 'chart'
                          ? 'Your chart'
                          : `Recipe card: ${upperFirst((option.dishIds ?? [option.dishId]).map((id) => dishById(id)?.short).filter(Boolean).join(' and '))}`}
                    </span>
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-100">{copy.stepDecision}</h5>
          <ChoiceGroup
            name={`${key}-action`}
            label={`${copy.stepDecision} ${guest.name} ${COURSE_LABEL[course].toLowerCase()}`}
            value={dec.action}
            options={DECISION_ACTIONS}
            onChange={(action) => onDecide(guest.id, course, { action })}
          />
          {(dec.action === 'swap' || dec.action === 'ask') && (
            <div className="pt-1">
              <label htmlFor={`${key}-proposed`} className="text-xs text-gray-300 font-semibold block mb-1">{copy.proposedDish}</label>
              <select
                id={`${key}-proposed`}
                value={dec.proposedDishId && dec.proposedDishId !== planned.id ? dec.proposedDishId : ''}
                onChange={(event) => onDecide(guest.id, course, { proposedDishId: event.target.value || null })}
                className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              >
                <option value="">{dec.action === 'ask' ? `${planned.name} (no change yet)` : copy.selectPlaceholder}</option>
                {alternatives.map((dish) => (
                  <option key={dish.id} value={dish.id}>{dish.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor={`${key}-reason`} className="text-sm font-semibold text-gray-100 block">{copy.stepReason}</label>
          <Textarea
            id={`${key}-reason`}
            value={dec.reason}
            onChange={(event) => onDecide(guest.id, course, { reason: event.target.value })}
            placeholder={copy.reasonPlaceholder}
            className="bg-black border-gray-700 text-white text-sm min-h-[64px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onCheckWithTerence(guest.id, course)}
            disabled={checkLocked}
            className="bg-red-600 text-white hover:bg-red-700 font-semibold"
            data-testid={`check-${key}`}
            aria-label={`${CHECK_COPY.check}: ${guest.name} ${COURSE_LABEL[course].toLowerCase()}`}
          >
            {CHECK_COPY.check}
          </Button>
          {checkLocked && <p className="text-xs text-gray-400">{copy.checkLocked}</p>}
        </div>
        {response && <TerenceLine line={response.line} kind={response.kind} testId={`feedback-${key}`} />}
      </section>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 md:p-6 gap-4 overflow-y-auto" data-testid="guests-workspace">
      <WorkspaceOpener
        taskId="check-the-dietary-list"
        what={copy.opener.what}
        how={copy.opener.how}
        done={copy.opener.done}
        progress={{ done: coursesChecked, total: ADDED_GUESTS.length * COURSES.length, noun: copy.progressNoun }}
        pattern="tap"
        tone="dark"
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 gap-4">
        <div>
          <h2 data-dialog-title className="text-2xl md:text-3xl font-serif font-bold text-red-500">{copy.title}</h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base">{copy.subtitle}</p>
          <p className="text-xs text-gray-300 mt-2">{copy.scopeNotice}</p>
          <p className="text-xs text-amber-200 mt-1">{copy.holdNotice}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="text-black bg-white hover:bg-gray-200 border-none">
              Back to the room
            </Button>
          )}
          <Button variant="outline" onClick={onOpenChart} className="bg-transparent border-gray-600 text-white" data-testid="back-to-chart">
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> {copy.reviewChart}
          </Button>
          {!decisionsReady && <p className="max-w-72 text-xs text-gray-300" role="status">{copy.boardLocked}</p>}
        </div>
      </div>

      <div role="tablist" aria-label={copy.title} className="flex gap-2 overflow-x-auto pb-1">
        {ADDED_GUESTS.map((g) => {
          const selected = g.id === guest.id;
          const ready = guestReady(g);
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`guest-tab-${g.id}`}
              onClick={() => onSelectGuest(g.id)}
              className={cn('shrink-0 rounded border px-3 py-2 text-left', selected ? 'border-red-500 bg-red-950/30' : 'border-gray-800 bg-gray-900 hover:border-gray-600')}
            >
              <span className="block text-sm font-semibold">{g.name}</span>
              <span className="block text-xs text-gray-400">{copy.tablePrefix} {g.table}</span>
              <span className={cn('mt-1 inline-block rounded border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider', ready ? 'border-emerald-800 bg-emerald-950 text-emerald-200' : 'border-gray-700 bg-black text-gray-300')}>
                {ready ? copy.decisionsMade : copy.needsReview}
              </span>
              {!selected && <span className="mt-1 block text-xs text-gray-400">{copy.selectGuest}</span>}
            </button>
          );
        })}
      </div>

      <div className="space-y-4" role="tabpanel" aria-label={`${guest.name}, ${copy.tablePrefix.toLowerCase()} ${guest.table}`}>
        <div className="rounded-md border border-gray-800 bg-gray-900 p-4 space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-serif font-bold text-xl">{guest.name} <span className="text-gray-400 font-sans text-sm font-normal">· {copy.tablePrefix} {guest.table}</span></h3>
          </div>
          <p className="text-sm">
            <span className="text-gray-400">{copy.requirementPrefix}</span>{' '}
            <span className="font-semibold text-white" data-testid={`requirement-${guest.id}`}>{guest.requirement}</span>
          </p>
          {guest.id === 'priya' && <p className="text-xs text-amber-200">{copy.priyaNotice}</p>}
          {guest.vegetarian && (
            <div className="rounded border border-amber-900/60 bg-amber-950/30 p-3 text-xs text-amber-100 flex gap-2" data-testid="tom-starter-note">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <div className="font-bold uppercase tracking-wider text-xs">{copy.tomStarterTitle}</div>
                <p>{OUT_OF_SCOPE_ITEMS.tomStarter.detail}</p>
              </div>
            </div>
          )}
        </div>

        {COURSES.map(renderCourse)}

        <div className="flex justify-between gap-2 pb-6">
          <Button variant="outline" className="bg-transparent border-gray-700 text-white" disabled={guestIndex === 0} onClick={() => onSelectGuest(ADDED_GUESTS[guestIndex - 1].id)}>
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> {ADDED_GUESTS[guestIndex - 1]?.name.split(' ')[0] ?? ''}
          </Button>
          {guestIndex < ADDED_GUESTS.length - 1 ? (
            <Button variant="outline" className="bg-transparent border-gray-700 text-white" onClick={() => onSelectGuest(ADDED_GUESTS[guestIndex + 1].id)}>
              {copy.nextGuest}: {ADDED_GUESTS[guestIndex + 1].name.split(' ')[0]} <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          ) : (
            <p className="text-xs text-gray-400 self-center">{decisionsReady ? '' : copy.incompleteNotice}</p>
          )}
        </div>
      </div>
    </div>
  );
}
