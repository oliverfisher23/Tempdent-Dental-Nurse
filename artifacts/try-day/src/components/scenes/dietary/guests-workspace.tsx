import { useState } from 'react';
import { ADDED_GUESTS, ALLERGENS, DISHES } from '@/content/activities';
import { dietaryDecisionsReady, DietaryRedesignState, DietaryDecision } from '@/lib/redesign-dietary';
import { getEvidenceOptions, DECISION_CATEGORIES } from '@/content/scenes/dietary-redesign';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
    // A deliberate Keep retains the planned dish; no candidate is preselected before that choice.
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
    // Keep state updates outside an updater; nested updates can overwrite each other.
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
      <div className="flex flex-col gap-4 border border-gray-200 bg-white p-4">
        <h4 className="font-serif text-lg font-bold capitalize text-red-600">{course}</h4>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <Label className="text-xs text-gray-500 tracking-wide">Planned dish</Label>
              <div className="font-medium">{plannedDish.name}</div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Decision</Label>
              <div className="flex gap-2">
                {['keep', 'swap', 'ask'].map(act => (
                  <Button 
                    key={act} 
                    variant={dec.action === act ? 'default' : 'outline'}
                    className={dec.action === act ? 'bg-black text-white hover:bg-black' : ''}
                    onClick={() => handleDecisionChange(course, 'action', act)}
                    aria-label={`${act} ${course} for ${guest.name}`}
                    data-testid={`decision-${guest.id}-${course}-${act}`}
                  >
                    {act.charAt(0).toUpperCase() + act.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {(dec.action === 'swap' || dec.action === 'ask') && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 tracking-wide">Proposed dish</Label>
                <Select value={dec.proposedDishId || ''} onValueChange={(v) => handleDecisionChange(course, 'proposedDishId', v)}>
                  <SelectTrigger className="w-full h-auto min-h-9 whitespace-normal" aria-label={`Proposed ${course} for ${guest.name}`} data-testid={`proposal-${guest.id}-${course}`}>
                    <SelectValue placeholder="Select dish..." />
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
              <Label className="text-xs text-gray-500 tracking-wide">Reason category</Label>
              <Select value={dec.category || ''} onValueChange={(v) => handleDecisionChange(course, 'category', v)}>
                <SelectTrigger className="w-full h-auto min-h-9 whitespace-normal" aria-label={`Reason category for ${guest.name} ${course}`} data-testid={`category-${guest.id}-${course}`}>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {DECISION_CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500 tracking-wide">Your reason or question</Label>
              <Textarea 
                value={dec.reason}
                aria-label={`Reason for ${guest.name} ${course}`}
                data-testid={`reason-${guest.id}-${course}`}
                onChange={(e) => handleDecisionChange(course, 'reason', e.target.value)}
                placeholder="Explain why keeping, swapping, or asking..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <div className="w-full lg:w-64 shrink-0 bg-gray-50 p-3 space-y-2 border border-gray-100">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">Evidence</Label>
            <p className="text-xs text-gray-400 mb-2">Select evidence to support your decision:</p>
            <div className="space-y-2">
              {evidenceOptions.map((ev, evidenceIndex) => (
                <label key={ev} className="flex items-start gap-2 cursor-pointer text-sm">
                  <Checkbox 
                    checked={(dec.evidence || []).includes(ev)}
                    aria-label={`${ev} for ${guest.name} ${course}`}
                    data-testid={`evidence-${guest.id}-${course}-${evidenceIndex}`}
                    onCheckedChange={() => toggleEvidence(course, ev)}
                  />
                  <span className="leading-tight">{ev}</span>
                </label>
              ))}
            </div>
            <details className="border-t border-gray-200 pt-3">
              <summary className="cursor-pointer font-medium">Use your chart and recipes</summary>
              {[plannedDishId, ...(dec.proposedDishId && dec.proposedDishId !== plannedDishId ? [dec.proposedDishId] : [])].map(id => {
                const dish = DISHES.find(item => item.id === id);
                if (!dish) return null;
                const marks = stateChart[id] ?? [];
                return <section key={id} className="mt-3 text-sm">
                  <p className="font-semibold">{dish.name}</p>
                  <p className="mt-1"><strong>Your chart:</strong> {marks.length ? marks.map(mark => ALLERGENS.find(a => a.id === mark)?.label ?? mark).join(', ') : 'No categories marked'}</p>
                  <ul className="mt-2 list-disc pl-4">{dish.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul>
                </section>;
              })}
            </details>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-0 bg-gray-50 text-black">
      {/* Sidebar: Guests */}
      <div className="w-full md:w-52 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-red-600 text-white">
          <h2 className="font-serif font-bold text-xl">Guest list</h2>
        </div>
        <div className="flex md:block overflow-x-auto md:overflow-y-auto p-2 gap-2 md:space-y-2">
          {ADDED_GUESTS.map(g => {
            const mainDone = !!redesign.decisions[`${g.id}:main`]?.action;
            const dessertDone = !!redesign.decisions[`${g.id}:dessert`]?.action;
            const isDone = mainDone && dessertDone;
            
            return (
              <button 
                key={g.id}
                onClick={() => setActiveGuest(g.id)}
                 data-testid={`guest-${g.id}`}
                 className={`min-w-[130px] md:w-full text-left p-3 border rounded transition-colors ${
                  activeGuest === g.id 
                    ? 'border-black bg-gray-100 ring-1 ring-black' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-bold">{g.name}</div>
                <div className="text-xs text-gray-500 mt-1">Table {g.table}</div>
                {isDone && <div className="text-xs text-green-600 mt-1 font-medium">Decisions made</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Area: Guest Details & Decisions */}
      <div className="min-w-0 flex-1 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-4 border border-gray-200">
            <h3 className="font-serif text-2xl font-bold">{guest.name} <span className="text-gray-400 font-sans text-lg">— Table {guest.table}</span></h3>
            <div className="mt-2 text-red-600 font-medium bg-red-50 p-2 inline-block rounded">
              Requirement: {guest.requirement}
            </div>
            <p className="mt-3 text-sm">You are proposing mains and desserts, not approving a whole meal. Tom's fish starter still needs a separate decision.</p>
            <p className="mt-2 text-sm">All proposals remain on hold for Terence's supplier, preparation and service checks.</p>
            {guest.id === 'priya' && <p className="mt-2 text-sm">The sheet says “nut allergy”. Tree nuts and peanuts are separate categories; ask Terence to confirm the exact requirement rather than assuming one allergy means both.</p>}
          </div>

          <div className="space-y-6">
            {renderCoursePanel('main', 'beef', 'wellington')}
            {renderCoursePanel('dessert', 'frangipane', 'pear')}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
            {onBack && <Button variant="outline" onClick={onBack} data-testid="guest-back-chart">Review the chart</Button>}
            {onNext && <Button onClick={onNext} disabled={!dietaryDecisionsReady(redesign, stateGuests)} data-testid="guest-next-board">Review the board</Button>}
            {!dietaryDecisionsReady(redesign, stateGuests) && <p className="w-full text-sm text-gray-600">Check each main and dessert: dish, decision, reason category, evidence and your explanation.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
