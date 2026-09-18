import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function LogBook({ children, className }: { children: ReactNode; className?: string }) {
  // Pale blue/off-white hex pattern
  const hexPattern = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='76' viewBox='0 0 44 76'%3E%3Cpath d='M22 14.5l19 11v22l-19 11-19-11v-22l19-11zm0 2.3l-17 9.8v19.6l17 9.8 17-9.8V26.6l-17-9.8zM44 52.5l-22 12.7-22-12.7v-2.3l22 12.7 22-12.7v2.3z' fill='%2394a3b8' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E`;

  return (
    <div className={cn(
      "relative bg-[#f4f7f9] w-full max-w-5xl mx-auto rounded-r-xl shadow-2xl flex overflow-hidden border-2 border-slate-200",
      className
    )}>
      {/* Hexagon Pattern Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("${hexPattern}")`,
          backgroundSize: '44px',
        }}
      />

      {/* Binding */}
      <div className="w-12 sm:w-16 shrink-0 bg-[#272b3b] shadow-[inset_-6px_0_12px_rgba(0,0,0,0.5)] z-10 border-r border-[#1a1d29]" />

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-10 z-10 relative overflow-y-auto hide-scrollbar">
        {children}
      </div>
    </div>
  );
}

export function LogBookHeader({ round = "06:45 ROUND" }: { round?: string }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <h2 
        className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-[#272b3b] text-center leading-none mb-6" 
        style={{ fontFamily: 'var(--font-sans)', transform: 'scaleY(1.15)', transformOrigin: 'bottom' }}
      >
        Food temperature<br/>log book
      </h2>

      {/* Equipment / Details box - adapted to Location & Date to avoid conflicting with unit rows */}
      <div className="w-full max-w-2xl border-2 border-[#272b3b] rounded-sm bg-white p-3 space-y-2 text-sm sm:text-base font-bold text-[#272b3b] shadow-sm">
        <div className="flex border-b border-slate-300 pb-1">
          <span className="w-32 pl-2">Location:</span>
          <span className="flex-1 font-medium font-mono text-slate-700">Main Kitchen</span>
        </div>
        <div className="flex border-b border-slate-300 pb-1">
          <span className="w-32 pl-2">Date:</span>
          <span className="flex-1 font-medium font-mono text-slate-700">{new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <div className="flex pb-1">
          <span className="w-32 pl-2">Round:</span>
          <span className="flex-1 font-medium font-mono text-slate-700">{round}</span>
        </div>
      </div>
    </div>
  );
}
