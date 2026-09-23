import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';
import type { Decision, Presentation } from '@client/content/tasks';

register('./support/asset-loader.mjs', import.meta.url);

// Content imports its pictures, so it is loaded after the asset hook is registered.
const { CLOSE_UP_KINDS, TASKS } = await import('@client/content/tasks');

/**
 * Presentation metadata is authored by hand against photographs, so these
 * checks catch what the type system cannot: a hotspot for an option that does
 * not exist, a label field nobody can tick, a kit whose statuses disagree with
 * the answer key, or two pins on top of each other.
 */

/** Which decision kinds each presentation can carry. */
const ALLOWED: Record<Presentation['kind'], Decision['kind'][]> = {
  speech: ['choice', 'checklist'],
  hotspots: ['choice', 'checklist', 'sequence'],
  paper: ['checklist', 'sequence'],
  order: ['sequence'],
  tray: ['choice', 'checklist'],
  labels: ['checklist'],
  bench: ['checklist'],
  kit: ['checklist'],
  reflection: ['choice'],
  find: ['checklist'],
  hold: ['choice'],
  path: ['sequence'],
  controls: ['checklist', 'sequence'],
  initials: ['choice'],
  paced: ['choice', 'checklist', 'sequence'],
  offers: ['checklist'],
  zones: ['checklist'],
  autoclave: ['checklist', 'sequence'],
  board: ['sequence'],
  flags: ['checklist'],
  printout: ['choice'],
  stick: ['checklist'],
  turnaround: ['sequence'],
  handover: ['checklist'],
};

function* presented(): Generator<{ taskId: string; place: string; decision: Decision; present: Presentation }> {
  for (const [taskId, task] of Object.entries(TASKS)) {
    for (const scene of task.scenes) {
      for (const decision of scene.decisions) {
        if (decision.present) yield { taskId, place: scene.place, decision, present: decision.present };
      }
    }
  }
}

