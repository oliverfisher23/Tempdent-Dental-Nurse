import mechanic from './mechanic.json';

export const MECHANIC = mechanic;
export const FRAME = mechanic.config.frame;
export const TASK_ORDER = mechanic.config.tasks.map((task) => task.id);

export function getTask(id: string) {
  const task = mechanic.config.tasks.find((candidate) => candidate.id === id);
  if (!task) throw new Error(`Unknown task: ${id}`);
  return task;
}