import { useState } from 'react';
import { PLACES } from '@client/content/kitchen';
import { ELENA_QUESTION, WASTE_BINS } from '@client/content/activities';
import { CLOSE_SCENE } from '@client/content/scenes/close';
import { useProgress } from '@client/lib/progress';
import { weightIsRight } from '@client/lib/simulation';
import { handoverDelivered } from '@client/lib/redesign-close';
import { kitchenAudio } from '@kit/lib/audio';
import { CloseUp } from '@shell/frame/close-up';
import { Hotspot } from '@shell/frame/hotspot';
import { useKitchenAction, useWorkspaceOpen } from '@shell/frame/kitchen-context';
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
  useWorkspaceOpen(
    activeCloseUp === 'waste'
      ? 'close.open-waste'
      : activeCloseUp === 'clipboard'
        ? 'close.open-clipboard'
        : activeCloseUp === 'chill'
          ? 'close.open-elena'
          : null,
  );

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
        state={delivered ? 'done' : (weightsDone ? 'active' : 'locked')}
        hint={!weightsDone ? CLOSE_SCENE.locks.clipboard : undefined}
        onClick={weightsDone ? openClipboard : undefined}
      />

      <Hotspot
        x={30} y={74}
        label={CLOSE_SCENE.elena}
        state={!delivered ? 'locked' : (state.elenaSigned && elenaCorrect) ? 'done' : 'active'}
        hint={!delivered ? CLOSE_SCENE.locks.chill : undefined}
        onClick={delivered ? openChill : undefined}
      />

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
