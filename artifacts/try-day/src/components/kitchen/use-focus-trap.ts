import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside an open overlay (close-up, map, notepad, job card):
 * moves focus in when it opens, cycles Tab/Shift+Tab within it, and hands focus
 * back to whatever had it when it closes. Pointer users are unaffected.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return undefined;
    const root = ref.current;
    if (!root) return undefined;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Land on the first control (usually the close button) so the overlay can be dismissed straight away.
    const first = focusables()[0];
    (first ?? root).focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const current = document.activeElement as HTMLElement | null;
      const index = current ? items.indexOf(current) : -1;
      if (e.shiftKey && (index <= 0 || !root.contains(current))) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (index === items.length - 1 || !root.contains(current))) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [ref, active]);
}
