/**
 * Scroll only the nearest scrollable ancestor so `el` sits at its start or centre.
 *
 * `Element.scrollIntoView` also scrolls `overflow: hidden` ancestors. A stage whose backdrop is
 * scaled with a transform has scrollable overflow, so scrollIntoView shifts the whole stage,
 * its navigation and header included, with no way for the learner to scroll it back.
 */
export function scrollWithinScroller(el: HTMLElement | null, block: 'start' | 'center' = 'start', margin = 8): void {
  if (!el) return;
  let scroller = el.parentElement;
  while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
  if (!scroller) {
    el.scrollIntoView({ block, behavior: 'instant' });
    return;
  }
  const target = el.getBoundingClientRect();
  const frame = scroller.getBoundingClientRect();
  const offset = block === 'center' ? (frame.height - target.height) / 2 : margin;
  scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + (target.top - frame.top) - offset), behavior: 'instant' });
}
