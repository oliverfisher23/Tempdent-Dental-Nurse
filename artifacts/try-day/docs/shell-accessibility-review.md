# Shell Accessibility Review

## Interactions Before/After
- **Main Landmark & Focus**: Added `id="main-activity"` and `tabIndex={-1}` to the main stage in `kitchen-frame.tsx`. This ensures the skip link added by the main agent functions correctly. Removed `select-none` from the outer wrapper.
- **Pending Action Cancel**: The "Opening..." pending action toast in `kitchen-frame.tsx` has been enhanced with a cancel button that clears the pending state and removes the full-screen block. It also auto-clears after 5 seconds if not handled (e.g. if the action is no longer registered in the new room).
- **Reduced Motion**: Replaced hardcoded framer-motion config with `useReducedMotion` where applicable in `kitchen-frame.tsx` (the map establishing zoom was already observing this).
- **Hold to Read**: Added double Space/Enter activation to `hold-to-read.tsx` to support starting and stopping the reading without holding the key, serving keyboard users who cannot easily hold a key down. (Touch/Mouse pointer events still function as hold/release naturally).
- **Notepad Dialog Modality**: Updated `<NotepadDrawer>` to `aria-modal="false"` as the StepGuide remains active and accessible beneath it.
- **Job Card Advice**: `DeviceAdvice` component added within the JobCard.

## Fixes Implemented
1. Removed `select-none` at the root of `kitchen-frame` to allow text selection everywhere.
2. Made `<main id="main-activity">` focusable (`tabIndex={-1}`) to support `#main-activity` skip-link.
3. Added a visible cancel button (`<button aria-label="Cancel opening">`) to the pending action toast, restoring learner control.
4. Set up an auto-timeout for pending action in `kitchen-context.tsx` to prevent hard locks.
5. Injected `DeviceAdvice` component inside `<JobCard>` for screen/input guidance.
6. Patched `hold-to-read.tsx` to handle standard Space/Enter tap-to-toggle behaviour.

## Checks Run
- Visual inspection of the code confirms `id="main-activity"`, `DeviceAdvice`, and `aria-modal` correctness.
- `useFocusTrap` is already designed to consider `[data-step-navigation]` (the guide wrapper), making our `<StepGuideBar>` accessible while `aria-modal="false"` is set.

## Remaining Limitations
- Native `inert` might not be perfect for `finished` states if focus traps continue attempting to evaluate children, though current implementation skips them via CSS display/visibility or explicit attributes.
- Canvas `SignaturePad` fallback relies on visually displaying an input over/under the canvas; it operates well but could require specific CSS tweaking depending on viewport.
- This review does not claim WCAG certification.
