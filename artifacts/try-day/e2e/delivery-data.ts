// Independent expected outcomes, deliberately not generated from the rules
// under test. Update these only when the scenario itself is approved to change.
export const deliveries = [
  { id: 'salmon', item: 'Salmon fillet, skin on', amount: '8', unit: 'kg', temperature: '2.1' },
  { id: 'sea-bass', item: 'Sea bass, whole, gutted', amount: '10', unit: 'fish', temperature: '1.8' },
  { id: 'smoked-haddock', item: 'Smoked haddock, undyed', amount: '3', unit: 'kg', temperature: '2.4' },
  { id: 'chicken', item: 'Chicken supreme, skin on', amount: '96', unit: 'pieces', temperature: '3.2' },
  { id: 'cream', item: 'Double cream, 2 litre', amount: '6', unit: 'bottles', temperature: '4' },
  { id: 'butter', item: 'Unsalted butter, 250 g', amount: '20', unit: 'blocks', temperature: '4.4' },
  { id: 'spinach', item: 'Baby spinach, 1 kg bag', amount: '8', unit: 'bags' },
  { id: 'shallots', item: 'Banana shallots, 5 kg', amount: '2', unit: 'sacks' },
  { id: 'lemons', item: 'Lemons', amount: '60', unit: 'each' },
  { id: 'parsley', item: 'Flat-leaf parsley', amount: '10', unit: 'bunches' },
];

export const fishFindings = [
  { id: 'eyes', label: 'Eyes', finding: 'Clear and bright' },
  { id: 'gills', label: 'Gills', finding: 'Deep red and wet' },
  { id: 'smell', label: 'Smell', finding: 'Clean, of the sea' },
  { id: 'flesh', label: 'Flesh', finding: 'Firm; springs back' },
];

export const expectedReport = {
  productId: 'salmon',
  service: 'tomorrow-lunch',
  action: 'contact-supplier',
  checkedAmount: '8',
  acceptance: 'accept',
  acceptedAmount: '8',
  missingAmount: '4',
};

export const expectedMessage = "Salmon fillet, skin on: The order says 12 kg and the supplier says 12 kg. I checked 8 kg, accepted 8 kg, and recorded 4 kg missing. Tomorrow's lunch is affected. Contact the supplier.";