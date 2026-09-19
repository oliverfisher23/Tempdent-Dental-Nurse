/** Geometry and wording for the hanging dial thermometer, kept free of JSX so tests can import it. */

/** The dial runs from -30 to +30 °C over 270 degrees, zero at the top, like the dials in the kitchen fridges. */
export const DIAL_MIN_C = -30;
export const DIAL_MAX_C = 30;
export const DEGREES_PER_C = 4.5;

export type DialPhase = 'misted' | 'settling' | 'settled';

export interface DialZone {
  from: number;
  to: number;
  tone: 'safe' | 'cold' | 'warm';
}

export function dialAngle(valueC: number): number {
  return Math.min(DIAL_MAX_C, Math.max(DIAL_MIN_C, valueC)) * DEGREES_PER_C;
}

/** What a careful reader takes from the dial: the nearest half degree, never the hidden decimal. */
export function dialReading(valueC: number): string {
  const half = Math.round(valueC * 2) / 2;
  return Number.isInteger(half) ? String(half) : half.toFixed(1);
}

/**
 * The green band ends at the unit's own limit, so the dial never shows a reading as safe
 * that the board would reject: a freezer is green from -30 up to its limit, a fridge from 0.
 */
export function dialZones(limitC: number): DialZone[] {
  if (limitC < 0) {
    return [
      { from: DIAL_MIN_C, to: limitC, tone: 'safe' },
      { from: limitC, to: DIAL_MAX_C, tone: 'warm' },
    ];
  }
  return [
    { from: DIAL_MIN_C, to: 0, tone: 'cold' },
    { from: 0, to: limitC, tone: 'safe' },
    { from: limitC, to: DIAL_MAX_C, tone: 'warm' },
  ];
}

export function describeDial(phase: DialPhase, valueC: number): string {
  if (phase === 'misted') return 'Fridge thermometer, misted over. Take the temperature to clear the dial.';
  if (phase === 'settling') return 'Fridge thermometer. The needle is settling.';
  return `Fridge thermometer. The needle has settled at about ${dialReading(valueC)} degrees Celsius.`;
}
