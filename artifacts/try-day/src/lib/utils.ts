import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Item names are capitalised as list entries; mid-sentence ("Open salmon fillet") they read in lower case. */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Item names read in lower case mid-sentence; as a row title or after a colon they take a capital ("Haddock tart"). */
export function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
