import { useEffect, useState } from 'react';
import { subscribeCaptions } from '@client/lib/sounds';

/**
 * The caption line for the world sounds: a short bracketed description that shows while a
 * sound plays, whether or not sound is on, and is announced politely to screen readers.
 * Sits under the rail header on a narrow stage and top-centre on a wide one (between the
 * rail header and the cast cards), so it never covers the panel or the pins' labels.
 */
export function SoundCaptions() {
  const [caption, setCaption] = useState<string | null>(null);
  useEffect(() => subscribeCaptions((text) => setCaption(text)), []);
  return (
    <div
      aria-live="polite"
      data-testid="sound-caption"
      className="pointer-events-none absolute left-2 top-[3.75rem] z-30 max-w-[70%] sm:left-1/2 sm:top-2 sm:max-w-[40%] sm:-translate-x-1/2 sm:text-center"
    >
      {caption && (
        <span className="inline-block rounded bg-black/70 px-2 py-1 text-xs font-medium text-white shadow-sm">
          [{caption}]
        </span>
      )}
    </div>
  );
}
