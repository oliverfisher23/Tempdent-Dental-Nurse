import type { HandoverField } from '@/content/activities';
import type { CloseEvidence } from '@/lib/close-evidence';

/**
 * The evening team's finite question set for the closing handover (approved decision P4)
 * and the structured answers that show the critical information has been communicated
 * (P5). Free text on the sheet is never graded; these choices are the meaning check.
 * Wrong choices get a repair line and can be changed as often as needed.
 */
export type ExchangeTopicId = 'salmon' | 'larder2' | 'table3' | 'ready';

type Text = string | ((evidence: CloseEvidence) => string);

export interface ExchangeOption {
  id: string;
  correct?: true;
  label: Text;
  /** What the evening team say back to this choice. */
  reply: Text;
}

export interface ExchangePart {
  id: string;
  prompt: string;
  options: ExchangeOption[];
}

export interface ExchangeTopic {
  id: ExchangeTopicId;
  /** The evening team's question, word for word from the approved decision. */
  question: string;
  /** Sheet headings this question checks; editing one re-opens the question. */
  headings: HandoverField['id'][];
  parts: ExchangePart[];
  /** How the evening team repeat this topic back once it is resolved. */
  readBack: (evidence: CloseEvidence) => string;
}

export function exchangeText(text: Text, evidence: CloseEvidence): string {
  return typeof text === 'function' ? text(evidence) : text;
}

const larderWhen = (e: CloseEvidence) => (e.larder2.time ? `at ${e.larder2.time}` : 'on your morning round');
const larderReading = (e: CloseEvidence) => (e.larder2.recorded ? `${e.larder2.reading}°C` : 'above the line');
const lastBeef = (e: CloseEvidence) => (e.beef.last ? `${e.beef.last.value}°C at ${e.beef.last.time}` : 'no final reading');

/**
 * What the team told the learner or left for them, shown read-only in the handover workspace
 * (approved decision P2). Information, not proof anything was done; each line traces to a
 * scene the learner has already been through.
 */
export const TEAM_EVIDENCE: Text[] = [
  "Terence, on the radio at the delivery: tonight doesn't need the salmon, tomorrow's lunch does. He said he'd ring the supplier before ten. No replacement is confirmed on anything you have seen.",
  'Night porter’s log, 04:10: larder fridge 2 found slightly open and shut again, no idea how long it was like that. Terence, this morning: move anything high-risk into larder 1 and keep the door shut while it cools.',
  (e) => `Yvie: table ${e.table3.table}, ${e.table3.name}, ${e.table3.requirement.toLowerCase()} Pear flagged on the table plan; the floor team will check the name against the table.`,
  'Events board: the proposed menu is a held instruction, not permission to serve. All proposals stay on hold for Terence’s supplier, preparation and service checks.',
  (e) => `Recipe cards: frangipane — ${e.frangipaneNote || 'not recorded'} Poached pear — ${e.pearNote || 'not recorded'}`,
  (e) => `Function sheet: 100 covers in the Exe Suite; starter 19:15, main 19:50, dessert ${e.dessertTime || 'not recorded'}.`,
  'Chill job card: once the batch is down it goes into the walk-in for the evening team to bring back up before service.',
];

