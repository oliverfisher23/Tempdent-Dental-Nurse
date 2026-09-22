import { useEffect, useState } from 'react';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import { DISHES, TERENCE_CHART_ROWS, type Line } from '@client/content/activities';
import { useProgress } from '@client/lib/progress';
import { evaluateDietary, wrongChartRows } from '@client/lib/simulation';
import { PassScene } from '@client/scenes/dietary/pass';
import { EventsScene } from '@client/scenes/dietary/events';
import { kitchenAudio } from '@kit/lib/audio';
import { getDietaryGuide } from '@client/content/guides/dietary-close';
import { DIETARY_REDESIGN_LINES } from '@client/content/scenes/dietary-redesign';
import {
  MAX_HINT_TIER,
  applyChartToggle,
  applyDietaryDecision,
  chartHint,
  chartReviewed,
  decisionFeedback,
  decisionKey,
  emptyDietaryRedesign,
  getDietaryRedesignStage,
  hintTier,
  isValidDecision,
  recordCourseReview,
  renderBoardNote,
  type DecisionFeedback,
  type DietaryCourse,
  type DietaryDecision,
  type DietaryRedesignState,
} from '@client/lib/redesign-dietary';

const TASK_ID = 'check-the-dietary-list' as const;

/**
 * Task 4: the function sheet at the pass, then chart, guest decisions and board in the
 * events office. Every check is deterministic and none of them clears a dish for service.
 */
