export const CLOSE_INTERACTION = {
  waste: {
    title: 'Weigh and review the waste',
    instructions: 'Choose each bin, wait for the scales to settle, then write the reading on the waste sheet.',
    scaleLabel: 'Scales reading',
    settled: 'The scales have settled.',
    settling: 'The scales are settling.',
    notWeighed: 'Not weighed yet',
    weighed: 'Weighed',
    correct: 'This matches the scales.',
    incorrect: 'This does not match the scales. Check the displayed reading and units.',
    followUpQuestion: 'Which waste stream would you investigate first, and what would you find out before acting?',
    reasonLabel: 'Reason for this follow-up',
  },
  evidence: {
    title: 'Review the shift evidence',
    saved: 'Saved fact',
    supplied: 'Supplied information',
    proposed: 'Proposed follow-up',
    savedHelp: 'This comes from work saved during your shift.',
    suppliedHelp: 'This is scenario information. It is not evidence that a follow-up happened.',
    proposedHelp: 'This is your suggested next action. It remains pending until somebody carries it out.',
  },
  handover: {
    instructions: 'Use the evidence to write a concise handover in your own words. Keep facts, supplied information and proposed actions distinct.',
    fieldError: 'Write a useful note under this heading.',
    prioritiesHelp: 'Choose when each follow-up matters and name the person or role responsible. Choosing an action does not mark it as done.',
    pending: 'Pending action',
    exchangeTitle: 'Evening-team questions',
    exchangeHelp: 'Answer from the saved records. If a check or delivery is still pending, say so.',
    acceptedTitle: 'Handover understood',
    acceptedBody: 'The evening team has repeated back the recorded facts and pending actions. This does not confirm that those actions have been completed.',
    priorityFeedback: {
      larder2: {
        'before-service': 'This protects tonight’s service because the saved reading still needs a re-check.',
        later: 'Review this timing: the saved reading still needs a re-check before service.',
      },
      salmon: {
        'before-service': 'This may be urgent once the service date is clear. Be ready to explain which service needs the salmon.',
        later: 'This can be sensible if the missing salmon is for a later service. Be ready to explain the saved order information.',
      },
      table3: {
        'before-service': 'This keeps the proposed dessert on hold for preparation and service checks before it is served.',
        later: 'Review this timing: the proposed dessert still needs preparation and service checks before it can be served.',
      },
    },
  },
  review: {
    title: 'Review the cooling record with Terence',
    instructions: 'Answer Terence from the recorded comparison. His signature confirms this record review, not service clearance.',
  },
} as const;