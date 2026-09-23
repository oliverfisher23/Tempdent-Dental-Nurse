/**
 * Spots on the photograph are rendered in reading order (left to right, then top to bottom),
 * never in the order the content lists them: a content map often lists a routine's steps in
 * their expected order, and the DOM order is what Tab and a screen reader follow.
 */
export function inReadingOrder<T>(
  entries: [string, T][],
  position: (item: T) => { x: number; y: number },
): [string, T][] {
  return [...entries].sort(([, a], [, b]) => {
    const pa = position(a);
    const pb = position(b);
    return pa.x - pb.x || pa.y - pb.y;
  });
}
