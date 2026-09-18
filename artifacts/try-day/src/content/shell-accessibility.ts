import type { ReactNode } from 'react';

/**
 * Shell Accessibility Notes
 * - Navigation: Use data-step-navigation container around StepGuideBar for proper trap containment.
 * - Modals: CloseUp implements properly restored focus via useFocusTrap which honors 'Escape' and traps within standard forms/buttons/links.
 * - Signatures: SignaturePad has an explicit fallback typed form input which requires no dragging.
 * - Drag/Hold interactions: Drag implementation has complete space/enter/arrow-key fallback mode; HoldToRead supports space/enter press-and-hold out-of-the-box (we'll also add a click-to-start, click-to-stop alternative for pure click-without-hold needs if necessary, though keydown/keyup often suffices for screenreader/keyboard combinations).
 */
