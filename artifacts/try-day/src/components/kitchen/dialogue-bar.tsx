import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp, MessageCircle, Minus } from 'lucide-react';
import { Line } from '@/content/activities';
import { personForSpeaker } from '@/content/kitchen';
import { useKitchen } from './kitchen-context';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';

/** Words appear at this pace while a character speaks. */
const WORD_MS = 45;
const WORDS_START_AFTER_MS = 750;
/** Lines longer than this are folded to a few lines until the student asks for more. */
const LONG_LINE = 220;

function sinceArrival(arrivedAt: number, afterMs: number, reduceMotion: boolean | null) {
  if (reduceMotion || !arrivedAt) return 0;
  return Math.max(0, arrivedAt + afterMs - Date.now());
}
/**
 * Everything anyone says appears here, in one band along the bottom of the stage:
 * the name plate, the words written out as they are spoken, and any choice the
 * student is being asked to make. Nothing in a room is ever placed underneath it.
 */
export function DialogueBar({
  line,
  choices,
  onHeight,
}: {
  line: Line;
  choices?: ReactNode;
  onHeight: (px: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [unfolded, setUnfolded] = useState(false);
  const [shownWords, setShownWords] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { arrivedAt, working } = useKitchen();

  const person = personForSpeaker(line.speaker);
  const words = line.text.split(' ');
  const allShown = shownWords >= words.length;
  const long = working || line.text.length > LONG_LINE;

  // Report the bar's height so the room can keep its objects and the character above it.
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) {
      onHeight(0);
      return;
    }
    const report = () => onHeight(el.getBoundingClientRect().height);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, collapsed, line.text]);

  // A new line: open the bar again, fold it, and start writing the words out.
  useEffect(() => {
    setCollapsed(false);
    setUnfolded(false);
    setShownWords(0);
    kitchenAudio.duck(true);
    const total = line.text.split(' ').length;
    if (reduceMotion) {
      setShownWords(total);
      return () => kitchenAudio.duck(false);
    }
    let shown = 0;
    let ticker: ReturnType<typeof setInterval> | null = null;
    const starter = setTimeout(() => {
      ticker = setInterval(() => {
        shown += 1;
        setShownWords(shown);
        if (shown >= total && ticker) clearInterval(ticker);
      }, WORD_MS);
    }, sinceArrival(arrivedAt, WORDS_START_AFTER_MS, reduceMotion));
    return () => {
      clearTimeout(starter);
      if (ticker) clearInterval(ticker);
      kitchenAudio.duck(false);
    };
  }, [line, arrivedAt, reduceMotion]);

  const finishWords = () => setShownWords(words.length);

  if (collapsed && !choices) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-foreground shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => {
          kitchenAudio.play('tap');
          setCollapsed(false);
        }}
        aria-label={`Show what ${line.speaker} said`}
      >
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold">{line.speaker}</span>
      </motion.button>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex items-end pointer-events-none">
      <motion.div
        ref={barRef}
        key={line.text}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="pointer-events-auto w-full border-t-4 border-primary bg-white/95 text-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur"
        data-testid="dialogue-bar"
        onClick={() => {
          if (!allShown) finishWords();
        }}
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#b91820]">{line.speaker}</span>
              {person && person.role !== person.speaker && (
                <span className="hidden truncate text-xs text-muted-foreground sm:inline">{person.role}</span>
              )}
            </div>
            <p className="sr-only">{line.text}</p>
            <p
              aria-hidden
              className={cn(
                'mt-1 text-base leading-snug sm:text-lg',
                long && !unfolded && (working ? 'line-clamp-2' : 'line-clamp-3'),
              )}
            >
              {words.slice(0, shownWords).join(' ')}
              {!allShown && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-primary motion-reduce:animate-none" />}
            </p>
            {long && allShown && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  kitchenAudio.play('tap');
                  setUnfolded((v) => !v);
                }}
                className="mt-1 flex items-center gap-1 text-xs font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
              >
                {unfolded ? 'Less' : 'More'}
                {unfolded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
            <AnimatePresence>
              {choices && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {choices}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              kitchenAudio.play('tap');
              setCollapsed(true);
            }}
            className="shrink-0 rounded-full border border-zinc-300 bg-zinc-100 p-1.5 text-zinc-600 shadow-sm outline-none transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Hide this"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
