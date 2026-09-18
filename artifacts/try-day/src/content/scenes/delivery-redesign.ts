export const DELIVERY_REDESIGN_COPY = {
  sheetTitle: "Order sheet",
  columns: {
    kitchen: "A · Kitchen order",
    supplier: "B · Supplier says",
    checked: "C · You checked",
    decision: "D · Your decision"
  },
  fishNoteTitle: "Exmouth Fish delivery note",
  fishNoteAttribution: "Read-only order source",
  supplierNoteAttribution: "Exmouth Fish delivery note · open source",
  inspectionTitle: (item: string) => `Inspect ${item}`,
  inspectionNotChecked: "Not checked",
  statusNone: "No status selected",
  acceptanceNone: "Acceptance not decided",
  statusOptions: {
    arrived: "All here",
    short: "Short",
    refused: "Refused"
  },
  acceptanceOptions: {
    accept: "Accept",
    refuse: "Refuse"
  },
  evidenceQuestions: {
    smokedHaddock: "Does this match both pieces of paper? Will you accept what you checked?",
    butter: "Does this reading meet the receiving guidance?",
    salmon: "Does this match both pieces of paper?",
    shallots: "Does the order ask for sacks or kilos?"
  },
  seaBassReason: "Which findings support your decision?",
  seaBassPrompt: "Write a brief reason using the four findings.",
  seaBassChecks: {
    eyes: "Clear/bright/slightly domed eyes",
    gills: "Deep red/wet gills",
    smell: "Clean sea-like smell",
    flesh: "Firm flesh that springs back"
  },
  complicationReveal: {
    title: "Service context",
    text: "We're missing four kilos of salmon. We need twelve for tomorrow's lunch, but not tonight's launch."
  },
  report: {
    title: "Discrepancy report",
    factsTitle: "Facts",
    factsPlaceholder: "E.g. Salmon is 4 kg short.",
    missingQuantityLabel: "Missing amount (kg)",
    messageTitle: "Your message",
    messagePlaceholder: "What is missing, what can you accept, and what needs following up?",
    serviceTitle: "Service affected",
    servicePlaceholder: "Which meal needs this, and what do you need Terence to do?",
    sendAction: "Send to Terence"
  },
  amendment: {
    title: "Correct the supplier's note",
    instruction: "Choose the affected line and accepted amount, preserve the original claim and deliberately initial the correction.",
    strikeOriginal: "Strike 12 kg",
    useAmount: "Use my checked amount (8 kg)"
  },
  hints: {
    haddockCount: "Weigh what came in.",
    haddockTemp: "Take the temperature.",
    haddockCompare: "Which amount is on the paper, and which did you weigh?",
    haddockExplain: "The matching quantity and suitable condition support All here / accept 3 kg.",
    salmonMatch: "Compare it with your scales.",
    salmonStatus: "Compare the quantity with the order, then check whether the goods themselves are suitable.",
    butterGuide: "Compare that reading with the receiving guidance for this delivery.",
    shallotsUnit: "The bag size is in kilos. What does the order ask you to count?",
    fishReason: "Which of the fish findings supports accepting it?"
  },
  receivingGuidance: {
    title: "Receiving Guidance",
    text: "Chilled goods must be received at 5°C or below. Above 5°C, refuse delivery."
  }
};
