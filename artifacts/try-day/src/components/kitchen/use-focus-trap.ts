import { useEffect, type RefObject } from 'react';
import { isTopOverlay, popOverlay, pushOverlay } from './overlay-stack';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside an open overlay (close-up, map, notepad, job card):
 * moves focus in when it opens, cycles Tab/Shift+Tab within it, and hands focus
 * back to whatever had it when it closes. Pointer users are unaffected.
 * When overlays stack (a briefing video opened from a close-up), only the topmost
 * one handles Tab; the ones underneath wait until it closes.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, includeGuide = false) {
  useEffect(() => {
    if (!active) return undefined;
    const root = ref.current;
    if (!root) return undefined;
    pushOverlay(root);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      [...Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)),
        ...(includeGuide ? Array.from(document.querySelectorAll<HTMLElement>(`[data-step-navigation] ${FOCUSABLE.split(', ').join(', [data-step-navigation] ')}`)) : []),
      ].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Land on the first control (usually the close button) so the overlay can be dismissed straight away.
    const first = focusables()[0];
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
      if (includeGuide) {
        // The guide is before the portal in DOM order, so traverse the combined
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
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [ref, active, includeGuide]);
}
