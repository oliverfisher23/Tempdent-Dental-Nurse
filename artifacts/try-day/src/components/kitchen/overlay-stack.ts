/**
 * Which overlay is on top. Close-ups, the map, the notebook, the job card and the
 * small modals (briefing video, "how do I do this?") can be open at the same time;
 * only the topmost one should answer Escape and keep keyboard focus.
 */
const stack: HTMLElement[] = [];

export function pushOverlay(root: HTMLElement) {
  if (!stack.includes(root)) stack.push(root);
}

export function popOverlay(root: HTMLElement) {
  const index = stack.indexOf(root);
  if (index >= 0) stack.splice(index, 1);
}

export function isTopOverlay(root: HTMLElement | null) {
  return root !== null && stack[stack.length - 1] === root;
}
