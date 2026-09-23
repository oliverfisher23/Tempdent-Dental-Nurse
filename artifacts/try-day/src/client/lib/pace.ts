import { useCallback, useEffect, useState } from 'react';

/**
 * V2 (S5) "at your pace": the paced segment and the turnaround clock wait for the
 * learner. On by default for keyboard, switch and screen-reader users (first input of
 * the session is a key, or the OS asks for reduced motion) and available to everyone
 * from the stage rail. Speed never changes what is judged.
 */
const STORAGE_KEY = 'springpod:tempdent-try-day:own-pace';
const listeners = new Set<() => void>();
let keyboardFirst: boolean | null = null;

function storedValue(): boolean | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : raw === '1';
  } catch {
    return null;
  }
}

function defaultValue(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  return keyboardFirst === true;
}

export function readOwnPace(): boolean {
  return storedValue() ?? defaultValue();
}

export function writeOwnPace(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Private mode: the setting lasts for the session only.
  }
  listeners.forEach((listener) => listener());
}

/** Remember whether the session's first input was a key, before any pointer. */
function watchFirstInput(): void {
  if (typeof window === 'undefined' || keyboardFirst !== null) return;
  const settle = (byKeyboard: boolean) => {
    if (keyboardFirst !== null) return;
    keyboardFirst = byKeyboard;
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onPointer, true);
    listeners.forEach((listener) => listener());
  };
  const onKey = (event: KeyboardEvent) => { if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') settle(true); };
  const onPointer = () => settle(false);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointer, true);
}

export function useOwnPace(): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => (typeof window === 'undefined' ? false : readOwnPace()));
  useEffect(() => {
    watchFirstInput();
    const update = () => setValue(readOwnPace());
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, []);
  const set = useCallback((next: boolean) => writeOwnPace(next), []);
  return [value, set];
}