export const EVENING_EXCHANGE: ExchangeTopic[] = [
  {
    id: 'salmon',
    question: 'How much salmon is missing, and which meal needs it?',
    headings: ['short'],
    parts: [
      {
        id: 'quantity',
        prompt: 'How much is missing',
        options: [
          {
            id: 'four',
            correct: true,
            label: (e) => `${e.salmon.missingKg} kg — ${e.salmon.arrivedKg} kg came in against the ${e.salmon.ordered} kg ordered`,
            reply: 'Four short. That matches the note you signed.',
          },
          {
            id: 'eight',
            label: (e) => `${e.salmon.arrivedKg} kg — the note was for ${e.salmon.ordered}`,
            reply: (e) => `The note you signed says ${e.salmon.arrivedKg} kg came in against ${e.salmon.ordered} ordered. How much didn't turn up?`,
          },
          {
            id: 'none',
            label: "None now — the rest is on its way",
            reply: "Has that happened, or are you asking us to follow it up? Nothing on today's records shows a replacement. Give us the shortage as it stands.",
          },
        ],
      },
      {
        id: 'meal',
        prompt: 'Which meal needs it',
        options: [
          {
            id: 'tomorrow-lunch',
            correct: true,
            label: "Tomorrow's lunch — tonight doesn't use it",
            reply: 'Good. Nothing changes for tonight, then.',
          },
          {
            id: 'tonight',
            label: "Tonight's event",
            reply: "Terence said it on the radio: tonight doesn't need it, tomorrow's lunch does. Which meal is it?",
          },
          {
            id: 'unsure',
            label: "I'm not sure which meal",
            reply: "Terence told you when you reported it short. Tonight, or tomorrow's lunch?",
          },
        ],
      },
      {
        id: 'status',
        prompt: 'Where the follow-up stands',
        options: [
          {
            id: 'terence-ringing',
            correct: true,
            label: "Terence said he'd ring the supplier before ten. I've seen nothing confirming a replacement",
            reply: "So it's with Terence and not confirmed. We'll check with him before we plan tomorrow's lunch.",
          },
          {
            id: 'confirmed',
            label: 'A replacement is confirmed for tomorrow',
            reply: 'Has that happened, or are you asking us to follow it up? Nothing on the records confirms a replacement. Tell us what you actually know.',
          },
          {
            id: 'nobody',
            label: "Nobody's dealing with it yet",
            reply: "Terence took it on the radio this morning and said he'd ring before ten. Tell us who's on it, and that nothing's confirmed yet.",
          },
        ],
      },
    ],
    readBack: (e) =>
      `Salmon: ${e.salmon.missingKg} kg short (${e.salmon.arrivedKg} of ${e.salmon.ordered} kg came in), for tomorrow's lunch, not tonight. Terence said he'd ring the supplier; no replacement is confirmed.`,
  },
  {
    id: 'larder2',
    question: 'What did you find in larder 2, and what still needs checking?',
    headings: ['watch'],
    parts: [
      {
        id: 'finding',
        prompt: 'What you found',
        options: [
          {
            id: 'signed-reading',
            correct: true,
            label: (e) =>
              `It read ${larderReading(e)} ${larderWhen(e)}, above the ${e.larder2.limitLabel} line, after the door was found open overnight. The rice and melon from it were binned`,
            reply: "That's what the board says. Above the line, and food binned.",
          },
          {
            id: 'within-limit',
            label: 'It was within the limit when I checked',
            reply: (e) =>
              e.larder2.recorded
                ? `Your reading on the board is ${e.larder2.reading}°C against a ${e.larder2.limitLabel} line. Tell us what you actually found.`
                : 'The board says otherwise. Tell us what you actually found.',
          },
          {
            id: 'unsure',
            label: "I'm not sure — the night porter found it open",
            reply: (e) => `You took the temperature and signed the board ${larderWhen(e)}. Use your own reading and the note beside it.`,
          },
        ],
      },
      {
        id: 'check',
        prompt: 'What still needs checking',
        options: [
          {
            id: 'recheck-requested',
            correct: true,
            label: (e) => `It needs re-checking before service. Nobody has re-checked it since ${e.larder2.time || 'my round'}`,
            reply: "So that's a request for us, not a check that's been done. We'll re-check it before service.",
          },
          {
            id: 'rechecked',
            label: (e) => `It's been re-checked and it's back under ${e.larder2.limitC}°C`,
            reply: (e) =>
              `Has that happened, or are you asking us to follow it up? There's no re-check on the board after ${e.larder2.time || 'your round'}. Don't hand us a check that hasn't been done.`,
          },
          {
            id: 'nothing',
            label: "Nothing more — the door's shut now",
            reply: "A shut door doesn't tell us the temperature. What still needs checking before anyone uses that fridge?",
          },
        ],
      },
    ],
    readBack: (e) =>
      `Larder 2: ${larderReading(e)} ${larderWhen(e)} after the door was found open; rice and melon binned. A re-check before service is requested, not done.`,
  },
  {
    id: 'table3',
    question: 'Which table is this for, and what is the dessert change?',
    headings: ['watch'],
    parts: [
      {
        id: 'guest',
        prompt: 'Which table',
        options: [
          {
            id: 'table3',
            correct: true,
            label: (e) => `Table ${e.table3.table} — ${e.table3.name}. ${e.table3.requirement}`,
            reply: 'Table 3, nut allergy. Got it.',
          },
          {
            id: 'table6',
            label: 'Table 6 — Tom Reid',
            reply: 'Table 6 is the vegetarian swap to the Wellington. Which table has the nut allergy?',
          },
          {
            id: 'table9',
            label: 'Table 9 — Anna Kowalski',
            reply: 'Table 9 had nothing stated. Which table has the nut allergy?',
          },
        ],
      },
      {
        id: 'dessert',
        prompt: 'The dessert change',
        options: [
          {
            id: 'pear',
            correct: true,
            label: 'Poached pear instead of the frangipane — the tart has nuts all the way through',
            reply: 'Pear, not frangipane. Clear.',
          },
          {
            id: 'topping',
            label: 'The frangipane with the pistachios taken off the top',
            reply: "The nuts are through the whole tart, not just on top. What's on the board for her dessert?",
          },
          {
            id: 'beef',
            label: 'She has the beef',
            reply: "That's a main, not the dessert. What did you write on the board for her dessert?",
          },
        ],
      },
      {
        id: 'status',
        prompt: 'Where that stands',
        options: [
          {
            id: 'on-hold',
            correct: true,
            label: "It's on the events board. Terence's preparation and service checks still have to happen before it's served",
            reply: "So it's not cleared yet. We'll go through those checks with Terence before dessert goes.",
          },
          {
            id: 'cleared',
            label: "The pear's been checked and cleared to serve",
            reply: 'Has that happened, or are you asking us to follow it up? Nothing on the board or the chart records a preparation check. Carry it forward as pending.',
          },
          {
            id: 'floor',
            label: "Yvie's handling it — nothing for the kitchen",
            reply: "Yvie's flagging the table plan; the plate still comes from this kitchen. What does the kitchen still have to check?",
          },
        ],
      },
    ],
    readBack: (e) =>
      `Table ${e.table3.table}: ${e.table3.name}, severe nut allergy. Poached pear instead of the frangipane; Terence's preparation and service checks are still pending.`,
  },
  {
    id: 'ready',
    question: 'What is ready, and where is it for tonight?',
    headings: ['prepared', 'walkIn'],
    parts: [
      {
        id: 'beef',
        prompt: 'The beef',
        options: [
          {
            id: 'signed',
            correct: true,
            label: (e) =>
              `My ${e.beef.trays} trays of beef shin (${e.beef.kg} kg) are on the chill record I signed; last reading ${lastBeef(e)}. It goes to the walk-in once it's down. Terence's half isn't on my record`,
            reply: "Your trays are on the record; we'll find Terence's half with him.",
          },
          {
            id: 'cooling',
            label: "The beef's still cooling in the blast chiller",
            reply: (e) => `Your signed record ends at ${lastBeef(e)}. Tell us what the record shows, not a guess.`,
          },
          {
            id: 'plated',
            label: "It's all portioned and plated, ready to go",
            reply: "Nothing on today's records says anything is plated. What does your chill record show?",
          },
        ],
      },
      {
        id: 'where',
        prompt: 'What else, and where',
        options: [
          {
            id: 'honest',
            correct: true,
            label: (e) =>
              `Frangipane made this morning; poached pear in the pastry fridge, twelve portions, for the bistro. The walk-in read ${e.walkIn.recorded ? `${e.walkIn.reading}°C` : 'as on the board'} on my morning round. I haven't seen a record for the tart or the Wellington`,
            reply: "That's honest. We'll check the tart and the Wellington ourselves.",
          },
          {
            id: 'everything',
            label: 'Everything for tonight is made and in the walk-in',
            reply: "Which record says that? Tell us what you've seen, and what you haven't.",
          },
          {
            id: 'unsure',
            label: "I don't know what's ready",
            reply: "You've got your chill record, the recipe cards and this morning's board. Use what they say and be clear about the gaps.",
          },
        ],
      },
    ],
    readBack: (e) =>
      `Tonight: your ${e.beef.trays} trays of beef are on the signed chill record at ${e.beef.last ? `${e.beef.last.value}°C` : 'no final reading'}; frangipane made this morning; pear in the pastry fridge. No record seen for the tart or the Wellington.`,
  },
];

