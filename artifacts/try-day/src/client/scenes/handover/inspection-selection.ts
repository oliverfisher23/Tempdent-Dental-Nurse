import { FRIDGE_INSPECTIONS } from '@client/content/fridge-photos';
import { getFridgeMedia, type FridgeMediaState } from '@client/content/fridge-media';

export function getInspectionSelection(unitId: string, mediaState: FridgeMediaState) {
  const inspection = FRIDGE_INSPECTIONS[unitId];
  if (!inspection) throw new Error(`No inspection clues for appliance: ${unitId}`);

  return {
    inspection,
    media: getFridgeMedia(unitId, mediaState),
    visibleClues: mediaState === 'open' ? inspection.clues : [],
  };
}