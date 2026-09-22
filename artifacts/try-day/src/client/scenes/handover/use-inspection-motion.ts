import { useEffect, useState } from 'react';

const preferenceKey = 'try-day:inspection-motion';
type MotionChoice = 'play' | 'pause' | null;

export function useInspectionMotion() {
  const [choice, setChoice] = useState<MotionChoice>(() => {
    try {
      const saved = sessionStorage.getItem(preferenceKey);
      return saved === 'play' || saved === 'pause' ? saved : null;
    } catch {
      // A storage-restricted embed still keeps the choice for this round.
      return null;
    }
  });
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const motionEnabled = choice === 'play' || (choice === null && !reducedMotion);
  const setMotionEnabled = (enabled: boolean) => {
    const next = enabled ? 'play' : 'pause';
    setChoice(next);
    try {
      sessionStorage.setItem(preferenceKey, next);
    } catch {
      // The in-memory preference remains effective without storage permission.
    }
  };
  return { motionEnabled, setMotionEnabled };
}