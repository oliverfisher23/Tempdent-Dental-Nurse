import manifest from './fridge-media.json';

export interface FridgeMedia {
  src: string;
  webmSrc: string;
  poster: string;
}

export type FridgeMediaState = 'closed' | 'open';

// Vite emits base-path-aware, fingerprinted URLs. Importing a URL does not
// download its video: only the current InspectionMedia assigns a media src.
const assets = import.meta.glob<string>(
  '../assets/kitchen/inspections/videos/*.{mp4,webm,webp}',
  { eager: true, query: '?url', import: 'default' },
);

function assetUrl(filename: string): string {
  const url = assets[`../assets/kitchen/inspections/videos/${filename}`];
  if (!url) throw new Error(`Missing fridge inspection asset: ${filename}`);
  return url;
}

export function getFridgeMedia(unitId: string, state: FridgeMediaState): FridgeMedia {
  const unit = manifest[unitId as keyof typeof manifest];
  if (!unit) throw new Error(`No inspection media for appliance: ${unitId}`);
  return {
    src: assetUrl(unit[state].video),
    webmSrc: assetUrl(unit[state].webm),
    poster: assetUrl(unit[state].poster),
  };
}