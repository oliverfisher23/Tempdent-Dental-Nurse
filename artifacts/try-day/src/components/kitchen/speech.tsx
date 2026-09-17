import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line } from '@/content/activities';
import { personForSpeaker } from '@/content/kitchen';
import { kitchenAudio } from '@/lib/audio';
import { MessageCircle, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Speech({ line }: { line: Line }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
  
  const person = personForSpeaker(line.speaker);

  useEffect(() => {
    setCollapsed(false);
    setExpandedText(false);
    kitchenAudio.duck(true);
    return () => kitchenAudio.duck(false);
  }, [line]);

  if (!line) return null;

  if (collapsed) {
    return (
       <motion.button
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="absolute bottom-6 sm:bottom-8 left-4 sm:left-8 z-20 bg-white text-foreground rounded-full px-4 py-2 shadow-lg border border-border flex items-center gap-2 pointer-events-auto focus-visible:ring-2 focus-visible:ring-primary outline-none"
         onClick={() => { kitchenAudio.play('tap'); setCollapsed(false); }}
         aria-label={`Show message from ${line.speaker}`}
       >
         <MessageCircle className="w-4 h-4 text-primary" />
         <span className="font-bold text-sm">{line.speaker}</span>
       </motion.button>
    );
  }

  return (
    <motion.div
      key={line.text}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-6 sm:bottom-8 left-4 right-4 sm:left-8 sm:right-auto z-20 pointer-events-none flex items-end sm:gap-6"
      aria-live="polite"
    >
      {person?.portrait && (
        <div className="hidden sm:block w-32 sm:w-40 shrink-0 transform origin-bottom">
          <img 
            src={person.portrait} 
            alt="" 
            className="w-full drop-shadow-2xl object-contain"
            style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}
      
      <div className="bg-white text-foreground rounded-t-xl rounded-br-xl sm:rounded-t-2xl sm:rounded-br-2xl rounded-bl-sm p-4 sm:p-6 shadow-2xl border border-border relative pointer-events-auto w-full sm:w-auto sm:max-w-[480px]">
        {/* Tail */}
        <div className="absolute -left-3 bottom-0 w-0 h-0 border-r-[16px] border-r-white border-t-[16px] border-t-transparent hidden sm:block" />
        <div className="absolute -left-[14px] bottom-0 w-0 h-0 border-r-[16px] border-r-border border-t-[16px] border-t-transparent -z-10 hidden sm:block" />
        
        {/* Controls */}
        <button 
          onClick={() => { kitchenAudio.play('tap'); setCollapsed(true); }}
          className="absolute -top-3 -right-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-600 rounded-full p-1.5 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
          aria-label="Hide message"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex gap-4 items-start">
          {person?.portrait && (
            <img 
              src={person.portrait} 
              alt="" 
              className="sm:hidden w-14 h-14 object-cover rounded-full bg-muted shrink-0 border border-border shadow-inner"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="mb-1.5">
              <div className="font-bold text-sm uppercase tracking-widest text-primary">{line.speaker}</div>
              {person && <div className="text-xs text-muted-foreground truncate">{person.role}</div>}
            </div>
            
            <div className={cn(
              "text-base sm:text-lg leading-relaxed font-medium transition-all duration-300 overflow-hidden",
              !expandedText && "line-clamp-3 sm:line-clamp-none"
            )}>
              "{line.text}"
            </div>
            
            {/* Mobile expand toggle */}
            <div className="sm:hidden mt-2 flex justify-end">
              <button 
                onClick={() => setExpandedText(!expandedText)}
                className="text-xs font-bold text-primary flex items-center gap-1 py-1 px-2 -mr-2 rounded hover:bg-primary/10 transition-colors"
              >
                {expandedText ? (
                  <>Less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>More <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
