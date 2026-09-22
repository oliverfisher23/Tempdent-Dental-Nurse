import type { TaskId } from './activities';

export const ACCESSIBILITY_COPY = {
  skip: 'Skip to the main activity',
  deviceTitle: 'Choose how you work',
  recommendation: 'A laptop or desktop is recommended if you have one, especially for comparing the order sheet, arranging trays, and checking the allergen chart. A phone or tablet is still an option; use the activity controls rather than trying to drag small objects.',
  taskAdvice: 'Device advice for each task',
  currentAdvice: 'Device tip',
  controlsTitle: 'Controls and accessibility',
  controls: [
    'Use Tab and Shift + Tab to move between controls, and Enter or Space to activate buttons. Use the arrow keys within choice groups.',
    'You do not need sound. Read the written dialogue and evidence, and use the sound control if you prefer a quiet experience.',
    'Transitions follow your device’s reduced-motion preference. The kitchen clock is simulated; it is not a time limit on your answers.',
    'On a smaller screen, open one workspace at a time. Close it to return to the activity or use its back control.',
  ],
  localProgress: 'Your work is saved in this browser on this device. It does not automatically transfer to another device, so choose your device before starting where possible.',
  films: 'Written briefings are available. Final filmed briefings still need caption and transcript checks before learner release.',
};

export const TASK_DEVICE_ADVICE: Record<TaskId, { title: string; interaction: string; advice: string }> = {
  'take-the-handover': {
    title: '1 · Handover and fridge inspection',
    interaction: 'Inspect the evidence, take a reading, and write your own observation.',
    advice: 'A phone or tablet works for one appliance at a time. A larger screen makes fine visual details easier to inspect; use the written evidence as well.',
  },
  'check-the-delivery-in': {
    title: '2 · Check the delivery',
    interaction: 'Measure what arrived, compare both records, and explain any discrepancy.',
    advice: 'A laptop helps you compare the order and inspection side by side. On a phone, switch between the order sheet and the selected item; your entries stay in place.',
  },
  'chill-the-event-batch': {
    title: '3 · Portion and chill',
    interaction: 'Arrange trays, choose where to probe, and interpret the recorded cooling comparison.',
    advice: 'A laptop or large tablet is helpful for tray layouts and the cooling record. On a phone or keyboard, use the labelled selection and placement controls instead of dragging.',
  },
  'check-the-dietary-list': {
    title: '4 · Dietary requirements',
    interaction: 'Compare ingredients with your allergen chart, propose changes, and identify what checks are still needed.',
    advice: 'A laptop is helpful for comparing recipes, the chart, and guest requirements. On a phone, work through one dish or guest at a time.',
  },
  'hand-the-kitchen-on': {
    title: '5 · Waste and handover',
    interaction: 'Weigh the waste and explain what the evening team needs to know and follow up on.',
    advice: 'A phone works for weighing and reviewing evidence. A laptop keyboard can be more comfortable for writing and checking the longer handover.',
  },
};