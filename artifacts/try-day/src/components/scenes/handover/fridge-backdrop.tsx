import { PLACES } from '@/content/kitchen';

/**
 * The fridges photograph (Terence at a drawer of raw meat trays) faded behind
 * Task 1's paperwork pages: the overnight log and the finished board.
 *
 * It is atmosphere, never evidence. The two fridge readouts are blurred at
 * export (content/kitchen-photos.json) and the picture sits at low opacity under
 * a white wash, so nothing in it can be read as a temperature. The inspection
 * viewer keeps its own footage and is deliberately left without this backdrop.
 */
export function FridgeBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src={PLACES.corridor.backdrop}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[50%_40%] opacity-20 grayscale"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
    </div>
  );
}
