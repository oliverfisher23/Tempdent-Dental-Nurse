import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp, Minus, UserRound } from 'lucide-react';
import { personForSpeaker, type Line } from '@shell/lib/client';
import { useClient } from '@shell/app/client-context';
import { useKitchen } from './kitchen-context';
import { anyOverlayOpen } from './overlay-stack';
import { kitchenAudio } from '@kit/lib/audio';
import { cn } from '@kit/lib/utils';

/** Lines longer than this are folded to a few lines until the student asks for more. */
const LONG_LINE = 220;
/** The chip sits this far above the bottom edge of the stage; rooms keep their objects above it. */
const CHIP_OFFSET_PX = 16;

export const DIALOGUE_COPY = {
  hide: 'Hide this',
  hideQuestion: 'Put the question away for now',
  waiting: 'Waiting for your answer',
};

/**
 * The colleague's face. Until portraits are supplied this is a plain person icon;
 * once `person.portrait` is set the photo takes its place with no other change.
 */
function SpeakerAvatar({ portrait, size }: { portrait: string | null | undefined; size: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-white ring-2 ring-white',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
      )}
    >
      {portrait ? (
        <img src={portrait} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserRound className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.25} />
      )}
    </span>
  );
}

/**
 * Everything anyone says lives here, along the bottom of the stage. It starts as a
 * small chip with the colleague's icon and name; the words only open when the
 * student clicks that name. The one exception is a question with answer buttons,
 * which opens itself because it has to be seen to be answered; the student can still
 * tuck it away to look at the room, and the chip then says the colleague is waiting.
 * Nothing in a room is ever placed underneath it.
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
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [unfolded, setUnfolded] = useState(false);
  // A question the student has put away for the moment; it comes back from the chip.
  const [tucked, setTucked] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLButtonElement>(null);
  const focusAfterToggle = useRef<'bar' | 'chip' | null>(null);
  // Whether the chip holds keyboard focus; a question that opens itself must not drop that focus.
  const chipFocused = useRef(false);
  const reduceMotion = useReducedMotion();
  const { working } = useKitchen();

  const { workplace } = useClient();
  const person = personForSpeaker(workplace, line.speaker);
  const long = working || line.text.length > LONG_LINE;
  const asking = !!choices;
  const showBar = open || (asking && !tucked);

  // Report the height so the room can keep its objects and the character above it.
  useLayoutEffect(() => {
    const el = barRef.current ?? chipRef.current;
    if (!el) {
      onHeight(0);
      return;
    }
    const isChip = el === chipRef.current;
    const report = () => onHeight(el.getBoundingClientRect().height + (isChip ? CHIP_OFFSET_PX : 0));
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, showBar, line.text]);

  // A new line waits on the chip until the student asks for it.
  useEffect(() => {
    setUnfolded(false);
    setUnread(true);
  }, [line]);

  // A fresh question opens itself, whatever was tucked away before it.
  useEffect(() => {
    setTucked(false);
  }, [asking, line]);

  // Once the words are on screen they are no longer "new"; ambient sound steps back while they show.
  useEffect(() => {
    if (!showBar) return undefined;
    setUnread(false);
    kitchenAudio.duck(true);
    return () => kitchenAudio.duck(false);
  }, [showBar, line]);

  // Opening and closing swap the chip for the bar, so hand focus across deliberately. A question
  // that opens itself while the chip is focused hands focus to the bar as well.
  useEffect(() => {
    const target = focusAfterToggle.current ?? (showBar && chipFocused.current ? 'bar' : null);
    if (target === 'bar') nameRef.current?.focus();
    if (target === 'chip') chipRef.current?.focus();
    focusAfterToggle.current = null;
    if (showBar) chipFocused.current = false;
  }, [showBar]);

  const openBar = () => {
    kitchenAudio.play('tap');
    focusAfterToggle.current = 'bar';
    // Bringing a tucked question back does not pin the bar open once it has been answered.
    if (asking) setTucked(false);
    else setOpen(true);
  };
  const closeBar = (moveFocus = true) => {
    kitchenAudio.play('tap');
    focusAfterToggle.current = moveFocus ? 'chip' : null;
    setOpen(false);
    if (asking) setTucked(true);
  };

  // Escape puts an open question away from anywhere in the room, so a student who never moved
  // focus into the bar can still clear it. Anything open above the room answers Escape itself,
  // and a control that has already used the key (a cancelled drag, say) keeps it.
  useEffect(() => {
    if (!asking || tucked) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || anyOverlayOpen()) return;
      if (barRef.current?.contains(e.target as Node)) return;
      closeBar(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [asking, tucked]);

  // Screen readers hear each new line as it arrives, whether or not the words are open on screen.
  const announcement = (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {line.speaker}: {line.text}
    </p>
  );

  // The chip and the bar are never keyed by the line: a new line must not remount
  // whatever the student is focused on (the chip, the name, or an answer button).
  if (!showBar) {
    return (
      <>
        {announcement}
        <motion.button
          ref={chipRef}
          type="button"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn(
            'absolute left-4 z-30 flex items-center gap-2.5 rounded-full border bg-white/95 py-1.5 pl-1.5 pr-4 text-foreground shadow-lg backdrop-blur outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-primary',
            unread ? 'border-primary' : 'border-border',
          )}
          style={{ bottom: CHIP_OFFSET_PX }}
          onClick={openBar}
          onFocus={() => { chipFocused.current = true; }}
          onBlur={() => { chipFocused.current = false; }}
          aria-expanded={false}
          aria-label={
            asking
              ? `${line.speaker} is waiting for your answer. Show the question`
              : unread
                ? `${line.speaker} has something to say. Show it`
                : `Show what ${line.speaker} said`
          }
          data-testid="dialogue-speaker"
          data-waiting={asking || undefined}
        >
          <span className="relative">
            <SpeakerAvatar portrait={person?.portrait} size="sm" />
            {(unread || asking) && (
              <motion.span
                key={line.text}
                aria-hidden
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className={cn('absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-white', asking && 'motion-safe:animate-pulse')}
              />
            )}
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-bold">{line.speaker}</span>
            {/* A tucked-away question is still waiting: the chip says so until it is answered. */}
            {asking && <span className="text-xs font-medium text-primary">{DIALOGUE_COPY.waiting}</span>}
          </span>
        </motion.button>
      </>
    );
  }

  const namePlate = (
    <>
      <SpeakerAvatar portrait={person?.portrait} size="md" />
      <span className="text-xs font-bold uppercase tracking-widest text-[#b91820]">{line.speaker}</span>
    </>
  );

  return (
    <>
      {announcement}
      {/* The bar never takes more than 60% of the stage: in a short LMS frame (480px high) a question
          with three answers and the mentor's reply would otherwise cover every control behind it. */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[60%] flex-col justify-end pointer-events-none">
        <motion.div
          ref={barRef}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="pointer-events-auto flex min-h-0 w-full flex-col border-t-4 border-primary bg-white/95 text-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur"
          data-testid="dialogue-bar"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              closeBar();
            }
          }}
        >
          <div className="mx-auto flex min-h-0 w-full max-w-6xl items-start gap-3 overflow-y-auto px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <button
                  ref={nameRef}
                  type="button"
                  onClick={() => closeBar()}
                  aria-expanded
                  aria-label={asking ? DIALOGUE_COPY.hideQuestion : `Hide what ${line.speaker} said`}
                  className="flex items-center gap-2.5 rounded-full pr-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {namePlate}
                </button>
                {person && person.role !== person.speaker && (
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">{person.role}</span>
                )}
              </div>
              {/* The live region above is the one accessible copy of the words; this is the visible one. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={line.text}
                  aria-hidden
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.15 }}
                  className={cn(
                    'mt-2 text-base leading-snug sm:text-lg',
                    long && !unfolded && (working ? 'line-clamp-2' : 'line-clamp-3'),
                  )}
                >
                  {line.text}
                </motion.p>
              </AnimatePresence>
              {long && (
                <button
                  type="button"
                  onClick={() => {
                    kitchenAudio.play('tap');
                    setUnfolded((v) => !v);
                  }}
                  aria-expanded={unfolded}
                  className="mt-1 flex items-center gap-1 text-xs font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {unfolded ? 'Less' : 'More'}
                  {unfolded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
              <AnimatePresence>
                {choices && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3"
                  >
                    {choices}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => closeBar()}
              className="shrink-0 rounded-full border border-zinc-300 bg-zinc-100 p-1.5 text-zinc-600 shadow-sm outline-none transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={asking ? DIALOGUE_COPY.hideQuestion : DIALOGUE_COPY.hide}
              title={asking ? DIALOGUE_COPY.hideQuestion : undefined}
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
