# Task 4 Experience Review

## Summary of Changes
- **Meaningful ingredient-evidence comparison**: Removed the massive 70-checkbox table matrix that was hard to use and overwhelming on mobile. Replaced it with a step-by-step dish review workflow. Each dish now directly pairs its recipe ingredients with the allergen categories side-by-side, providing immediate context for decisions.
- **Usable dish-at-a-time mobile chart/checklist**: The chart is now built as a fluid vertical interface. Users select a dish (or step through using "Next dish") and evaluate the 14 allergens for that specific dish.
- **Guest-specific accessible names and focus/labels/choice state**: Rewrote the guest decision view. Action buttons use `aria-pressed` and semantic `variant` states to properly announce toggled states. Added explicit `aria-label` attributes to selects, textareas, and checkboxes to tie them correctly to the active guest and course. 
- **Chart/source accessibility alongside decisions**: Instead of hiding the chart evidence in a `<details>` dropdown during guest decisions, it is now exposed prominently in a right-hand panel (on large screens) directly beside the decision form.
- **Explicit row progress/review feedback**: Removed any "auto-solving" behavior. Row review checkboxes must be manually confirmed after marking allergens. Terence's check evaluates correctness and flags issues visually, but leaves correction to the learner.
- **Transitions and reduced-motion safe design**: Applied `motion-safe:transition-all` and `motion-safe:transition-opacity` for fluid shifts between dishes and panels without overwhelming users who prefer reduced motion. Added accessible navigation buttons ("Next dish", "Next guest").

## Interactions: Before vs After

| Interaction | Before | After |
| ----------- | ------ | ----- |
| **Allergen Matrix** | 14x5 grid table; required 70 anonymous clicks without direct ingredient context. Desktop-only paradigm. | Dish-by-dish checklist; pairs ingredient list directly beside the 14 categories. Works seamlessly on mobile. |
| **Row Review** | Unclear progression; user had to figure out when to check with Terence. | Explicit "Next dish" progression; clear visual state for flagged vs confirmed dishes. |
| **Guest Evidence** | Hidden in a collapsed `<details>` element at the bottom of a narrow side panel. | Prominent alongside the decision inputs (in split-view on desktop), clearly showing the exact chart marks. |
| **Decision Buttons** | Standard buttons with color changes but missing aria-pressed states. | Proper `role="group"` and `aria-pressed` attributes. Clearer toggle state semantics. |
| **Mobile Layout** | CloseUps had fixed `h-[80vh]` causing overflow clipping. | Full height `h-full` with `rounded-none` on mobile to maximize space; internal scrolling isolated properly. |

## Checks Run
- Source review covered native controls, labels, choice states and focus-preserving forms. Screen-reader speech was not tested.
- A targeted axe-core scan of the fresh chart at 320 × 568 reported no violations or horizontal page overflow. This does not establish contrast or keyboard behaviour in every selected/error state.
- The integrated browser pass checked that the evening-board service hold remains explicit and selectable. Full dish/guest switching was not separately exercised in that pass.
- Touch target sizing: buttons, selects and checkbox labels have 44 px sizing or equivalent padding.
- State preservation: the saved schema is unchanged; the existing model regression suite passes.

## Remaining Limitations
- Cannot guarantee full WCAG certification without external testing tools.
- Shared workspaces intentionally remain non-modal because the external step guide stays available. Their focus handling includes that guide; simply setting `aria-modal="true"` would misrepresent the interface.
- The `Select` primitive used from `shadcn` handles its own accessibility, which is generally good but may have minor quirks on some mobile screen readers.