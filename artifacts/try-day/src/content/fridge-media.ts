import manifest from './fridge-media.json';

export interface FridgeMedia {
  src: string;
  webmSrc: string;
  poster: string;
}

export type FridgeMediaState = 'closed' | 'open';

// Vite emits base-path-aware, fingerprinted URLs. Importing a URL does not
// download its video: only the current InspectionMedia assigns a media src.
//
// Vite rewrites the `import.meta.glob(...)` call at build time but never defines
// `import.meta.glob` at runtime, so a `typeof` guard is always false in the
// browser and silently breaks every URL. Call it unconditionally and let the
// call throw outside Vite (Node test runners), where the fallback path is used.
function loadAssets(): Record<string, string> {
  try {
    return import.meta.glob<string>(
      '../assets/kitchen/inspections/videos/*.{mp4,webm,webp}',
      { eager: true, query: '?url', import: 'default' },
    );
  } catch {
    return {};
  }
}

const assets = loadAssets();
const bundled = Object.keys(assets).length > 0;

function assetUrl(filename: string): string {
  const key = `../assets/kitchen/inspections/videos/${filename}`;
  const url = assets[key];
  if (url) return url;
  if (bundled) throw new Error(`Missing fridge inspection asset: ${filename}`);
  return key;
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