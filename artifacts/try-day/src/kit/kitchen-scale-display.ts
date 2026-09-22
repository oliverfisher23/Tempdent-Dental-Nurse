/** Display logic for the bench scales, kept free of JSX so tests can import it. */

export type ScalePhase = 'idle' | 'settling' | 'stable';

/** The seven segments of an LCD digit, named clockwise from the top with g as the bar in the middle. */
export type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

const SEGMENTS: Record<string, Segment[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [],
};

export function litSegments(char: string): Segment[] {
  return SEGMENTS[char] ?? [];
}

/** How many digits the display has, and how many of them sit after the point. */
export const SCALE_CELLS = 4;
export const SCALE_DECIMALS = 2;
export const SCALE_MAX_KG = 15;

/**
 * The characters in each cell of the display for a weight in kilograms, most significant first.
 * Leading zeros are blank, as on a real scale, and anything over capacity shows the overload dashes.
 */
export function scaleCells(kg: number): string[] {
  if (!Number.isFinite(kg) || kg > SCALE_MAX_KG || kg < 0) return Array.from({ length: SCALE_CELLS }, () => '-');
  const digits = kg.toFixed(SCALE_DECIMALS).replace('.', '');
  return digits.padStart(SCALE_CELLS, ' ').split('').slice(-SCALE_CELLS);
}

/** What the display reads as text, for the live region and the accessible name. */
export function scaleReading(kg: number): string {
  return `${kg.toFixed(SCALE_DECIMALS)} kg`;
}

/**
 * A load cell overshoots and hunts before it agrees with itself, so the display runs through
 * these values on the way to the true weight. The last entry is always the true weight.
 */
export function settlingSequence(kg: number): number[] {
  const swing = Math.max(0.08, kg * 0.09);
  const steps = [0.58, 1.11, 0.93, 1.04, 0.98, 1.01];
  const values = steps.map((factor, index) => {
    const offset = (factor - 1) * kg;
    const wobble = swing * (index % 2 === 0 ? 0.25 : -0.25) * (1 - index / steps.length);
    return Math.max(0, Math.round((kg + offset + wobble) * 100) / 100);
  });
  return [...values, kg];
}

export function describeScale(phase: ScalePhase, kg: number): string {
  if (phase === 'idle') return 'Bench scales reading 0.00 kg, nothing on the platform.';
  if (phase === 'settling') return 'Bench scales with the box on the platform, display still settling.';
  return `Bench scales with the box on the platform, display settled at ${scaleReading(kg)}.`;
}
