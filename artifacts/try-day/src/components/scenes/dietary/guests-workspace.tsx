import { useState } from 'react';
import { ADDED_GUESTS, ALLERGENS, DISHES } from '@/content/activities';
import { dietaryDecisionsReady, DietaryRedesignState, DietaryDecision } from '@/lib/redesign-dietary';
import { getEvidenceOptions, DECISION_CATEGORIES } from '@/content/scenes/dietary-redesign';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface GuestsWorkspaceProps {
  redesign: DietaryRedesignState;
  onUpdateRedesign: (updater: (prev: DietaryRedesignState) => DietaryRedesignState) => void;
  stateGuests: Record<string, { main: string | null; dessert: string | null }>;
  onAssignGuest: (guestId: string, field: 'main' | 'dessert', val: string) => void;
  stateChart?: Record<string, string[]>;
  onNext?: () => void;
  onBack?: () => void;
}

export function GuestsWorkspace({
  redesign,
  onUpdateRedesign,
  stateGuests,
  onAssignGuest,
  stateChart = {},
  onNext,
  onBack,
}: GuestsWorkspaceProps) {
  const [activeGuest, setActiveGuest] = useState(ADDED_GUESTS[0].id);

  const guest = ADDED_GUESTS.find(g => g.id === activeGuest)!;

  const handleDecisionChange = (course: 'main' | 'dessert', field: keyof DietaryDecision, value: any) => {
    const key = `${guest.id}:${course}`;
    const keptDish = course === 'main' ? 'beef' : 'frangipane';
    const selectedDish = field === 'action' && value === 'keep' ? keptDish : field === 'proposedDishId' ? value : null;
    onUpdateRedesign(prev => {
      const existing = prev.decisions[key] || { action: null, reason: '', evidence: [], category: null };

      const next = { ...existing, [field]: value, ...(selectedDish ? { proposedDishId: selectedDish } : {}) };

      return {
        ...prev,
        decisions: {
          ...prev.decisions,
          [key]: next
        }
      };
    });
    if (selectedDish) onAssignGuest(guest.id, course, selectedDish);
  };

  const toggleEvidence = (course: 'main' | 'dessert', ev: string) => {
    const key = `${guest.id}:${course}`;
    onUpdateRedesign(prev => {
      const existing = prev.decisions[key] || { action: null, reason: '', evidence: [], category: null };
      const evidence = existing.evidence || [];
      const nextEv = evidence.includes(ev) ? evidence.filter(e => e !== ev) : [...evidence, ev];
      return { ...prev, decisions: { ...prev.decisions, [key]: { ...existing, evidence: nextEv } } };
    });
  };

  const renderCoursePanel = (course: 'main' | 'dessert', plannedDishId: string, altDishId: string) => {
    const decisionKey = `${guest.id}:${course}`;
    const dec = redesign.decisions[decisionKey] || { action: null, reason: '', evidence: [], category: null };
    const plannedDish = DISHES.find(d => d.id === plannedDishId)!;
    const evidenceOptions = getEvidenceOptions(plannedDishId, dec.proposedDishId);
    const availableAlternatives = DISHES.filter(d => d.course.toLowerCase().includes(course) || d.id === altDishId);

    return (
      <div className="flex flex-col xl:flex-row gap-0 xl:gap-4 border border-gray-200 bg-white rounded-md overflow-hidden shadow-sm">
        {/* Left Side: Decision Form */}
        <div className="flex-1 p-4 md:p-6 space-y-6">
          <h4 className="font-serif text-xl font-bold capitalize text-red-600 border-b border-gray-100 pb-2">{course}</h4>

          <div className="space-y-5">
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide">{DIETARY_UI.guests.plannedDish}</Label>
              <div className="font-medium text-gray-900 mt-1">{plannedDish.name}</div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-gray-500 uppercase tracking-wide" id={`decision-group-${course}`}>{DIETARY_UI.guests.decision}</Label>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby={`decision-group-${course}`}
              >
                {['keep', 'swap', 'ask'].map(act => {
                  const isSelected = dec.action === act;
                  return (
                    <Button
                      key={act}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`h-11 px-6 ${isSelected ? 'bg-black text-white hover:bg-gray-800' : 'bg-white hover:bg-gray-50'}`}
                      onClick={() => handleDecisionChange(course, 'action', act)}
                      aria-pressed={isSelected}
                      aria-label={`${act} ${course} for ${guest.name}`}
                      data-testid={`decision-${guest.id}-${course}-${act}`}
                    >
                      {act.charAt(0).toUpperCase() + act.slice(1)}
                    </Button>
                  );
                })}
              </div>
            </div>

            {(dec.action === 'swap' || dec.action === 'ask') && (
              <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">{DIETARY_UI.guests.proposedDish}</Label>
                <Select value={dec.proposedDishId || ''} onValueChange={(v) => handleDecisionChange(course, 'proposedDishId', v)}>
                  <SelectTrigger className="w-full min-h-[44px] bg-white whitespace-normal text-left h-auto py-2" aria-label={`Proposed ${course} for ${guest.name}`} data-testid={`proposal-${guest.id}-${course}`}>
                    <SelectValue placeholder={DIETARY_UI.guests.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAlternatives.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">{DIETARY_UI.guests.reasonCategory}</Label>
              <Select value={dec.category || ''} onValueChange={(v) => handleDecisionChange(course, 'category', v)}>
                <SelectTrigger className="w-full min-h-[44px] whitespace-normal text-left h-auto py-2" aria-label={`Reason category for ${guest.name} ${course}`} data-testid={`category-${guest.id}-${course}`}>
                  <SelectValue placeholder={DIETARY_UI.guests.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {DECISION_CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">{DIETARY_UI.guests.yourReason}</Label>
              <Textarea
                value={dec.reason}
                aria-label={`Reason for ${guest.name} ${course}`}
                data-testid={`reason-${guest.id}-${course}`}
                onChange={(e) => handleDecisionChange(course, 'reason', e.target.value)}
                placeholder={DIETARY_UI.guests.reasonPlaceholder}
                className="resize-none min-h-[100px] text-base p-3"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Evidence Checklist & Chart Comparison */}
        <div className="w-full xl:w-80 shrink-0 bg-gray-50 border-t xl:border-t-0 xl:border-l border-gray-200 flex flex-col">
          <div className="p-4 md:p-6 space-y-4">
            <h4 className="font-semibold text-sm text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <span className="bg-black text-white px-2 py-0.5 rounded-sm text-xs">{DIETARY_UI.guests.requiredBadge}</span>
              {DIETARY_UI.guests.selectEvidenceTitle}
            </h4>
            <p className="text-sm text-gray-600 leading-snug">{DIETARY_UI.guests.selectEvidenceHint}</p>

            <div className="space-y-2">
              {evidenceOptions.map((ev, evidenceIndex) => (
                <label key={ev} className="flex items-start gap-3 p-2 -mx-2 rounded hover:bg-gray-100 cursor-pointer motion-safe:transition-colors focus-within:ring-2 focus-within:ring-black outline-none">
                  <Checkbox
                    checked={(dec.evidence || []).includes(ev)}
                    aria-label={`${ev} for ${guest.name} ${course}`}
                    data-testid={`evidence-${guest.id}-${course}-${evidenceIndex}`}
                    onCheckedChange={() => toggleEvidence(course, ev)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-sm leading-tight text-gray-800 select-none">{ev}</span>
                </label>
              ))}
            </div>
          </div>

          <div key={`${guest.id}-${course}`} className="flex-1 p-4 md:p-6 bg-white border-t border-gray-200 activity-enter">
             <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-4">{DIETARY_UI.guests.recipesAndChart}</h4>
             <div className="space-y-5">
              {[plannedDishId, ...(dec.proposedDishId && dec.proposedDishId !== plannedDishId ? [dec.proposedDishId] : [])].map(id => {
                const dish = DISHES.find(item => item.id === id);
                if (!dish) return null;
                const marks = stateChart[id] ?? [];

                return (
                  <div key={id} className="text-sm bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-2">{dish.name}</p>

                    <div className="mb-3">
                      <span className="font-semibold text-xs uppercase text-gray-500 block mb-1">{DIETARY_UI.guests.chartMarks}</span>
                      {marks.length ? (
                        <div className="flex flex-wrap gap-1">
                          {marks.map(mark => {
                            const label = ALLERGENS.find(a => a.id === mark)?.label ?? mark;
                            return <span key={mark} className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded border border-red-200">{label}</span>;
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">{DIETARY_UI.guests.noMarks}</span>
                      )}
                    </div>

                    <div>
                      <span className="font-semibold text-xs uppercase text-gray-500 block mb-1">{DIETARY_UI.chart.ingredients}</span>
                      <ul className="list-disc pl-4 text-gray-700 space-y-0.5 marker:text-gray-400">
                        {dish.ingredients.map(ingredient => (
                          <li key={ingredient}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentIndex = ADDED_GUESTS.findIndex(g => g.id === activeGuest);
  const isLastGuest = currentIndex === ADDED_GUESTS.length - 1;

  const handleNextGuest = () => {
    if (!isLastGuest) setActiveGuest(ADDED_GUESTS[currentIndex + 1].id);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-0 bg-gray-100 text-black h-full overflow-hidden">
      {/* Sidebar: Guests */}
      <div className="w-full md:w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col md:h-full z-10 shadow-sm md:shadow-none">
        <div className="p-4 md:p-6 border-b border-gray-200 bg-red-600 text-white">
          <h2 className="font-serif font-bold text-xl md:text-2xl">{DIETARY_UI.guests.title}</h2>
          <p className="text-red-100 text-sm mt-1">{DIETARY_UI.guests.subtitle}</p>
        </div>
        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-3 gap-2 flex-1" role="tablist" aria-label="Guests">
          {ADDED_GUESTS.map(g => {
            const mainDone = !!redesign.decisions[`${g.id}:main`]?.action;
            const dessertDone = !!redesign.decisions[`${g.id}:dessert`]?.action;
            const isDone = mainDone && dessertDone;
            const isActive = activeGuest === g.id;

            return (
              <button
                key={g.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`guest-panel-${g.id}`}
                id={`guest-tab-${g.id}`}
                onClick={() => setActiveGuest(g.id)}
                data-testid={`guest-${g.id}`}
                className={`min-w-[160px] md:min-w-0 md:w-full text-left p-3 md:p-4 border rounded-md motion-safe:transition-all focus-visible:ring-2 focus-visible:ring-black outline-none shrink-0 md:shrink flex flex-col h-full ${
                  isActive
                    ? 'border-black bg-gray-50 ring-1 ring-black shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-bold text-base">{g.name}</div>
                <div className="text-sm text-gray-600 mt-1 flex-1">{DIETARY_UI.guests.tablePrefix} {g.table}</div>
                {isDone ? (
                  <div className="text-xs text-green-700 mt-2 font-medium flex items-center gap-1 bg-green-50 w-fit px-2 py-0.5 rounded border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {DIETARY_UI.guests.decisionsMade}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span> {DIETARY_UI.guests.needsReview}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Area: Guest Details & Decisions */}
      <div
        id={`guest-panel-${guest.id}`}
        role="tabpanel"
        aria-labelledby={`guest-tab-${guest.id}`}
        className="min-w-0 flex-1 overflow-y-auto"
      >
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6 lg:space-y-8 pb-20">
          <div key={`info-${guest.id}`} className="bg-white p-5 md:p-6 border border-gray-200 rounded-lg shadow-sm activity-enter">
            <h3 className="font-serif text-2xl md:text-3xl font-bold flex items-baseline gap-3">
              {guest.name}
              <span className="text-gray-400 font-sans text-lg md:text-xl font-medium">{DIETARY_UI.guests.tablePrefix} {guest.table}</span>
            </h3>
            <div className="mt-4 text-red-800 font-bold bg-red-50 p-3 rounded border border-red-100 inline-block text-base">
              {DIETARY_UI.guests.requirementPrefix} {guest.requirement}
            </div>
            <div className="mt-4 space-y-2 text-gray-700 text-sm md:text-base bg-gray-50 p-4 rounded border border-gray-100">
              <p>{DIETARY_UI.guests.generalNotice}</p>
              <p>{DIETARY_UI.guests.holdNotice}</p>
              {guest.id === 'priya' && (
                <p className="font-medium text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                  {DIETARY_UI.guests.priyaNotice}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            {renderCoursePanel('main', 'beef', 'wellington')}
            {renderCoursePanel('dessert', 'frangipane', 'pear')}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6 mt-8">
            <div className="w-full sm:w-auto order-2 sm:order-1">
              {onBack && (
                <Button variant="outline" onClick={onBack} data-testid="guest-back-chart" className="w-full sm:w-auto h-11 px-6">
                  {DIETARY_UI.guests.reviewChart}
                </Button>
              )}
            </div>
            <div className="w-full sm:w-auto order-1 sm:order-2 flex gap-3">
              {!isLastGuest ? (
                <Button
                  onClick={handleNextGuest}
                  variant="secondary"
                  className="w-full sm:w-auto h-11 px-6 gap-2 bg-gray-200 hover:bg-gray-300 text-black"
                >
                  {DIETARY_UI.guests.nextGuest} <ChevronRight className="w-4 h-4" />
                </Button>
              ) : null}
              {onNext && (
                <Button
                  onClick={onNext}
                  disabled={!dietaryDecisionsReady(redesign, stateGuests)}
                  data-testid="guest-next-board"
                  className="w-full sm:w-auto h-11 px-6 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {DIETARY_UI.guests.reviewBoard}
                </Button>
              )}
            </div>
            {!dietaryDecisionsReady(redesign, stateGuests) && (
              <p className="w-full text-sm text-gray-500 text-center sm:text-left order-3">
                {DIETARY_UI.guests.incompleteNotice}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
