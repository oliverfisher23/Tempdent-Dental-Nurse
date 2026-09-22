import React from 'react';
import { cn } from '@kit/lib/utils';

interface AnalogueThermometerProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number | null;
  className?: string;
  clip?: boolean;
}

export function AnalogueThermometer({ value, className, clip = true, ...props }: AnalogueThermometerProps) {
  // Neutral resting position below the scale
  const targetValue = value !== null ? value : -35;
  const angle = targetValue * 4.5;
  
  const majorTicks = [-30, -20, -10, 0, 10, 20, 30];
  const minorTicks: number[] = [];
  for(let i = -30; i <= 30; i+=2) {
    if (i % 10 !== 0) minorTicks.push(i);
  }

  return (
    <div
      className={cn("relative flex flex-col items-center justify-center", className)}
      role="img"
      aria-label={value === null ? "Analogue temperature probe, waiting for a reading" : `Analogue temperature probe reading ${value.toFixed(1)} degrees Celsius`}
      {...props}
    >
      <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id="metalStand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="50%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#52525b" />
          </linearGradient>
          <linearGradient id="metalCasing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#e4e4e7" />
            <stop offset="80%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>
          <linearGradient id="metalInner" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a1a1aa" />
            <stop offset="50%" stopColor="#e4e4e7" />
            <stop offset="100%" stopColor="#71717a" />
          </linearGradient>
          
          <filter id="casingShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Stand */}
        <path d="M 50,180 C 50,165 70,165 90,165 L 110,165 C 130,165 150,165 150,180 L 180,210 C 185,215 180,220 170,220 L 30,220 C 20,220 15,215 20,210 Z" fill="url(#metalStand)" stroke="#71717a" strokeWidth="1" />
        
        {/* Clip (Top) */}
        {clip && (
          <path d="M 90,30 L 90,15 C 90,5 110,5 110,15 L 110,35 M 110,5 C 125,5 125,20 125,20" fill="none" stroke="url(#metalStand)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Casing */}
        <circle cx="100" cy="115" r="85" fill="url(#metalCasing)" filter="url(#casingShadow)" />
        <circle cx="100" cy="115" r="77" fill="url(#metalInner)" />
        <circle cx="100" cy="115" r="72" fill="#27272a" />
        <circle cx="100" cy="115" r="70" fill="#fdfbf7" />

        {/* Colored Bands (r=42) */}
        {/* Blue: -30 to -18 */}
        <Arc startAngle={-135} endAngle={-81} radius={42} color="#3b82f6" thickness={10} />
        {/* Green: 0 to +5 */}
        <Arc startAngle={0} endAngle={22.5} radius={42} color="#10b981" thickness={10} />
        {/* Red: +5 to +30 */}
        <Arc startAngle={22.5} endAngle={135} radius={42} color="#ef4444" thickness={10} />

        {/* Ticks and Numbers */}
        {majorTicks.map(v => {
          const a = v * 4.5;
          const radA = (a - 90) * (Math.PI / 180);
          const xText = 100 + 55 * Math.cos(radA);
          const yText = 115 + 55 * Math.sin(radA);
          
          return (
            <g key={v}>
              <line 
                x1={100 + 64 * Math.cos(radA)} 
                y1={115 + 64 * Math.sin(radA)} 
                x2={100 + 70 * Math.cos(radA)} 
                y2={115 + 70 * Math.sin(radA)} 
                stroke="#18181b" 
                strokeWidth="2.5" 
              />
              <text x={xText} y={yText} fontSize="11" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" fill="#18181b">
                {v > 0 ? `+${v}` : v}
              </text>
            </g>
          );
        })}
        {minorTicks.map(v => {
          const a = v * 4.5;
          const radA = (a - 90) * (Math.PI / 180);
          return (
            <line 
              key={v}
              x1={100 + 66 * Math.cos(radA)} 
              y1={115 + 66 * Math.sin(radA)} 
              x2={100 + 70 * Math.cos(radA)} 
              y2={115 + 70 * Math.sin(radA)} 
              stroke="#52525b" 
              strokeWidth="1.5" 
            />
          );
        })}

        {/* Labels */}
        <text x="100" y="85" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#52525b" opacity="0.8">FRIDGE</text>
        <g transform="rotate(-65, 100, 115)">
          <text x="100" y="85" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#52525b" opacity="0.8">FREEZER</text>
        </g>
        <text x="100" y="145" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#18181b">°C</text>
        <text
          x="100"
          y="160"
          fontSize="9"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          textAnchor="middle"
          fill="#18181b"
        >
          {value === null ? 'Not read' : value.toFixed(1)}
        </text>

        {/* Needle Group */}
        <g 
          className="transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 115px' }}
        >
          <line x1="100" y1="115" x2="100" y2="130" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="115" x2="100" y2="48" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="115" r="5" fill="#dc2626" />
          <circle cx="100" cy="115" r="2.5" fill="#fca5a5" />
        </g>

        {/* Glass glare effect */}
        <path d="M 40,75 A 65,65 0 0,1 150,60 A 70,70 0 0,0 40,75 Z" fill="#ffffff" opacity="0.15" />
      </svg>
    </div>
  );
}

function Arc({ startAngle, endAngle, radius, color, thickness }: { startAngle: number, endAngle: number, radius: number, color: string, thickness: number }) {
  const radStart = (startAngle - 90) * (Math.PI / 180);
  const radEnd = (endAngle - 90) * (Math.PI / 180);
  
  const x1 = 100 + radius * Math.cos(radStart);
  const y1 = 115 + radius * Math.sin(radStart);
  const x2 = 100 + radius * Math.cos(radEnd);
  const y2 = 115 + radius * Math.sin(radEnd);
  
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return (
    <path
      d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={thickness}
    />
  );
}