const optionIds = (decision: Decision) => decision.options.map((option) => option.id);
const same = (a: string[], b: string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

test('every presentation fits its decision kind and names only real options', () => {
  for (const { taskId, decision, present } of presented()) {
    const where = `${taskId}/${decision.id}`;
    const ids = optionIds(decision);
    assert.ok(ALLOWED[present.kind].includes(decision.kind), `${where}: ${present.kind} cannot present a ${decision.kind}`);
    if (CLOSE_UP_KINDS.includes(present.kind)) {
      const closeUp = present as Extract<Presentation, { title: string }>;
      assert.ok(closeUp.title.trim().length > 0, `${where}: close-up needs a title`);
      assert.ok(closeUp.open.trim().length > 0 && closeUp.open.length <= 24, `${where}: opener label missing or over 24 characters`);
      if (closeUp.picture !== undefined) assert.equal(typeof closeUp.picture, 'string', `${where}: picture must be an imported file`);
    }
    switch (present.kind) {
      case 'reflection': {
        for (const [id, spot] of Object.entries(present.spots)) {
          assert.ok(ids.includes(id), `${where}: reflection spot for unknown option ${id}`);
          assert.ok(spot.x >= 8 && spot.x <= 92 && spot.y >= 15 && spot.y <= 75, `${where}: reflection spot ${id} is outside the safe photograph area`);
        }
        break;
      }
      case 'find': {
        for (const [id, fault] of Object.entries(present.faults)) {
          assert.ok(ids.includes(id), `${where}: find fault for unknown option ${id}`);
          assert.ok(fault.spot.x >= 8 && fault.spot.x <= 92 && fault.spot.y >= 15 && fault.spot.y <= 75, `${where}: find fault ${id} is outside the safe photograph area`);
        }
        for (const fine of present.fine) {
          assert.ok(fine.spot.x >= 8 && fine.spot.x <= 92 && fine.spot.y >= 15 && fine.spot.y <= 75, `${where}: fine spot is outside the safe photograph area`);
        }
        break;
      }
      case 'path': {
        for (const [id, spot] of Object.entries(present.zones)) {
          assert.ok(ids.includes(id), `${where}: path zone for unknown option ${id}`);
          assert.ok(spot.x >= 8 && spot.x <= 92 && spot.y >= 15 && spot.y <= 75, `${where}: path zone ${id} is outside the safe photograph area`);
        }
        break;
      }
      case 'controls': {
        for (const [id, control] of Object.entries(present.controls)) {
          assert.ok(ids.includes(id), `${where}: control for unknown option ${id}`);
          assert.ok(control.spot.x >= 8 && control.spot.x <= 92 && control.spot.y >= 15 && control.spot.y <= 75, `${where}: control ${id} is outside the safe photograph area`);
        }
        if (present.commit.spot) {
          assert.ok(present.commit.spot.x >= 8 && present.commit.spot.x <= 92 && present.commit.spot.y >= 15 && present.commit.spot.y <= 75, `${where}: commit control is outside the safe photograph area`);
        }
        break;
      }
      case 'hold': {
        assert.ok(ids.includes(present.commits), `${where}: hold commits unknown option ${present.commits}`);
        if (present.distractor) assert.ok(ids.includes(present.distractor.optionId), `${where}: hold distractor names unknown option`);
        for (const id of present.choose?.optionIds ?? []) assert.ok(ids.includes(id), `${where}: hold choice names unknown option ${id}`);
        break;
      }
      case 'paced': {
        const decisions = new Map(TASKS[taskId].scenes.flatMap((scene) => scene.decisions).map((item) => [item.id, item]));
        for (const id of present.segment.decisions) assert.ok(decisions.has(id), `${where}: paced segment names unknown decision ${id}`);
        for (const cue of present.segment.cues) {
          const cueDecision = decisions.get(cue.decision);
          assert.ok(cueDecision, `${where}: cue names unknown decision ${cue.decision}`);
          assert.ok(cueDecision?.options.some((option) => option.id === cue.option), `${where}: cue names unknown option ${cue.option}`);
        }
        break;
      }
      case 'hotspots': {
        const offstage = present.offstage ?? [];
        for (const id of [...Object.keys(present.spots), ...offstage]) assert.ok(ids.includes(id), `${where}: hotspot for unknown option ${id}`);
        for (const id of ids) assert.ok(id in present.spots || offstage.includes(id), `${where}: option ${id} has neither a spot nor an offstage listing`);
        for (const id of offstage) assert.ok(!(id in present.spots), `${where}: ${id} is both a spot and offstage`);
        const spots = Object.entries(present.spots);
        for (const [id, spot] of spots) {
          assert.ok(spot.x >= 2 && spot.x <= 98 && spot.y >= 2 && spot.y <= 98, `${where}: spot ${id} is off the photograph`);
          if (spot.hint) assert.ok(spot.hint.length <= 20, `${where}: hint for ${id} is a sentence; pin labels stay under 20 characters`);
        }
        for (let i = 0; i < spots.length; i += 1) {
          for (let j = i + 1; j < spots.length; j += 1) {
            const [a, sa] = spots[i];
            const [b, sb] = spots[j];
            const distance = Math.hypot(sa.x - sb.x, sa.y - sb.y);
            assert.ok(distance >= 7, `${where}: spots ${a} and ${b} are ${distance.toFixed(1)}% apart; pins overlap under 7%`);
          }
        }
        break;
      }
      case 'labels': {
        const fields = present.packages.flatMap((pkg) => pkg.fields.map((field) => field.optionId));
        assert.ok(same(fields, ids), `${where}: label fields must cover every option exactly once`);
        assert.equal(new Set(present.packages.map((pkg) => pkg.id)).size, present.packages.length, `${where}: package ids repeat`);
        for (const pkg of present.packages) {
          for (const field of pkg.fields) assert.ok(field.value.trim().length > 0, `${where}: ${pkg.id} ${field.field} has no printed value`);
          for (const field of pkg.fields) {
            const label = decision.options.find((option) => option.id === field.optionId)?.label ?? '';
            assert.ok(label.includes(field.value), `${where}: ${pkg.id} ${field.field} prints ${field.value}, which the option text does not mention`);
          }
        }
        break;
      }
      case 'bench':
      case 'kit': {
        assert.ok(same(Object.keys(present.items), ids), `${where}: ${present.kind} items must match the options exactly`);
        if (present.kind === 'kit') {
          assert.ok(same(Object.keys(present.items), [...(decision.correct as readonly string[])]), `${where}: reading every kit item must be the answer set`);
        }
        break;
      }
      case 'tray': {
        for (const id of Object.keys(present.images ?? {})) assert.ok(ids.includes(id), `${where}: tray picture for unknown option ${id}`);
        assert.ok(present.shelf.trim().length > 0, `${where}: tray needs a shelf label`);
        break;
      }
      default:
        break;
    }
  }
});

test('scene people are real people of the client', async () => {
  const { WORKPLACE } = await import('@client/content/client');
  const known = new Set(WORKPLACE.people.map((person) => person.id));
  for (const [taskId, task] of Object.entries(TASKS)) {
    for (const scene of task.scenes) {
      for (const id of scene.people ?? []) assert.ok(known.has(id), `${taskId}/${scene.place}: unknown person ${id}`);
    }
  }
});

test('presentations are authored for every decision the storyboard stages by hand', () => {
  // Sequences and checklists always get a workspace or the photograph; a bare
  // default is fine for a choice (speech) but the hands-on kinds are chosen on purpose.
  for (const [taskId, task] of Object.entries(TASKS)) {
    for (const scene of task.scenes) {
      for (const decision of scene.decisions) {
        if (decision.kind !== 'choice') assert.ok(decision.present, `${taskId}/${decision.id}: ${decision.kind} needs an authored presentation`);
      }
    }
  }
});
