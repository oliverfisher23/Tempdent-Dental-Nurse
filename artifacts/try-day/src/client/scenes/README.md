# Stage engine

Every task renders its scenes (one per room) through `StageScene`. The content
in `content/tasks/*.ts` stays the single description of what is asked and how
it is judged; the engine only changes *where the learner does it*.

```
task-page.tsx
  └─ KitchenFrame (shell)             guide = step guide built from the task's current decision
       └─ StageScene (per place)      backdrop photo, people present, progress rail, speech panel
            ├─ speech    (choice)     option buttons inside the speech panel
            ├─ hotspots  (seq/list)   <Hotspot> pins on the photo, tapped in order / ticked
            └─ close-up  (the rest)   a CloseUp workspace opened from the panel or the step guide:
                 interactions/paper | order | tray | labels | bench | kit
```

## Contract

- `Decision.present?: Presentation` (`content/tasks/presentation.ts`) chooses the
  presentation. Defaults per kind: choice -> `speech`, checklist -> `paper`,
  sequence -> `order`.
- `TaskScene.people?: string[]` lists person ids in the room; `StageScene`
  shows their names as the first row of the expanded progress rail.
- The **current decision** of a scene is the first visible (gate satisfied)
  unanswered decision in content order; when everything is answered, the first
  wrong one; when everything is right, none. The learner can tap any answered
  row in the progress rail to reopen it (`focusId` override). `scenes/current.ts`
  owns this and `task-page.tsx` uses the same helper across scenes for the guide.
- Answers are written with `onAnswer(decisionId, answer)` exactly as before
  (`string` for a choice, `string[]` for a set or order). Never judge answers in
  UI: `isCorrect`/`isAnswered` from `@client/content/tasks` are the only judges.
- Feedback (`decision.feedback`) appears in the speech panel once a decision is
  answered, with "Carry on" (advance) and, unless `frozen`, "Change answer".
- Close-up interactions implement `InteractionProps<K>` from
  `scenes/interactions/types.ts` and register in `scenes/interactions/index.ts`.
  The engine opens them from the panel button (`presentation.open`), from the
  step guide via `useKitchenAction(decision.id, open)` and reports
  `useWorkspaceOpen(open ? decision.id : null)`.
- Sounds: `kitchenAudio.play('tap')` on a pick, `'write'` on a tick or
  confirmation, `'page'` when a close-up opens or closes. `<Hotspot>` plays its
  own tap.
- Test ids stay stable for the browser specs: `decision-<id>` (with
  `data-state` open|right|wrong), `option-<decisionId>-<optionId>`,
  `confirm-<id>`, `change-<id>`, `restart-<id>`, `feedback-<id>`,
  `open-<id>` (close-up opener), `rail-<id>`.
- Everything must work by keyboard and at 390px wide inside a 480px-high frame.
  No fullscreen-only controls; close-ups scroll internally.
