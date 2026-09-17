import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Clipboard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full flex flex-col min-h-0", className)}>
      {/* Clip */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-32 h-8 bg-zinc-300 rounded-t-lg shadow-md z-20 border-b-2 border-zinc-400 flex items-center justify-center">
        <div className="w-16 h-2 bg-zinc-400 rounded-full" />
      </div>
      {/* Board */}
      <div className="bg-[#594236] rounded-md shadow-2xl p-3 pt-6 w-full flex-1 flex flex-col min-h-0">
        {/* Paper stack */}
        <div className="bg-white rounded shadow-sm overflow-y-auto flex-1 relative min-h-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Whiteboard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full flex flex-col min-h-0", className)}>
      {/* Frame */}
      <div className="bg-zinc-200 p-2 rounded-md shadow-2xl border-b-4 border-zinc-300 flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-sm border border-zinc-300 shadow-inner overflow-y-auto relative flex-1 min-h-[400px]">
          {children}
        </div>
      </div>
      {/* Pen tray */}
      <div className="absolute bottom-0 left-8 right-8 h-3 bg-zinc-300 translate-y-full rounded-b-sm shadow-md" />
    </div>
  );
}

export function Notepaper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-[#FEFBF5] p-8 shadow-md border border-[#E8E2D2] relative flex flex-col min-h-0 overflow-y-auto",
      className
    )}
    style={{
      backgroundImage: 'linear-gradient(transparent 95%, #E8E2D2 95%)',
      backgroundSize: '100% 2rem',
      backgroundAttachment: 'local'
    }}>
      {children}
    </div>
  );
}

export function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white p-8 shadow-sm border border-border flex flex-col min-h-0 overflow-y-auto min-h-[500px]", className)}>
      {children}
    </div>
  );
}
