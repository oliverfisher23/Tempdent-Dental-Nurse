import { useEffect } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GaugeMarks {
  major?: number;
  minor?: number;
}

export interface GaugeProps {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  label: string;
  size?: number;
  decimals?: number;
  className?: string;
  marks?: GaugeMarks;
}

export function Gauge({ value, min, max, unit, label, size = 160, decimals = 1, className, marks }: GaugeProps) {
  const reducedMotion = useReducedMotion();
  const range = Math.max(max - min, Number.EPSILON);
  const major = marks?.major ?? range / 4;
  const minor = marks?.minor ?? major / 5;
  const clamped = value === null ? min : Math.min(max, Math.max(min, value));
  const angle = -120 + ((clamped - min) / range) * 240;
  const rotation = useSpring(angle, { stiffness: 120, damping: 14 });

  useEffect(() => {
    if (reducedMotion) rotation.jump(angle);
    else rotation.set(angle);
  }, [angle, reducedMotion, rotation]);

  const ticks: Array<{ value: number; major: boolean }> = [];
  for (let tick = min; tick <= max + minor / 2; tick += minor) {
    const isMajor = Math.abs((tick - min) / major - Math.round((tick - min) / major)) < 0.01;
    ticks.push({ value: Math.min(tick, max), major: isMajor });
  }

  const centre = 80;
  const point = (radius: number, degrees: number) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return { x: centre + radius * Math.cos(radians), y: centre + radius * Math.sin(radians) };
  };

  return (
    <figure
      className={cn('inline-flex flex-col items-center text-foreground', className)}
      role="img"
      aria-label={`${label}: ${value === null ? '--' : value.toFixed(decimals)} ${unit}`}
      style={{ width: size }}
    >
      <svg width={size} height={size * 0.78} viewBox="0 0 160 125" aria-hidden="true">
        <path d="M 19 105 A 65 65 0 1 1 141 105" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="7" strokeLinecap="round" />
        {ticks.map((tick, index) => {
          const degrees = -120 + ((tick.value - min) / range) * 240;
          const outer = point(64, degrees);
          const inner = point(tick.major ? 52 : 57, degrees);
          return (
            <line
              key={`${tick.value}-${index}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              strokeWidth={tick.major ? 2.5 : 1}
              strokeOpacity={tick.major ? 0.8 : 0.35}
            />
          );
        })}
        <motion.g style={{ rotate: rotation, transformOrigin: '80px 80px' }}>
          <line x1="80" y1="88" x2="80" y2="29" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
        </motion.g>
        <circle cx="80" cy="80" r="7" fill="hsl(var(--primary))" />
      </svg>
      <figcaption className="-mt-3 text-center">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="font-mono text-lg font-bold">{value === null ? '--' : value.toFixed(decimals)} {unit}</span>
      </figcaption>
    </figure>
  );
}