/** Why larder 2 and table 3 belong before service (approved decision P3). */
export const TIMING_CHALLENGE: Record<'larder2' | 'table3', (evidence: CloseEvidence) => string> = {
  larder2: (e) =>
    `You've put the larder 2 re-check under later follow-up. It read ${larderReading(e)} this morning and nobody's re-checked it. We'd want that before service.`,
  table3: (e) =>
    `You've put table 3's dessert under later follow-up. Dessert goes${e.dessertTime ? ` at ${e.dessertTime}` : ''} and the pear still needs its checks. We'd want that sorted before service.`,
};

export const EXCHANGE_COPY = {
  title: 'The evening team take the sheet',
  help: 'Answer from the records you signed. If a check or a delivery has not happened, say so.',
  youWrote: (heading: string) => `You wrote under "${heading}"`,
  nothingWritten: 'Nothing written here yet',
  resolved: 'Understood',
  timingTitle: 'Before we start',
  moveBefore: 'Put it before service',
  backToSheet: 'Back to the sheet',
  readBackTitle: 'Read back to you',
  readBackIntro: "Here's what we've got.",
  beforeService: 'Before service',
  laterFollowUp: 'Later follow-up',
  nothingHere: 'Nothing',
  readBackQuestion: 'Is that right?',
  confirm: "Yes, that's right",
  revise: 'Change something',
  acceptedTitle: 'Handover delivered',
  acceptedBody: 'The evening team read back the facts and the requests, and you confirmed them. Reading a request back does not mean it has been done.',
} as const;
