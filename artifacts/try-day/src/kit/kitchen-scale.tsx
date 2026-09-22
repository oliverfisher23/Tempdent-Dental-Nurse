import { useEffect, useState } from 'react';
import { cn } from '@kit/lib/utils';
import { describeScale, litSegments, scaleCells, settlingSequence, type ScalePhase, type Segment } from './kitchen-scale-display';

export type { ScalePhase } from './kitchen-scale-display';
export { scaleReading } from './kitchen-scale-display';

const LCD_INK = '#0c1d3a';
const CELL_W = 18;
const CELL_H = 25;
const CELL_GAP = 4;
const STROKE = 3.2;
const DIGITS_X = 72;
const DIGITS_Y = 176;
/** Six steps at this pace land on the true weight at 1.5 s, when the delivery row marks the box weighed. */
const SETTLE_STEP_MS = 250;

/** One LCD digit: every segment is always faintly there, the lit ones are drawn over the top. */
function Digit({ x, y, char }: { x: number; y: number; char: string }) {
  const lit = new Set(litSegments(char));
  const w = CELL_W;
  const h = CELL_H;
  const t = STROKE;
  const half = h / 2 - 2.2;
  const shapes: Record<Segment, { x: number; y: number; w: number; h: number }> = {
    a: { x: x + 1.2, y, w: w - 2.4, h: t },
    g: { x: x + 1.2, y: y + h / 2 - t / 2, w: w - 2.4, h: t },
    d: { x: x + 1.2, y: y + h - t, w: w - 2.4, h: t },
    f: { x, y: y + 1.4, w: t, h: half },
    b: { x: x + w - t, y: y + 1.4, w: t, h: half },
    e: { x, y: y + h / 2 + 0.8, w: t, h: half },
    c: { x: x + w - t, y: y + h / 2 + 0.8, w: t, h: half },
  };
  return (
    <g>
      {(Object.keys(shapes) as Segment[]).map((segment) => {
        const s = shapes[segment];
        return <rect key={segment} x={s.x} y={s.y} width={s.w} height={s.h} rx={0.8} fill={LCD_INK} opacity={lit.has(segment) ? 1 : 0.09} />;
      })}
    </g>
  );
}