export default function DietaryTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks[TASK_ID];
  // A signed-off legacy record has no redesign; it is shown, never rewritten.
  const redesign: DietaryRedesignState = state.redesign ?? emptyDietaryRedesign();
  const finished = progress.completed.includes(TASK_ID);

  const [dialogue, setDialogue] = useState<Line | null>(DIETARY_REDESIGN_LINES.yvieIntro);
  const [feedback, setFeedback] = useState<Record<string, DecisionFeedback | undefined>>({});

  useEffect(() => {
    if (!state.redesign && !finished) {
      updateTask(TASK_ID, (prev) => (prev.redesign ? prev : { ...prev, redesign: emptyDietaryRedesign() }));
    }
  }, [state.redesign, finished, updateTask]);

  const updateRedesign = (updater: (prev: DietaryRedesignState) => DietaryRedesignState) =>
    updateTask(TASK_ID, (prev) => {
      const before = prev.redesign ?? emptyDietaryRedesign();
      const next = updater(before);
      const evidenceChanged =
        next.decisions !== before.decisions || next.openQuestions !== before.openQuestions || next.rowReviewConfirmed !== before.rowReviewConfirmed;
      return {
        ...prev,
        boardPosted: evidenceChanged ? false : prev.boardPosted,
        redesign: { ...next, serviceHoldAcknowledged: evidenceChanged ? false : next.serviceHoldAcknowledged },
      };
    });

  const handleSheetRead = () => {
    setDialogue(DIETARY_REDESIGN_LINES.yvieSheet);
    updateRedesign((prev) => (prev.sheetRead ? prev : { ...prev, sheetRead: true }));
  };

  const handleToggleAllergen = (dishId: string, allergenId: string) => {
    if (dialogue?.text === DIETARY_REDESIGN_LINES.yvieSheet.text || dialogue?.text === DIETARY_REDESIGN_LINES.yvieIntro.text) {
      setDialogue(DIETARY_REDESIGN_LINES.terenceReviewPrompt);
    }
    kitchenAudio.play('write');
    // A changed row is no longer reviewed, and any decision that cited it is reopened.
    updateTask(TASK_ID, (prev) => applyChartToggle(prev, dishId, allergenId));
    setFeedback({});
  };

  const handleCheckChart = () => {
    const unreviewed = DISHES.filter((dish) => !redesign.rowReviewConfirmed?.[dish.id]);
    if (unreviewed.length > 0) {
      setDialogue(DIETARY_REDESIGN_LINES.terenceRowsUnreviewed);
      kitchenAudio.play('wrong');
      return;
    }
    const wrong = wrongChartRows(state.chart);
    if (wrong.length > 0) {
      updateTask(TASK_ID, (prev) => {
        const r = prev.redesign ?? emptyDietaryRedesign();
        const hintLevels = { ...(r.hintLevels ?? {}) };
        const rowReviewConfirmed = { ...r.rowReviewConfirmed };
        for (const dishId of wrong) {
          hintLevels[`chart:${dishId}`] = Math.min(MAX_HINT_TIER, (hintLevels[`chart:${dishId}`] ?? 0) + 1);
          rowReviewConfirmed[dishId] = false;
        }
        return { ...prev, flaggedDishes: wrong, chartChecked: false, redesign: { ...r, hintLevels, rowReviewConfirmed } };
      });
      const includesPrefilledRow = wrong.some((dishId) => (TERENCE_CHART_ROWS as readonly string[]).includes(dishId));
      setDialogue(includesPrefilledRow ? DIETARY_REDESIGN_LINES.terencePrefilledChartIncorrect : DIETARY_REDESIGN_LINES.terenceChartIncorrect);
      kitchenAudio.play('wrong');
      return;
    }
    updateTask(TASK_ID, (prev) => ({ ...prev, flaggedDishes: [], chartChecked: true }));
    setDialogue(DIETARY_REDESIGN_LINES.terenceChartCorrect);
    kitchenAudio.play('confirm');
  };

  const handleRequestChartHint = (dishId: string) => {
    const topic = `chart:${dishId}`;
    const tier = Math.min(MAX_HINT_TIER, hintTier(redesign, topic) + 1);
    updateTask(TASK_ID, (prev) => {
      const r = prev.redesign ?? emptyDietaryRedesign();
      return { ...prev, redesign: { ...r, hintLevels: { ...(r.hintLevels ?? {}), [topic]: tier } } };
    });
    const pointer = chartHint(dishId, state.chart[dishId] ?? [], tier);
    if (pointer) setDialogue({ speaker: 'Terence', text: pointer });
  };

  const handleDecide = (guestId: string, course: DietaryCourse, patch: Partial<DietaryDecision>) => {
    const key = decisionKey(guestId, course);
    // Any edit means the course has to be checked with Terence again.
    updateTask(TASK_ID, (prev) => applyDietaryDecision(prev, guestId, course, patch));
    setFeedback((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleCheckDecision = (guestId: string, course: DietaryCourse) => {
    const key = decisionKey(guestId, course);
    const dec = redesign.decisions[key];
    const assigned = state.guests[guestId] ?? { main: null, dessert: null };
    const valid = isValidDecision(guestId, course, dec, assigned, state.chart);
    const response = decisionFeedback(guestId, course, dec, assigned, state.chart, hintTier(redesign, key) + 1);
    const nextTier = valid ? 0 : response.kind === 'hint' ? (response.tier ?? 1) : hintTier(redesign, key);
    // Only an actual check with Terence marks the course as checked.
    updateTask(TASK_ID, (prev) => recordCourseReview(prev, guestId, course, valid, nextTier));
    setFeedback((prev) => ({ ...prev, [key]: response }));
    setDialogue(response.line);
    kitchenAudio.play(valid ? 'confirm' : 'wrong');
  };

  const handlePostBoard = () => {
    if (!evaluateDietary({ ...state, boardPosted: true }).done) {
      kitchenAudio.play('wrong');
      return;
    }
    updateTask(TASK_ID, (prev) => ({ ...prev, boardPosted: true, boardNote: renderBoardNote(prev) }));
    kitchenAudio.play('complete');
  };

  const stage = getDietaryRedesignStage(state);

  useEffect(() => {
    if (stage !== 'done') return;
    setDialogue(DIETARY_REDESIGN_LINES.yvieDone);
    const timer = window.setTimeout(() => setDialogue(DIETARY_REDESIGN_LINES.terenceDone), 3500);
    return () => window.clearTimeout(timer);
  }, [stage]);

  return (
    <KitchenFrame
      id={TASK_ID}
      guide={getDietaryGuide(state)}
      dialogue={dialogue}
      scenes={{
        pass: (
          <PassScene
            sheetRead={!!redesign.sheetRead || finished}
            guestDetailsOpen={chartReviewed(state) || finished}
            onSheetRead={handleSheetRead}
          />
        ),
        events: (
          <EventsScene
            state={state}
            redesign={redesign}
            onToggleAllergen={handleToggleAllergen}
            onCheckChart={handleCheckChart}
            onRequestChartHint={handleRequestChartHint}
            onDecide={handleDecide}
            onCheckDecision={handleCheckDecision}
            decisionFeedback={feedback}
            onUpdateRedesign={updateRedesign}
            onPostBoard={handlePostBoard}
          />
        ),
      }}
    />
  );
}
