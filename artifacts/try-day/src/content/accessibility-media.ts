export const MEDIA_ACCESSIBILITY_COPY = {
  open: 'Watch the task briefing',
  openMain: 'Watch Terence’s briefing',
  eyebrow: 'Task briefing',
  pendingTitle: 'Written briefing',
  /** Sits inside the empty player while the film is still a placeholder. */
  placeholderLabel: 'Briefing video coming soon',
  placeholderHint: 'Terence’s filmed briefing for this task will play here. Until it arrives, his words are written out below.',
  pendingDescription: 'The filmed briefing is not available yet. The full briefing text is below; no sound or video is needed to continue.',
  releaseNote: 'Final film: captions, transcript and playback controls still need checking before learner release.',
  transcript: 'Briefing text',
  transcriptHint: 'Everything Terence says in the film, for reading instead of watching.',
  duration: (text: string) => `Runs ${text.toLowerCase()}`,
  close: 'Close briefing',
};

export const COMPLETION_ACCESSIBILITY_COPY = {
  reset: 'Start the day again',
  resetTitle: 'Clear this completed shift?',
  resetDescription: 'Starting again removes the saved work for this shift from this browser. Keep your completed shift if you want to review it later.',
  confirmReset: 'Clear my work and start again',
  cancelReset: 'Keep my completed shift',
};
