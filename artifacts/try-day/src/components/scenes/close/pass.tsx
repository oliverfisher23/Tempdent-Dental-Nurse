import { useState } from 'react';
import { PLACES } from '@/content/kitchen';
import { ELENA_QUESTION, WASTE_BINS } from '@/content/activities';
import { CLOSE_SCENE } from '@/content/scenes/close';
import { useProgress } from '@/lib/progress-store';
import { weightIsRight } from '@/lib/simulation';
import { handoverDelivered } from '@/lib/redesign-close';
import { kitchenAudio } from '@/lib/audio';
import { CloseUp } from '../../kitchen/close-up';
import { Hotspot } from '../../kitchen/hotspot';
import { useKitchenAction } from '../../kitchen/kitchen-context';
import { WasteStation } from './waste-station';
import { HandoverWorkspace } from './handover-workspace';
import { ChillReview } from './chill-review';

export function PassScene({
  onHandover,
  onElenaAnswer,
}: {
  onHandover: () => void;
  onElenaAnswer: (id: string) => void;
  dialogue: unknown;
}) {
  const { progress } = useProgress();
  const state = progress.tasks['hand-the-kitchen-on'];

  const [activeCloseUp, setActiveCloseUp] = useState<'waste' | 'clipboard' | 'chill' | null>(null);
  useKitchenAction('close.open-waste', () => setActiveCloseUp('waste'));
  useKitchenAction('close.open-clipboard', () => setActiveCloseUp('clipboard'));
  useKitchenAction('close.open-elena', () => setActiveCloseUp('chill'));

  const weightsDone = WASTE_BINS.every((b) => state.weighed[b.id] && weightIsRight(b.id, state.weights[b.id] ?? ''));
  const delivered = state.redesign ? handoverDelivered(state) && state.handedOver : state.handedOver;
  const elenaCorrect = !!state.elenaAnswer && !!ELENA_QUESTION.options.find((o) => o.id === state.elenaAnswer)?.correct;

  const openClipboard = () => { kitchenAudio.play('page'); setActiveCloseUp('clipboard'); };
  const openChill = () => { kitchenAudio.play('page'); setActiveCloseUp('chill'); };

  return (
    <div className="absolute inset-0 z-0">
      <img src={PLACES['pass'].backdrop} alt="" className="absolute inset-0 w-full h-full object-cover object-[55%_50%]" decoding="async" />
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <Hotspot
        x={35} y={60}
        label={CLOSE_SCENE.wasteBins}
        state={weightsDone ? 'done' : 'active'}
        onClick={() => setActiveCloseUp('waste')}
      />

      <Hotspot
        x={16} y={42}
        label={CLOSE_SCENE.clipboard}
        state={delivered ? 'done' : (weightsDone ? 'active' : 'todo')}
        onClick={openClipboard}
      />

      {delivered && (
        <Hotspot
          x={30} y={74}
          label={CLOSE_SCENE.elena}
          state={(state.elenaSigned && elenaCorrect) ? 'done' : 'active'}
          onClick={openChill}
        />
      )}

      <CloseUp isOpen={activeCloseUp === 'waste'} onClose={() => setActiveCloseUp(null)} title="Waste tubs and scales" className="bg-zinc-950">
        <WasteStation onGoToHandover={openClipboard} />
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'clipboard'} onClose={() => setActiveCloseUp(null)} title="Handover sheet" className="bg-zinc-950">
        <HandoverWorkspace onHandover={onHandover} onReviewWithTerence={openChill} />
      </CloseUp>

      <CloseUp isOpen={activeCloseUp === 'chill'} onClose={() => setActiveCloseUp(null)} title="Terence, at the pass" className="bg-zinc-950">
        <ChillReview onElenaAnswer={onElenaAnswer} />
      </CloseUp>
    </div>
  );
}
