import { useState } from 'react';
import { ADDED_GUESTS, DISHES } from '@/content/activities';
import { DietaryRedesignState } from '@/lib/redesign-dietary';
import { PREPARATION_CHECKS } from '@/content/scenes/dietary-redesign';
import { DIETARY_UI } from '@/content/scenes/dietary-interaction';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface BoardWorkspaceProps {
  boardNote: string;
  onBoardNoteChange: (val: string) => void;
  boardPosted: boolean;
  onPostBoard: () => void;
  redesign: DietaryRedesignState;
  onUpdateRedesign: (updater: (prev: DietaryRedesignState) => DietaryRedesignState) => void;
  stateGuests: Record<string, { main: string | null; dessert: string | null }>;
  onBack?: () => void;
}

export function BoardWorkspace({
  boardNote,
  onBoardNoteChange,
  boardPosted,
  onPostBoard,
  redesign,
  onUpdateRedesign,
  stateGuests,
  onBack
}: BoardWorkspaceProps) {

  const generateDraft = () => {
    let draft = "";
    ADDED_GUESTS.forEach(g => {
      const mainDec = redesign.decisions[`${g.id}:main`];
      const dessertDec = redesign.decisions[`${g.id}:dessert`];

      const changes: string[] = [];

      const plannedMain = 'beef';
      if (mainDec?.proposedDishId && mainDec.proposedDishId !== plannedMain) {
        const proposed = DISHES.find(d => d.id === mainDec.proposedDishId);
        if (proposed) changes.push(`Braised beef shin → ${proposed.name} (Reason: ${mainDec.reason})`);
      }

      const plannedDessert = 'frangipane';
      if (dessertDec?.proposedDishId && dessertDec.proposedDishId !== plannedDessert) {
        const proposed = DISHES.find(d => d.id === dessertDec.proposedDishId);
        if (proposed) changes.push(`Pistachio and raspberry frangipane tart, crème fraîche → ${proposed.name} (Reason: ${dessertDec.reason})`);
      }

      if (changes.length > 0) {
        draft += `${g.name} · Table ${g.table}\n${changes.join('\n')}\n\n`;
      }
    });
    return draft.trim();
  };

  const handleUseDraft = () => {
    if (!boardPosted) onBoardNoteChange(generateDraft());
  };

  const hasUnresolvedChecks = Object.values(redesign.openQuestions).some(q => q && q.trim().length > 0) ||
                              Object.values(redesign.decisions).some(d => d.action === 'ask' || d.category === 'information-missing');

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-red-500">{DIETARY_UI.board.title}</h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base">{DIETARY_UI.board.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="text-black bg-white hover:bg-gray-200 border-none">
              {DIETARY_UI.board.back}
            </Button>
          )}
          <Button
            onClick={onPostBoard}
            disabled={boardPosted || !redesign.serviceHoldAcknowledged}
            className="bg-red-600 text-white hover:bg-red-700 flex-1 md:flex-none font-semibold"
          >
            {boardPosted ? <><CheckCircle2 className="w-4 h-4 mr-2" /> {DIETARY_UI.board.posted}</> : DIETARY_UI.board.postAndSignOff}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-6 min-h-0 pb-10 md:pb-0">
        <div className="flex-1 flex flex-col gap-3 md:gap-4 order-2 md:order-1">
          <div className="flex justify-between items-end">
            <span className="uppercase tracking-widest text-xs text-gray-500 font-bold">{DIETARY_UI.board.boardMessage}</span>
            {!boardPosted && (
              <Button variant="ghost" size="sm" onClick={handleUseDraft} className="text-gray-400 hover:text-white h-7 text-xs px-2 md:px-3">
                {DIETARY_UI.board.insertDraft}
              </Button>
            )}
          </div>
          <Textarea
            value={boardNote}
            onChange={e => onBoardNoteChange(e.target.value)}
            disabled={boardPosted}
            className="flex-1 min-h-[250px] md:min-h-0 bg-gray-900 border-gray-700 text-white text-base md:text-lg font-mono resize-none focus-visible:ring-red-500 rounded-md shadow-inner p-3 md:p-4 leading-relaxed"
            placeholder={DIETARY_UI.board.placeholder}
          />
        </div>

        <div className="w-full md:w-80 shrink-0 flex flex-col gap-6 order-1 md:order-2">
          <div className="bg-gray-900 border border-gray-800 p-4 space-y-4 rounded-md">
            <h4 className="font-bold text-red-500 uppercase tracking-widest text-xs">{DIETARY_UI.board.prepChecksTitle}</h4>

            <div className="space-y-4">
              <div className="bg-black border border-gray-800 p-3 text-sm space-y-2 rounded">
                <div className="font-bold text-gray-300">{DIETARY_UI.board.supplierResponses}</div>
                <div className="text-gray-400 leading-snug">{PREPARATION_CHECKS.pear}</div>
              </div>

              {hasUnresolvedChecks && (
                <div className="bg-amber-950/30 border border-amber-900/50 p-3 text-sm flex gap-3 text-amber-200 rounded">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                  <p className="leading-snug">{DIETARY_UI.board.serviceHoldWarning}</p>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-800/50 border border-gray-700 hover:bg-gray-800 transition-colors rounded-md">
                <Checkbox
                  checked={redesign.serviceHoldAcknowledged}
                  onCheckedChange={(c) => onUpdateRedesign(prev => ({...prev, serviceHoldAcknowledged: c === true}))}
                  disabled={boardPosted}
                  className="mt-0.5 bg-black border-gray-500"
                />
                <span className="text-sm leading-tight text-gray-300 font-medium">
                  {DIETARY_UI.board.holdCheckboxLabel}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
