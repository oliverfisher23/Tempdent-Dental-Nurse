/**
 * World sounds for the V2 scenes (the tap running, the wipe, the chair, the autoclave).
 * Interface cues (tap, confirm, wrong, page) stay with the kit's kitchenAudio; these are
 * short generated placeholder files pending Tempdent's own recordings. Every sound has a
 * caption: `subscribeCaptions` feeds the stage's caption line (scenes/sound-captions.tsx)
 * so a learner with sound off, or a screen reader, still gets the cue.
 */
export type SfxName =
  | 'water-run' | 'wipe' | 'flush' | 'chair' | 'autoclave' | 'door'
  | 'handpiece' | 'curing-light' | 'pouch' | 'box-lid' | 'cue' | 'right' | 'wrong';

const sound = (path: string) => new URL(path, import.meta.url).href;

/** File per sound. Listed one by one so the media manifest can see every file is used. */
const URLS: Record<SfxName, string> = {
  'water-run': sound('../assets/sounds/water-run.mp3'),
  wipe: sound('../assets/sounds/wipe.mp3'),
  flush: sound('../assets/sounds/flush.mp3'),
  chair: sound('../assets/sounds/chair.mp3'),
  autoclave: sound('../assets/sounds/autoclave.mp3'),
  door: sound('../assets/sounds/door.mp3'),
  handpiece: sound('../assets/sounds/handpiece.mp3'),
  'curing-light': sound('../assets/sounds/curing-light.mp3'),
  pouch: sound('../assets/sounds/pouch.mp3'),
  'box-lid': sound('../assets/sounds/box-lid.mp3'),
  cue: sound('../assets/sounds/cue.mp3'),
  right: sound('../assets/sounds/right.mp3'),
  wrong: sound('../assets/sounds/wrong.mp3'),
};

/** What the caption line says while the sound plays. */
export const CAPTIONS: Record<SfxName, string> = {
  'water-run': 'Water running',
  wipe: 'Wiping',
  flush: 'Water line flushing',
  chair: 'Chair moving',
  autoclave: 'Autoclave door shuts and the cycle starts',
  door: 'Door',
  handpiece: 'Handpiece running',
  'curing-light': 'Curing light',
  pouch: 'Pouch turned over',
  'box-lid': 'Box opened',
  cue: 'Dr Reid looks up',
  right: 'That worked',
  wrong: 'Not that',
};

/** Sounds that keep going until stopSfx is called. */
const LOOPS: ReadonlySet<SfxName> = new Set(['water-run', 'handpiece']);

const players = new Map<SfxName, HTMLAudioElement>();
const listeners = new Set<(caption: string | null, name: SfxName) => void>();
let captionTimer: ReturnType<typeof setTimeout> | undefined;

function muted(): boolean {
  try {
    return localStorage.getItem('springpod:tempdent-try-day:sound-muted') === '1';
  } catch {
    return false;
  }
}

function caption(name: SfxName, on: boolean): void {
  if (captionTimer) clearTimeout(captionTimer);
  const text = on ? CAPTIONS[name] : null;
  listeners.forEach((listener) => listener(text, name));
  if (on && !LOOPS.has(name)) {
    captionTimer = setTimeout(() => listeners.forEach((listener) => listener(null, name)), 2500);
  }
}

/** The stage's caption line subscribes here; the caption shows whether or not sound is on. */
export function subscribeCaptions(listener: (caption: string | null, name: SfxName) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function playSfx(name: SfxName): void {
  caption(name, true);
  if (muted() || typeof Audio === 'undefined') return;
  const audio = players.get(name) ?? new Audio(URLS[name]);
  players.set(name, audio);
  audio.loop = LOOPS.has(name);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Autoplay policy before the first gesture, or a file still to be delivered: the caption stands in.
  });
}

export function stopSfx(name: SfxName): void {
  if (LOOPS.has(name)) caption(name, false);
  const audio = players.get(name);
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
