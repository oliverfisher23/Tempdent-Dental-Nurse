import { useEffect, type RefObject } from 'react';
import { isTopOverlay, popOverlay, pushOverlay } from './overlay-stack';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Which part of the kitchen frame stays in the Tab cycle alongside the overlay:
 * - `false`: nothing, the overlay covers everything (a true modal).
 * - `'guide'`: the step guide bar (the map and notebook cover the header but the guide still leads).
 * - `'hud'`: the header tools and the step guide, which stay visible and clickable above a
 *   close-up or the job card, so keyboard users can reach the notebook from there too.
 */
export type TrapCompanion = false | 'guide' | 'hud';

const COMPANION_ROOT: Record<Exclude<TrapCompanion, false>, string> = {
  guide: '[data-step-navigation]',
  hud: '[data-kitchen-hud]',
};

function scoped(rootSelector: string) {
  return FOCUSABLE.split(', ').map((part) => `${rootSelector} ${part}`).join(', ');
}

/** Where focus goes when the overlay closes and whatever opened it is no longer on the page. */
function fallbackFocusTarget(): HTMLElement | null {
  return (
    // Only real controls: the "You are here" marker in the guide is a plain span and cannot take focus.
    document.querySelector<HTMLElement>('button[data-testid="guide-action"], button[data-testid="next-job"]') ??
    document.getElementById('main-activity')
  );
}

/**
 * Keeps keyboard focus inside an open overlay (close-up, map, notepad, job card):
 * moves focus in when it opens, cycles Tab/Shift+Tab within it, and hands focus
 * back to whatever had it when it closes. Pointer users are unaffected.
 * When overlays stack (a briefing video opened from a close-up), only the topmost
 * one handles Tab; the ones underneath wait until it closes.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, companion: TrapCompanion | true = false) {
  const include: TrapCompanion = companion === true ? 'guide' : companion;
  useEffect(() => {
    if (!active) return undefined;
    const root = ref.current;
    if (!root) return undefined;
    pushOverlay(root);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      [
        ...(include ? Array.from(document.querySelectorAll<HTMLElement>(scoped(COMPANION_ROOT[include]))) : []),
        ...Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Land on the overlay's first control (usually the close button) so it can be dismissed straight away.
    const first = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).find((el) => el.offsetParent !== null);
    (first ?? root).focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !isTopOverlay(root)) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const current = document.activeElement as HTMLElement | null;
      const index = current ? items.indexOf(current) : -1;
      if (include) {
        // The companion region is before the portal in DOM order, so traverse the combined
        // list explicitly rather than letting Tab escape between those regions.
        e.preventDefault();
        const next = e.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index + 1) % items.length;
        items[next].focus({ preventScroll: true });
        return;
      }
      if (e.shiftKey && index <= 0) {
        e.preventDefault();
        items[items.length - 1].focus({ preventScroll: true });
      } else if (!e.shiftKey && (index === items.length - 1 || index === -1)) {
        e.preventDefault();
        items[0].focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      popOverlay(root);
      // The control that opened the overlay may have gone (a hotspot that is now done, a step
      // that moved on). Focus must land somewhere sensible rather than falling back to <body>.
      const target = previouslyFocused?.isConnected && previouslyFocused !== document.body ? previouslyFocused : fallbackFocusTarget();
      target?.focus?.({ preventScroll: true });
    };
  }, [ref, active, include]);
}
