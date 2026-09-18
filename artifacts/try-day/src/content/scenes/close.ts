export const CLOSE_SCENE = {
  wasteBins: 'Weigh the waste',
  clipboard: 'Write the handover',
  elena: 'Go through the chill record with Terence',

  wasteOptions: [
    { id: 'plate', label: 'Plate waste (4.2kg)', reason: "High plate waste needs front-of-house feedback on why food comes back." },
    { id: 'spoilage', label: 'Spoilage (1.8kg)', reason: "The fridge failure is a critical safety and operational risk that needs fixing immediately." },
    { id: 'trimmings', label: 'Trimmings (6.4kg)', reason: "Review prep techniques to see if yield can be safely increased, though bones and peelings are unavoidable." }
  ],

  clarifications: {
    salmon: {
      question: "Salmon is short. Is that for tonight or tomorrow?",
      options: [
        { id: 'tonight', label: "Tonight's service" },
        { id: 'tomorrow', label: "Tomorrow lunch" }
      ]
    },
    fridge: {
      question: "Larder 2 was open. Did you re-check it, or do we need to?",
      options: [
        { id: 'done', label: "I already checked it, it's fine" },
        { id: 'todo', label: "Re-check it before service" }
      ]
    },
    dietary: {
      question: "Table 3 dietary. What's the substitution?",
      options: [
        { id: 'beef', label: "They get the beef" },
        { id: 'pear', label: "Poached pear, held until checked" }
      ]
    }
  },

  priorities: [
    { id: 'larder2', label: 'Re-check Larder Fridge 2 temperature' },
    { id: 'salmon', label: 'Chase supplier for missing salmon' },
    { id: 'table3', label: 'Prepare alternative dessert and hold for checks' }
  ]
};
