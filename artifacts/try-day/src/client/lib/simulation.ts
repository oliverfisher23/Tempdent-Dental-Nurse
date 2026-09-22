import mechanic from '@client/content/mechanic.json';
import {
  createDayRuntime,
  initialsFromName,
  type DayRuntime,
  type Evaluation,
  type Progress,
  type ProgressModel,
  type TaskId,
} from '@shell/lib/day';

export interface SetupTaskState {
  waterFlushMinutes: number | null;
  emergencyKit: string | null;
}

export interface WelcomeTaskState {
  greeting: string | null;
  dadQuestion: string | null;
}

export interface FillingTaskState {
  firstInstrument: string | null;
  patientSignal: string | null;
}

export interface ResetTaskState {
  aftercare: string | null;
  wipeDown: string | null;
}

export interface ChangeTaskState {
  firstPriority: string | null;
}

export interface CloseTaskState {
  greeting: string | null;
  charting: string | null;
}

export interface TaskStates extends Record<string, unknown> {
  setup: SetupTaskState;
  welcome: WelcomeTaskState;
  filling: FillingTaskState;
  reset: ResetTaskState;
  change: ChangeTaskState;
  close: CloseTaskState;
}

export function initialTaskStates(): TaskStates {
  return {
    setup: { waterFlushMinutes: null, emergencyKit: null },
    welcome: { greeting: null, dadQuestion: null },
    filling: { firstInstrument: null, patientSignal: null },
    reset: { aftercare: null, wipeDown: null },
    change: { firstPriority: null },
    close: { greeting: null, charting: null },
  };
}

export function evaluateTask(id: TaskId, tasks: TaskStates): Evaluation {
  if (id === 'setup') {
    const timeOk = tasks.setup.waterFlushMinutes === 2;
    const kitOk = tasks.setup.emergencyKit === 'checked';
    return { 
      done: timeOk && kitOk, 
      checklist: [
        { id: 'water', label: 'Water lines flushed for 2 minutes', met: timeOk },
        { id: 'kit', label: 'Emergency kit checked', met: kitOk }
      ] 
    };
  }
  if (id === 'welcome') {
    const greetOk = tasks.welcome.greeting === 'child_focused';
    const dadOk = tasks.welcome.dadQuestion === 'allow_in';
    return {
      done: greetOk && dadOk,
      checklist: [
        { id: 'greet', label: 'Greeted Amira appropriately', met: greetOk },
        { id: 'dad', label: 'Addressed dad\'s concern', met: dadOk }
      ]
    };
  }
  if (id === 'filling') {
    const instOk = tasks.filling.firstInstrument === 'mirror_probe';
    const signalOk = tasks.filling.patientSignal === 'pause_alert';
    return {
      done: instOk && signalOk,
      checklist: [
        { id: 'inst', label: 'Passed mirror and probe', met: instOk },
        { id: 'sig', label: 'Paused when patient signaled', met: signalOk }
      ]
    };
  }
  if (id === 'reset') {
    const afterOk = tasks.reset.aftercare === 'numbness';
    const wipeOk = tasks.reset.wipeDown === 'complete';
    return {
      done: afterOk && wipeOk,
      checklist: [
        { id: 'after', label: 'Explained numbness aftercare', met: afterOk },
        { id: 'wipe', label: 'Wiped down correctly', met: wipeOk }
      ]
    };
  }
  if (id === 'change') {
    const priOk = tasks.change.firstPriority === 'emergency';
    return {
      done: priOk,
      checklist: [
        { id: 'pri', label: 'Prioritised emergency patient', met: priOk }
      ]
    };
  }
  if (id === 'close') {
    const greetOk = tasks.close.greeting === 'calm_no_judgment';
    const chartOk = tasks.close.charting === 'logged';
    return {
      done: greetOk && chartOk,
      checklist: [
        { id: 'greet', label: 'Reassured Graham', met: greetOk },
        { id: 'chart', label: 'Charting logged accurately', met: chartOk }
      ]
    };
  }
  throw new Error(`Unknown task: ${id}`);
}

export function testProgress(
  target: TaskId | null | undefined,
  initial: () => Progress<TaskStates>,
): Progress<TaskStates> {
  const progress = initial();
  const finished = target === null;
  const blank = target === undefined;
  
  const tasks = initialTaskStates();
  const taskOrder = mechanic.config.tasks.map(t => t.id);
  const completed: string[] = [];
  let clock = mechanic.config.tasks[0].time;

  if (blank || (target && !taskOrder.includes(target as string))) {
    return {
      ...progress,
      studentName: blank ? '' : 'Learning Designer',
      initials: blank ? '' : initialsFromName('Learning Designer'),
      startedAt: blank ? null : new Date().toISOString(),
      tasks,
      completed: [],
      completedAt: null,
      clock
    };
  }

  let reachedTarget = false;

  for (const id of taskOrder) {
    if (target === id) {
      reachedTarget = true;
      clock = mechanic.config.tasks.find(t => t.id === id)!.time;
    }
    
    if (finished || (!reachedTarget && target !== id)) {
      if (id === 'setup') tasks.setup = { waterFlushMinutes: 2, emergencyKit: 'checked' };
      if (id === 'welcome') tasks.welcome = { greeting: 'child_focused', dadQuestion: 'allow_in' };
      if (id === 'filling') tasks.filling = { firstInstrument: 'mirror_probe', patientSignal: 'pause_alert' };
      if (id === 'reset') tasks.reset = { aftercare: 'numbness', wipeDown: 'complete' };
      if (id === 'change') tasks.change = { firstPriority: 'emergency' };
      if (id === 'close') tasks.close = { greeting: 'calm_no_judgment', charting: 'logged' };
      completed.push(id);
    }
  }

  if (finished) {
    clock = mechanic.config.tasks[mechanic.config.tasks.length - 1].time;
  }

  return {
    ...progress,
    studentName: 'Learning Designer',
    initials: initialsFromName('Learning Designer'),
    startedAt: new Date().toISOString(),
    tasks,
    completed,
    completedAt: finished ? new Date().toISOString() : null,
    clock,
  };
}

// No reviveSaved: the shell already rebuilds each record over its defaults and drops
// unknown task ids, and it trusts the saved `completed` list as a record of finished
// work. If a task's evidence fields ever change shape, bump `config.version` in
// mechanic.json so the storage key changes, rather than re-judging old saves here.
export const model: ProgressModel<TaskStates> = {
  initialTaskStates,
  evaluateTask,
  complicationRevealed: () => false,
  testProgress: (target, initial) => testProgress(target, initial),
};

export const day: DayRuntime<TaskStates> = createDayRuntime(mechanic as any, model);
export const STORAGE_KEY = day.spec.STORAGE_KEY;