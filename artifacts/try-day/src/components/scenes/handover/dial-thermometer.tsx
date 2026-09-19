import type { Ref } from 'react';
import { cn } from '@/lib/utils';
import { DIAL_MAX_C, DIAL_MIN_C, describeDial, dialAngle, dialZones, type DialPhase, type DialZone } from './dial-scale';

export type { DialPhase } from './dial-scale';
export { describeDial, dialReading } from './dial-scale';

const CX = 100;
const CY = 128;

const ZONE_FILL: Record<DialZone['tone'], string> = {
  safe: '#2f9e4f',
  cold: '#3b82f6',
  warm: '#d92d20',
};

function point(radius: number, degrees: number): [number, number] {
  const rad = (degrees * Math.PI) / 180;
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function ringSegment(inner: number, outer: number, fromC: number, toC: number): string {
  const a0 = dialAngle(fromC);
  const a1 = dialAngle(toC);
  const large = a1 - a0 > 180 ? 1 : 0;
  const [ox0, oy0] = point(outer, a0);
  const [ox1, oy1] = point(outer, a1);
  const [ix0, iy0] = point(inner, a0);
  const [ix1, iy1] = point(inner, a1);
  return `M${fmt(ox0)},${fmt(oy0)} A${outer},${outer} 0 ${large} 1 ${fmt(ox1)},${fmt(oy1)} L${fmt(ix1)},${fmt(iy1)} A${inner},${inner} 0 ${large} 0 ${fmt(ix0)},${fmt(iy0)} Z`;
}

const TICKS = Array.from({ length: DIAL_MAX_C - DIAL_MIN_C + 1 }, (_, i) => DIAL_MIN_C + i).map((value) => {
  const major = value % 10 === 0;
  const mid = !major && value % 5 === 0;
  const inner = major ? 63 : mid ? 66 : 70;
  const [x1, y1] = point(76, dialAngle(value));
  const [x2, y2] = point(inner, dialAngle(value));
  return { value, major, mid, x1, y1, x2, y2 };
});

const LABELS = [-30, -20, -10, 0, 10, 20, 30].map((value) => {
  const [x, y] = point(53, dialAngle(value));
  return { value, x, y, text: value > 0 ? `+${value}` : String(value) };
});

const STARS = [-27, -24, -21].map((value) => {
  const [x, y] = point(42, dialAngle(value));
  return { value, x, y };
});

export function DialThermometer({
  valueC,
  limitC,
  phase,
  focusRef,
  className,
}: {
  /** Where the needle points right now; the caller drifts it while the door is open and settles it on the true reading. */
  valueC: number;
  /** The unit's own limit, which is where the green band ends. */
  limitC: number;
  phase: DialPhase;
  /** Lets the caller move focus onto the dial itself, so its label is read out when the needle settles. */
  focusRef?: Ref<SVGSVGElement>;
  className?: string;
}) {
  const settled = phase === 'settled';
  const freezer = limitC < 0;
  return (
    <svg
      ref={focusRef}
      tabIndex={-1}
      viewBox="0 0 200 232"
      role="img"
      aria-label={describeDial(phase, valueC)}
      data-testid="dial-thermometer"
      data-phase={phase}
      className={cn('block h-auto w-full select-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-white/60', className)}
    >
      <defs>
        <radialGradient id="dial-case" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e9ebee" />
          <stop offset="100%" stopColor="#c9ced5" />
        </radialGradient>
        <radialGradient id="dial-hub" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f5f5f4" />
          <stop offset="60%" stopColor="#9a9a98" />
          <stop offset="100%" stopColor="#4b4b4a" />
        </radialGradient>
        <radialGradient id="dial-mist" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.96" />
          <stop offset="70%" stopColor="#e2e8f0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.8" />
        </radialGradient>
        <filter id="dial-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <filter id="dial-blur">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Hook and case */}
      <path d="M100,34 V22 a11,11 0 1 1 11,-11" fill="none" stroke="#d6dae0" strokeWidth="7" strokeLinecap="round" />
      <path d="M100,34 V22 a11,11 0 1 1 11,-11" fill="none" stroke="#f4f5f7" strokeWidth="4" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="96" fill="url(#dial-case)" stroke="#b8bec7" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r="84" fill="#f2f3f5" stroke="#d3d7dd" strokeWidth="1" />
      <circle cx={CX} cy={CY} r="79" fill="#ffffff" stroke="#e4e7eb" strokeWidth="1" />

      {/* Colour zones, ending at this unit's limit */}
      {dialZones(limitC).map((zone) => (
        <path key={`${zone.from}-${zone.to}`} d={ringSegment(37, 46, zone.from, zone.to)} fill={ZONE_FILL[zone.tone]} stroke="#ffffff" strokeWidth="0.8" />
      ))}
      {freezer && STARS.map((star) => (
        <text key={star.value} x={star.x} y={star.y} fontSize="6.5" fill="#ffffff" textAnchor="middle" dominantBaseline="central" aria-hidden="true">
          ★
        </text>
      ))}

      {/* Scale */}
      {TICKS.map((tick) => (
        <line
          key={tick.value}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke="#161616"
          strokeWidth={tick.major ? 2.2 : tick.mid ? 1.6 : 1}
          strokeLinecap="butt"
        />
      ))}
      {LABELS.map((label) => (
        <text
          key={label.value}
          x={label.x}
          y={label.y}
          fontSize="11.5"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill="#141414"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label.text}
        </text>
      ))}
      <text x={CX} y={CY + 42} fontSize="12" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif" fill="#141414" textAnchor="middle" dominantBaseline="central">
        °C
      </text>
      <text x={CX} y={CY + 60} fontSize="6" fontWeight="600" letterSpacing="0.6" fontFamily="ui-sans-serif, system-ui, sans-serif" fill="#7a7f87" textAnchor="middle" dominantBaseline="central">
        {freezer ? 'FREEZER' : 'FRIDGE'}
      </text>

      {/* Needle: a real bimetal needle overshoots a little before it settles, hence the springy curve. */}
      <g
        data-testid="dial-needle"
        filter="url(#dial-shadow)"
        className="motion-reduce:transition-none"
        style={{
          transform: `rotate(${dialAngle(valueC)}deg)`,
          transformBox: 'view-box',
          transformOrigin: `${CX}px ${CY}px`,
          transition: 'transform 1500ms cubic-bezier(0.22, 1.35, 0.36, 1)',
        }}
      >
        <path d={`M${CX},${CY - 70} L${CX + 3.4},${CY} L${CX - 3.4},${CY} Z`} fill="#e0242f" />
        <path d={`M${CX - 2.6},${CY} L${CX + 2.6},${CY} L${CX + 1.8},${CY + 17} L${CX - 1.8},${CY + 17} Z`} fill="#3a3a3a" />
      </g>
      <circle cx={CX} cy={CY} r="12" fill="url(#dial-hub)" stroke="#5b5b5b" strokeWidth="0.6" />
      <circle cx={CX} cy={CY} r="4" fill="#3d3d3d" />

      {/* Glass highlight */}
      <path d="M36,92 Q70,44 150,58 Q110,66 60,118 Z" fill="#ffffff" opacity="0.28" pointerEvents="none" />

      {/* Mist on the glass until the reading is taken */}
      <g
        aria-hidden="true"
        className={cn('motion-reduce:transition-none', settled || phase === 'settling' ? 'opacity-0' : 'opacity-100')}
        style={{ transition: 'opacity 1100ms ease-out' }}
      >
        <circle cx={CX} cy={CY} r="80" fill="url(#dial-mist)" />
        <g filter="url(#dial-blur)" opacity="0.7">
          <ellipse cx="72" cy="100" rx="30" ry="18" fill="#ffffff" />
          <ellipse cx="128" cy="150" rx="34" ry="20" fill="#ffffff" />
          <ellipse cx="118" cy="92" rx="18" ry="12" fill="#ffffff" />
        </g>
      </g>
    </svg>
  );
}