export function KitchenScale({
  kg,
  phase,
  className,
}: {
  /** The true weight of what is on the platform, which the display only agrees with once it has settled. */
  kg: number;
  phase: ScalePhase;
  className?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (phase !== 'settling') return;
    const sequence = settlingSequence(kg);
    let index = 0;
    setShown(sequence[0]);
    const timer = setInterval(() => {
      index += 1;
      if (index >= sequence.length) {
        clearInterval(timer);
        return;
      }
      setShown(sequence[index]);
    }, SETTLE_STEP_MS);
    return () => clearInterval(timer);
  }, [phase, kg]);

  const value = phase === 'idle' ? 0 : phase === 'stable' ? kg : shown;
  const loaded = phase !== 'idle';
  const stable = phase !== 'settling';
  const cells = scaleCells(value);
  // LCD digits lean a little; the translate keeps the skewed group where it was drawn.
  const digitTransform = `translate(${(Math.tan((6 * Math.PI) / 180) * (DIGITS_Y + CELL_H)).toFixed(2)},0) skewX(-6)`;

  return (
    <svg
      viewBox="0 0 320 236"
      role="img"
      aria-label={describeScale(phase, kg)}
      data-testid="kitchen-scale"
      data-phase={phase}
      className={cn('block h-auto w-full select-none', className)}
    >
      <defs>
        <linearGradient id="scale-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7f8fa" />
          <stop offset="55%" stopColor="#d3d7dd" />
          <stop offset="100%" stopColor="#a9b0b9" />
        </linearGradient>
        <linearGradient id="scale-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eceff2" />
          <stop offset="50%" stopColor="#c6ccd3" />
          <stop offset="100%" stopColor="#8f97a1" />
        </linearGradient>
        <linearGradient id="scale-lcd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fcbff" />
          <stop offset="100%" stopColor="#3f8fe8" />
        </linearGradient>
        <linearGradient id="scale-box-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#dcd8cf" />
          <stop offset="25%" stopColor="#f4f2ec" />
          <stop offset="100%" stopColor="#e6e2d9" />
        </linearGradient>
        <filter id="scale-glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Bench shadow and feet */}
      <ellipse cx="160" cy="228" rx="142" ry="6" fill="#000" opacity="0.35" />
      <ellipse cx="62" cy="223" rx="11" ry="3.5" fill="#1f2226" />
      <ellipse cx="258" cy="223" rx="11" ry="3.5" fill="#1f2226" />

      {/* Pedestal under the platform */}
      <rect x="118" y="128" width="84" height="22" fill="#2a2d31" />

      {/* Platform, which sits a touch lower with a box on it */}
      <g className="transition-transform duration-300 motion-reduce:transition-none" style={{ transform: loaded ? 'translateY(2px)' : 'translateY(0)' }}>
        <path d="M28,120 L292,120 L292,128 Q292,131 289,131 L31,131 Q28,131 28,128 Z" fill="#7f868f" />
        <path d="M84,62 L236,62 Q246,62 250,70 L292,112 Q297,120 288,120 L32,120 Q23,120 28,112 L70,70 Q74,62 84,62 Z" fill="url(#scale-steel)" stroke="#9ea5ae" strokeWidth="1" />
        <path d="M98,72 L226,72 L260,110 L60,110 Z" fill="none" stroke="#b7bdc5" strokeWidth="0.8" opacity="0.7" />
        <path d="M74,92 L246,92" stroke="#ffffff" strokeWidth="0.6" opacity="0.5" />
        <path d="M66,102 L254,102" stroke="#ffffff" strokeWidth="0.6" opacity="0.35" />

        {/* The delivery box, lowered onto the platform */}
        {loaded && (
          <g className="scale-drop">
            <ellipse cx="160" cy="103" rx="68" ry="5" fill="#000" opacity="0.2" />
            <path d="M104,52 L216,52 L224,101 L96,101 Z" fill="url(#scale-box-side)" stroke="#cfc9bd" strokeWidth="0.8" />
            <path d="M96,101 L224,101 L222,104 L98,104 Z" fill="#cfc9bd" />
            <rect x="97" y="42" width="126" height="14" rx="3" fill="#f8f6f1" stroke="#d6d1c6" strokeWidth="0.8" />
            <path d="M99,56 L221,56" stroke="#b9b3a7" strokeWidth="0.8" />
            <rect x="114" y="66" width="36" height="16" rx="1" fill="#e6ecf3" stroke="#c2ccd7" strokeWidth="0.6" />
            <path d="M118,71 L142,71 M118,75 L136,75 M118,79 L140,79" stroke="#8a96a4" strokeWidth="1" />
          </g>
        )}
      </g>

      {/* Body */}
      <path d="M44,146 L276,146 Q284,146 285,154 L296,214 Q297,222 289,222 L31,222 Q23,222 24,214 L35,154 Q36,146 44,146 Z" fill="url(#scale-body)" stroke="#8b929b" strokeWidth="1" />
      <path d="M46,147 L274,147" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
      <rect x="52" y="156" width="216" height="58" rx="8" fill="#33373c" stroke="#4a4f55" strokeWidth="1" />

      {/* Display */}
      <rect x="62" y="163" width="126" height="46" rx="4" fill="#15181c" />
      <rect x="66" y="167" width="118" height="38" rx="2" fill="url(#scale-lcd)" />
      <rect x="66" y="167" width="118" height="38" rx="2" fill="#bfe1ff" opacity="0.35" filter="url(#scale-glow)" />
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700" fill={LCD_INK}>
        <text x="70" y="173.5" fontSize="4.8" letterSpacing="0.4" opacity={stable ? 1 : 0.15}>STABLE</text>
        <text x="96" y="173.5" fontSize="4.8" letterSpacing="0.2" opacity={value === 0 && phase === 'idle' ? 1 : 0.15}>→0←</text>
        <text x="118" y="173.5" fontSize="4.8" letterSpacing="0.4" opacity="0.15">NET</text>
        <text x="162" y="199" fontSize="10">kg</text>
      </g>
      <g transform={digitTransform}>
        {cells.map((char, index) => (
          <Digit key={index} x={DIGITS_X + index * (CELL_W + CELL_GAP)} y={DIGITS_Y} char={char} />
        ))}
        <circle cx={DIGITS_X + 2 * (CELL_W + CELL_GAP) - CELL_GAP / 2 - 0.4} cy={DIGITS_Y + CELL_H - 1.4} r="1.5" fill={LCD_INK} />
      </g>

      {/* Keys */}
      <g fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="4" fontWeight="700" fill="#b8bec6" textAnchor="middle">
        <circle cx="207" cy="176" r="7" fill="#2f6fd6" stroke="#1d4fa3" strokeWidth="0.8" />
        <circle cx="231" cy="176" r="7" fill="#2f6fd6" stroke="#1d4fa3" strokeWidth="0.8" />
        <circle cx="207" cy="197" r="7" fill="#b9bfc7" stroke="#8b929b" strokeWidth="0.8" />
        <circle cx="231" cy="197" r="7" fill="#b9bfc7" stroke="#8b929b" strokeWidth="0.8" />
        <circle cx="255" cy="186" r="8.5" fill="#c9ced5" stroke="#8b929b" strokeWidth="0.8" />
        <circle cx="255" cy="186" r="3.6" fill="none" stroke="#c0392b" strokeWidth="1.2" />
        <path d="M255,181.2 V185" stroke="#c0392b" strokeWidth="1.2" strokeLinecap="round" />
        <text x="207" y="187.5">TARE</text>
        <text x="231" y="187.5">ZERO</text>
        <text x="207" y="208.5">UNIT</text>
        <text x="231" y="208.5">HOLD</text>
        <text x="255" y="199.5">ON/OFF</text>
      </g>
      <text x="160" y="219.5" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="4.6" fontWeight="600" letterSpacing="0.5" fill="#5b6068" textAnchor="middle">
        MAX 15 kg   d = 10 g
      </text>
    </svg>
  );
}
