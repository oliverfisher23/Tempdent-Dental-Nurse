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
/** The character steps in this long after the student arrives in the room; their words start a little after. */
const CHARACTER_ENTERS_AFTER_MS = 350;
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
  const { present, arrivedAt, working } = useKitchen();

  const person = personForSpeaker(line.speaker);
  const drawnByScene = person ? present.some((p) => p.person === person.id) : false;
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
          {/* On a phone the face sits in the bar; on a wider screen the character stands above it. */}
          {person?.portrait && !drawnByScene && (
            <img
              src={person.portrait}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full border-2 border-primary/40 bg-zinc-100 object-cover object-top sm:hidden"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{line.speaker}</span>
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

/**
 * The one place a character stands: at the right of the room, on the dialogue
 * bar. They step in when they start speaking and give way when someone else does.
 * Scenes that draw a person themselves (the driver at his van) register them
 * with `usePresent`, and the spot stays empty for that person.
 */
export function CharacterSpot({ line }: { line: Line | null }) {
  const { present, arrivedAt, working } = useKitchen();
  const reduceMotion = useReducedMotion();
  const person = line ? personForSpeaker(line.speaker) : undefined;
  const drawnByScene = person ? present.some((p) => p.person === person.id) : false;
  const show = person?.portrait && !drawnByScene && !working ? person : null;
  const delay = sinceArrival(arrivedAt, CHARACTER_ENTERS_AFTER_MS, reduceMotion) / 1000;

  return (
    <div
      className="pointer-events-none absolute right-[2%] z-20 hidden h-[52%] max-h-[440px] sm:block"
      style={{ bottom: 'var(--dialogue-h, 0px)' }}
      aria-hidden
    >
      <AnimatePresence mode="wait">
        {show && (
          <motion.img
            key={show.id}
            src={show.portrait!}
            alt=""
            initial={reduceMotion ? false : { opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
            transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full w-auto object-contain object-bottom drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
            decoding="async"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
