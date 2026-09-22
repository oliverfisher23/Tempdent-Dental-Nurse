import {
  spec, startTask, tap, taps, openCloseUp, confirm, done, carryOn,
  judged, decision, option, feedback, shot, expect, goTo } from './harness.mjs';

async function expectRight(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be judged right`);
}

async function finishCloseUp(page, id) {
  expect(await decision(page, id).last().getAttribute('data-state') === 'right', `${id} close-up should be right`);
  await done(page);
  await expectRight(page, id);
  await carryOn(page);
}


spec('reset content and presentations', async (browser) => {
  const { page, context, errors } = await startTask(browser, 4);

  await openCloseUp(page, 'care');
  await taps(page, 'care', ['rinse', 'mirror', 'glasses', 'bib', 'sit']);
  await finishCloseUp(page, 'care');

  await openCloseUp(page, 'batch');
  await taps(page, 'batch', ['la_lot', 'comp_lot', 'bond_lot']);
  await confirm(page, 'batch');
  await finishCloseUp(page, 'batch');

  await openCloseUp(page, 'dictation');
  await taps(page, 'dictation', ['restoration', 'la', 'signal', 'aftercare', 'recall6']);
  await confirm(page, 'dictation');
  await finishCloseUp(page, 'dictation');

  await taps(page, 'aftercare', ['numb', 'bite', 'high']);
  await confirm(page, 'aftercare');
  await expectRight(page, 'aftercare');
  await carryOn(page);

  await goTo(page, 'reception');
  await tap(page, 'recall', 'six_months');
  await expectRight(page, 'recall');
  await carryOn(page);

  await goTo(page, 'surgery2');
  await tap(page, 'sharps', 'reid');
  await expectRight(page, 'sharps');
  await carryOn(page);

  await tap(page, 'sam', 'honest');
  await expectRight(page, 'sam');
  await carryOn(page);

  await openCloseUp(page, 'reset');
  await taps(page, 'reset', ['ppe', 'instruments', 'waste', 'gloves_off', 'box', 'doff', 'wipe', 'flush', 'aspirator', 'tray']);
  await finishCloseUp(page, 'reset');

  expect(await decision(page, 'reset').first().getAttribute('data-state') === 'right', 'the reset order should be judged right');
  expect(errors.length === 0, `browser errors: ${errors.join('; ')}`);
  await context.close();
});