export const CLOSE_SCENE = {
  wasteBins: 'Weigh the waste',
  clipboard: 'Write the handover',
  elena: 'Go through the chill record with Terence',
  locks: {
    clipboard: 'Weigh every tub and write each weight first.',
    chill: 'Confirm the evening team’s read-back first.',
  },

  /**
   * Optional, formative (approved decision P1). No mark, no gate. Each piece of feedback names
   * the evidence in the tub and what is still unknown; it never invents a cost, a saving or a cause.
   */
  wasteQuestion: {
    title: 'Which waste would you look into, and what would you check next?',
    help: 'Optional. Choose one tub and say what you would find out first. There is no mark for this, and the handover does not wait for it.',
    nextLabel: 'What would you check next?',
    nextPlaceholder: 'One or two lines in your own words',
    savedNote: 'Kept as a proposed follow-up on the handover. It is a suggestion, not something that has been done.',
    options: [
      {
        id: 'spoilage',
        label: 'Food that went off before it was used',
        feedback:
          'This tub holds the rice and melon binned from larder fridge 2 after the door was found open, and your board reading has that fridge above the line. Looking into the door and the checking routine is a fair follow-up. It is not proof that one change would have stopped all of this waste, and the re-check before service is a separate job for tonight.',
      },
      {
        id: 'plate',
        label: 'Food that came back from plates',
        feedback:
          'This tub came from breakfast and the bistro lunch, but nothing on the sheet says which dishes came back or why. Finding that out comes before any change to portions or the menu. "We need more information" is a fair answer here.',
      },
      {
        id: 'trimmings',
        label: 'Trimmings from preparing food',
        feedback:
          'The heaviest tub, but peelings, fish frames, and sinew include material nobody could have used. Looking at how things are prepared, and separating what is unavoidable from what might not be, is the useful check. Heaviest does not mean most avoidable.',
      },
    ],
  },

  /** Follow-ups the learner groups before service or later, with an owner (approved decision P3). */
  priorities: [
    { id: 'larder2', label: 'Re-check larder fridge 2', status: 'Requested, not done: Nobody has re-checked it since your morning reading' },
    { id: 'salmon', label: 'Chase the missing salmon with the supplier', status: 'Requested, not confirmed: Terence said he would ring before ten' },
    { id: 'table3', label: 'Pear for table 3, held for Terence’s checks', status: 'On the board; preparation and service checks still pending' },
  ],
};
