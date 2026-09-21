/**
 * The one check pattern every task shares: the same button label asks the kitchen to look
 * at the learner's work, and the answer comes back in the same green, amber or red block.
 */
export const CHECK_COPY = {
  /** The label on every "look at what I have done" button, in Tasks 2 and 4. */
  check: 'Check my work',
};

export type CheckKind = 'ok' | 'note' | 'issue';
