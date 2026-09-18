import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, ClipboardList, Radio, Scale, Thermometer } from 'lucide-react';
import { PLACES, PEOPLE, CRATE_IMAGES } from '@/content/kitchen';
import { FISH_CHECKS, LineStatus, ORDER_LINES, SHORT_LINE_ID } from '@/content/activities';
import { SCENE_LABELS } from '@/content/scenes/delivery';
import { useKitchenAction, usePresent } from '@/components/kitchen/kitchen-context';
import { useProgress } from '@/lib/progress-store';
import { evaluateDelivery, parseNumber } from '@/lib/simulation';
import { kitchenAudio } from '@/lib/audio';
import { useNotepad } from '../../kitchen/notepad';
import { Clipboard, Sheet } from '../../kitchen/paper';
import { CloseUp } from '../../kitchen/close-up';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnalogueThermometer } from '../../kitchen/analogue-thermometer';

type OrderLine = (typeof ORDER_LINES)[number];

function GuideAction({ action, open }: { action: string; open: () => void }) {
  useKitchenAction(action, open);
  return null;
}

function lineIsChecked(line: OrderLine, row: any) {
  return Boolean(row?.counted && (!line.chilled || row?.probed));
}

export function GoodsInScene({
  state,
  onLineInput,
  onLineStatus,
  onCountSettled,
  onProbeSettled,
  onFishCheck,
  onRadioMarcus,
  onSign,
  onNoteAmended,
  onFirstArrival
}: any) {
  usePresent('driver', 30);
  const { jot, advanceClock } = useProgress();
  const notebook = useNotepad();
  const driver = PEOPLE.find((person) => person.id === 'driver')!;

  const [openTrolley, setOpenTrolley] = useState<number | null>(null);
  const [openBoxId, setOpenBoxId] = useState<string | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteOpened, setNoteOpened] = useState(false);
  const [countingId, setCountingId] = useState<string | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);
  const [probeValue, setProbeValue] = useState<number | null>(null);
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstArrivalRef = useRef(false);

  useEffect(() => {
    if (!firstArrivalRef.current) {
      firstArrivalRef.current = true;
      onFirstArrival();
    }
  }, [onFirstArrival]);

  /** Stop any count or temperature reading still running; nothing settles after you walk away from a box. */
  const stopWork = () => {
    if (countTimer.current) clearTimeout(countTimer.current);
    if (probeTimer.current) clearInterval(probeTimer.current);
    countTimer.current = null;
    probeTimer.current = null;
    setCountingId(null);
    setProbingId(null);
  };
  useEffect(() => () => {
    if (countTimer.current) clearTimeout(countTimer.current);
    if (probeTimer.current) clearInterval(probeTimer.current);
  }, []);

  const openDeliveryNote = () => {
    kitchenAudio.play('page');
    stopWork();
    setOpenTrolley(null);
    setOpenBoxId(null);
    setBoardOpen(false);
    setNoteOpen(true);
    setNoteOpened(true);
  };

  const openTrolleyCard = (trolley: number) => {
    kitchenAudio.play('door');
    setBoardOpen(false);
    setNoteOpen(false);
    setOpenTrolley(trolley);
    setOpenBoxId(null);
  };

  const openBoxWorkspace = (line: OrderLine) => {
    stopWork();
    setBoardOpen(false);
    setNoteOpen(false);
    setOpenTrolley(line.trolley);
    setOpenBoxId(line.id);
    setProbeValue(null);
  };

  const openOrderSheet = () => {
    stopWork();
    setOpenTrolley(null);
    setOpenBoxId(null);
    setNoteOpen(false);
    setBoardOpen(true);
  };

  const showRadio = () => {
    stopWork();
    setOpenTrolley(null);
    setOpenBoxId(null);
    setBoardOpen(false);
    setNoteOpen(false);
  };

  const closeTrolley = () => {
    kitchenAudio.play('doorClose');
    setOpenTrolley(null);
    setOpenBoxId(null);
    stopWork();
  };

  const handleCount = (line: OrderLine) => {
    kitchenAudio.play(line.unit === 'kg' ? 'scale' : 'tap');
    setCountingId(line.id);
    advanceClock(1);
    if (countTimer.current) clearTimeout(countTimer.current);
    countTimer.current = setTimeout(() => {
      setCountingId(null);
      onCountSettled(line.id);
    }, 1500);
  };

  const handleProbe = (line: OrderLine) => {
    if (line.actualC === undefined) return;
    kitchenAudio.play('tap');
    setProbingId(line.id);
    setProbeValue(null);
    if (probeTimer.current) clearInterval(probeTimer.current);
    let ticks = 0;
    probeTimer.current = setInterval(() => {
      ticks += 1;
      const wiggle = line.actualC! + (Math.random() * 4 - 2) * Math.exp(-ticks / 5);
      setProbeValue(wiggle);
      if (ticks > 15) {
        if (probeTimer.current) clearInterval(probeTimer.current);
        probeTimer.current = null;
        setProbeValue(line.actualC!);
        setProbingId(null);
        kitchenAudio.play('probe');
        onProbeSettled(line.id);
        advanceClock(2);
      }
    }, 100);
  };

  const shortLine = ORDER_LINES.find((line) => line.id === SHORT_LINE_ID)!;
  // The "Next" strip follows the same rules the job card ticks use, so it never
  // says "all done" while a count, a temperature or a status is still wrong.
  const evaluation = evaluateDelivery(state);
  const met = (id: string) => evaluation.checklist.find((item) => item.id === id)?.met ?? false;
  const fishLooked = FISH_CHECKS.every((check) => state.fishChecks[check.id]);
  const allBoxesChecked = fishLooked && ORDER_LINES.every((line) => lineIsChecked(line, state.lines[line.id]));
  const orderSheetRight = met('lines') && met('temps');
  const discoveredShort = parseNumber(state.lines[SHORT_LINE_ID]?.arrived ?? '') === shortLine.arrived;

  const nextStep = !noteOpened
    ? SCENE_LABELS.next.note
    : !allBoxesChecked
      ? SCENE_LABELS.next.boxes
      : !orderSheetRight
        ? SCENE_LABELS.next.sheet
        : !state.radioedMarcus
          ? SCENE_LABELS.next.radio
          : !met('note')
            ? SCENE_LABELS.next.sign
            : SCENE_LABELS.next.done;

  const trolleyTitle = openTrolley
    ? SCENE_LABELS.trolleys[openTrolley as keyof typeof SCENE_LABELS.trolleys]
    : SCENE_LABELS.trolleys[1];

  return (
    <div className="absolute inset-0 z-0 bg-zinc-950">
      {ORDER_LINES.map((line) => (
        <GuideAction
          key={line.id}
          action={`delivery:box:${line.id}`}
          open={() => openBoxWorkspace(line)}
        />
      ))}
      <GuideAction action="delivery:order-sheet" open={openOrderSheet} />
      <GuideAction action="delivery:radio" open={showRadio} />
      <GuideAction action="delivery:note" open={openDeliveryNote} />
      {/* The yard stays put while the trolleys scroll on a phone (no position: fixed here: the stage is transformed) */}
      <img
        src={PLACES['goods-in'].backdrop}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/75 pointer-events-none" />

      {/* Right padding on desktop keeps the trolleys clear of the HUD buttons */}
      <div className="absolute inset-0 overflow-y-auto px-4 pb-40 pt-5 sm:px-6 md:overflow-hidden md:pl-8 md:pr-24 md:pb-28 md:pt-7">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:h-[calc(100vh-9rem)]">
          <div className="mr-20 rounded-lg border border-white/10 bg-black/65 px-4 py-2 text-sm text-white shadow-lg md:ml-[27%] md:mr-0">
            <span className="font-bold">Next:</span> {nextStep}
          </div>

          <div className="grid flex-1 gap-4 md:min-h-0 md:grid-cols-[25%_1fr]">
            <section className="relative min-h-[280px] overflow-hidden rounded-xl border border-white/10 bg-black/45 md:min-h-0">
              <img
                src={driver.portrait!}
                alt="Delivery driver"
                className="absolute bottom-0 left-0 h-[94%] max-w-full object-contain object-left-bottom drop-shadow-2xl"
              />
              <button
                type="button"
                onClick={openDeliveryNote}
                className="absolute right-20 top-1/3 max-w-[150px] rotate-2 border border-zinc-200 bg-[#fffdf8] px-4 py-3 text-left text-sm font-bold text-black shadow-2xl transition-transform hover:rotate-0 hover:scale-105 outline-none focus-visible:ring-4 focus-visible:ring-primary sm:right-3"
              >
                {noteOpened ? SCENE_LABELS.readDeliveryNote : SCENE_LABELS.takeDeliveryNote}
              </button>
            </section>

            <div className="grid gap-4 md:min-h-0 md:grid-rows-[auto_1fr]">
              <div className="grid gap-4 md:order-last md:min-h-0 md:grid-cols-3">
                {([1, 2, 3] as const).map((trolley) => {
                  const lines = ORDER_LINES.filter((line) => line.trolley === trolley);
                  const checked = lines.filter((line) => lineIsChecked(line, state.lines[line.id])).length;
                  const done = checked === lines.length;
                  return (
                    <button
                      type="button"
                      key={trolley}
                      onClick={() => openTrolleyCard(trolley)}
                      className="group flex min-h-[220px] flex-col rounded-xl border border-white/15 bg-zinc-900/95 p-4 text-left text-white shadow-2xl transition-transform hover:-translate-y-1 outline-none focus-visible:ring-4 focus-visible:ring-primary md:min-h-0"
                      aria-label={`Open ${SCENE_LABELS.trolleys[trolley]}`}
                    >
                      <span className="flex items-start justify-between gap-2 font-bold">
                        {SCENE_LABELS.trolleys[trolley]}
                        {done && <Check className="h-5 w-5 shrink-0 text-emerald-400" />}
                      </span>
                      <span className="mt-2 text-xs text-zinc-400">
                        {done ? SCENE_LABELS.allChecked : `${checked} of ${lines.length} checked`}
                      </span>
                      <span className="mt-4 grid flex-1 grid-cols-2 gap-2">
                        {lines.map((line) => (
                          <span key={line.id} className="relative aspect-square overflow-hidden rounded-md bg-black">
                            <img src={CRATE_IMAGES[line.id]} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                            {lineIsChecked(line, state.lines[line.id]) && (
                              <span className="absolute right-1 top-1 rounded-full bg-emerald-500 p-1 text-white">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  kitchenAudio.play('page');
                   openOrderSheet();
                }}
                className="flex min-h-20 items-center gap-4 rounded-xl border border-zinc-300 bg-[#f3eee5] px-5 py-3 text-left text-black shadow-xl transition-transform hover:-translate-y-1 outline-none focus-visible:ring-4 focus-visible:ring-primary md:order-first"
              >
                <ClipboardList className="h-9 w-9 text-primary" />
                <span>
                  <span className="block font-bold">
                    {orderSheetRight ? SCENE_LABELS.orderSheet : SCENE_LABELS.checkOrderSheet}
                  </span>
                  <span className="block text-xs text-zinc-600">Receiving bench</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {discoveredShort && !state.radioedMarcus && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute bottom-24 right-5 z-20 sm:right-10"
          >
            <button
              type="button"
              onClick={onRadioMarcus}
              className="flex items-center gap-3 rounded-xl border-2 border-primary bg-zinc-950 px-4 py-3 font-bold text-white shadow-2xl transition-transform hover:-translate-y-1 outline-none focus-visible:ring-4 focus-visible:ring-primary"
            >
              <Radio className="h-6 w-6 text-primary" />
              {SCENE_LABELS.radioMarcus}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CloseUp
        isOpen={openTrolley !== null}
        onClose={closeTrolley}
        title={trolleyTitle}
        className="mx-auto h-[82vh] max-w-5xl"
      >
        <div className="h-full overflow-y-auto rounded-xl bg-zinc-950 text-white shadow-2xl">
          {openTrolley && !openBoxId && (
            <div className="p-5 sm:p-7">
              <h2 className="pr-10 text-2xl font-bold">{trolleyTitle}</h2>
              <p className="mt-1 text-sm text-zinc-400">Choose a box to check</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ORDER_LINES.filter((line) => line.trolley === openTrolley).map((line) => {
                  const checked = lineIsChecked(line, state.lines[line.id]);
                  return (
                    <button
                      type="button"
                      key={line.id}
                      onClick={() => {
                        kitchenAudio.play('door');
                        setOpenBoxId(line.id);
                        setProbeValue(null);
                      }}
                      className="relative overflow-hidden rounded-xl border border-white/15 bg-zinc-900 text-left shadow-lg transition-transform hover:-translate-y-1 outline-none focus-visible:ring-4 focus-visible:ring-primary"
                      aria-label={`Check ${line.item}`}
                    >
                      <img src={CRATE_IMAGES[line.id]} alt="" className="aspect-[4/3] w-full object-cover" />
                      <span className="block p-4">
                        <span className="block font-bold">{line.item}</span>
                        <span className="mt-1 block text-sm text-zinc-400">Ordered: {line.ordered} {line.unit}</span>
                      </span>
                      {checked && (
                        <span className="absolute right-3 top-3 rounded-full bg-emerald-500 p-2 text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {openBoxId && (() => {
            const line = ORDER_LINES.find((item) => item.id === openBoxId)!;
            const row = state.lines[line.id] || { counted: false, arrived: '', probed: false };
            const qtyNote = notebook.entryFor('qtyFor', line.id);
            const tempNote = notebook.entryFor('tempFor', line.id);
            const isFish = line.trolley === 1;
            return (
              <div className="p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => {
                    kitchenAudio.play('tap');
                    setOpenBoxId(null);
                    stopWork();
                  }}
                  className="mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-white hover:bg-white/10 outline-none focus-visible:ring-4 focus-visible:ring-primary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {SCENE_LABELS.backToTrolley}
                </button>

                <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
                  <div>
                    <img
                      src={CRATE_IMAGES[line.id]}
                      alt={line.item}
                      className="aspect-[4/3] w-full rounded-xl object-cover shadow-xl"
                    />
                    {isFish && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {FISH_CHECKS.map((check) => {
                          const checked = state.fishChecks[check.id];
                          const action = {
                            eyes: 'Look at the eyes',
                            gills: 'Check the gills',
                            smell: 'Smell it',
                            flesh: 'Press the flesh'
                          }[check.id];
                          return (
                            <button
                              type="button"
                              key={check.id}
                              onClick={() => {
                                kitchenAudio.play('tap');
                                onFishCheck(check.id);
                              }}
                              className={cn(
                                'rounded-lg border p-3 text-left text-sm outline-none focus-visible:ring-4 focus-visible:ring-primary',
                                checked
                                  ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-50'
                                  : 'border-white/20 bg-zinc-900 text-white hover:bg-zinc-800'
                              )}
                            >
                              <span className="flex items-center justify-between gap-2 font-bold">
                                {action}
                                {checked && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                              </span>
                              {checked && <span className="mt-1 block text-xs leading-relaxed text-emerald-100/80">{check.whatYouFind}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
                    <h2 className="text-xl font-bold text-white">{line.item}</h2>
                    <p className="mt-1 text-sm text-zinc-300">Ordered: {line.ordered} {line.unit}</p>

                    <div className="mt-6 space-y-5">
                      <div className="rounded-lg bg-black/45 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold">{line.unit === 'kg' ? 'Weight' : 'Count'}</span>
                          <span className="font-mono text-xl font-bold text-amber-400">
                            {countingId === line.id ? '—' : row.counted ? `${line.arrived} ${line.unit}` : 'Not checked'}
                          </span>
                        </div>
                        <div className="mt-3">
                          {!row.counted ? (
                            <button
                              type="button"
                              onClick={() => handleCount(line)}
                              disabled={countingId === line.id}
                              className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 font-bold text-black hover:bg-zinc-200 disabled:opacity-50 outline-none focus-visible:ring-4 focus-visible:ring-primary"
                            >
                              <Scale className="h-4 w-4" />
                              {line.unit === 'kg' ? SCENE_LABELS.weigh : SCENE_LABELS.count}
                            </button>
                          ) : qtyNote ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <Check className="h-4 w-4 text-emerald-400" />
                              {SCENE_LABELS.inNotebook}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                kitchenAudio.play('write');
                                jot({
                                  taskId: 'check-the-delivery-in',
                                  label: line.item,
                                  value: `${line.arrived}`,
                                  ref: { qtyFor: line.id }
                                });
                              }}
                              className="w-full rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 outline-none focus-visible:ring-4 focus-visible:ring-white"
                            >
                              {SCENE_LABELS.writeInNotebook}
                            </button>
                          )}
                        </div>
                      </div>

                      {line.chilled && (
                        <div className="rounded-lg bg-black/45 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="font-bold">Temperature</span>
                            {row.probed && <Check className="h-5 w-5 text-emerald-400" />}
                          </div>

                          <div className="flex justify-center mb-4">
                            <AnalogueThermometer
                              value={probingId === line.id && probeValue !== null ? probeValue : row.probed ? line.actualC ?? null : null}
                              className="w-32 h-36"
                              clip={false}
                            />
                          </div>

                          <div className="mt-3">
                            {!row.probed ? (
                              <button
                                type="button"
                                onClick={() => handleProbe(line)}
                                disabled={probingId === line.id}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 font-bold text-black hover:bg-zinc-200 disabled:opacity-50 outline-none focus-visible:ring-4 focus-visible:ring-primary"
                              >
                                <Thermometer className="h-4 w-4" />
                                {SCENE_LABELS.takeTemperature}
                              </button>
                            ) : tempNote ? (
                              <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Check className="h-4 w-4 text-emerald-400" />
                                {SCENE_LABELS.inNotebook}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  kitchenAudio.play('write');
                                  jot({
                                    taskId: 'check-the-delivery-in',
                                    label: `${line.item} temperature`,
                                    value: `${line.actualC?.toFixed(1)} °C`,
                                    ref: { tempFor: line.id }
                                  });
                                }}
                                className="w-full rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 outline-none focus-visible:ring-4 focus-visible:ring-white"
                              >
                                {SCENE_LABELS.writeInNotebook}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </CloseUp>

      <CloseUp isOpen={boardOpen} onClose={() => setBoardOpen(false)} title={SCENE_LABELS.orderSheet} className="mx-auto max-w-5xl">
        <Clipboard>
          <div className="p-4 font-sans text-black sm:p-6 md:p-8">
            <div className="mb-5 border-b-4 border-black pb-4">
              <h2 className="text-2xl font-black sm:text-3xl">{SCENE_LABELS.deliveryCheckSheet}</h2>
              <p className="mt-1 text-sm font-bold text-zinc-600 sm:text-base">{SCENE_LABELS.supplierLine}</p>
            </div>

            <table className="kitchen-table hidden w-full text-sm md:table">
              <thead>
                <tr>
                  <th className="w-1/4">Item</th>
                  <th className="w-20 text-center">Ordered</th>
                  <th className="w-24 text-center">Came in</th>
                  <th className="w-24 text-center">Temp °C</th>
                  <th className="w-48 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {ORDER_LINES.map((line) => (
                  <OrderSheetRow
                    key={line.id}
                    line={line}
                    row={state.lines[line.id] || {}}
                    quantityNote={notebook.entryFor('qtyFor', line.id)}
                    temperatureNote={notebook.entryFor('tempFor', line.id)}
                    onLineInput={onLineInput}
                    onLineStatus={onLineStatus}
                  />
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col gap-4 text-sm md:hidden">
              {ORDER_LINES.map((line) => (
                <OrderSheetCard
                  key={line.id}
                  line={line}
                  row={state.lines[line.id] || {}}
                  quantityNote={notebook.entryFor('qtyFor', line.id)}
                  temperatureNote={notebook.entryFor('tempFor', line.id)}
                  onLineInput={onLineInput}
                  onLineStatus={onLineStatus}
                />
              ))}
            </div>
          </div>
        </Clipboard>
      </CloseUp>

      <CloseUp isOpen={noteOpen} onClose={() => setNoteOpen(false)} title={SCENE_LABELS.deliveryNote} className="mx-auto max-w-xl">
        <Sheet>
          <div className="space-y-6 bg-[#fffdf8] p-6 font-mono text-sm text-black sm:p-8">
            <div className="flex flex-col gap-2 border-b-2 border-black pb-4 sm:flex-row sm:justify-between">
              <div>
                <div className="text-lg font-bold uppercase sm:text-xl">Exmouth Fish Suppliers</div>
                <div className="text-zinc-600">Delivery note #49281</div>
              </div>
              <div className="text-zinc-600 sm:text-right">
                <div>Account: MAR-EXETER</div>
                <div>Date: Today</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-black pb-2 text-xs font-bold uppercase tracking-widest">
                <span>Description</span>
                <span>Qty</span>
              </div>
              {ORDER_LINES.filter((line) => line.trolley === shortLine.trolley && line.id !== SHORT_LINE_ID).map((line) => (
                <div key={line.id} className="flex justify-between border-b border-zinc-200 py-2">
                  <span>{line.item}</span>
                  <span>{line.onDeliveryNote} {line.unit}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-b border-zinc-400 bg-red-50/50 px-2 py-2">
                <span className="font-bold">{shortLine.item}</span>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className={cn(parseNumber(state.noteAmendedTo) === shortLine.arrived && 'text-zinc-400 line-through')}>{shortLine.onDeliveryNote} {shortLine.unit}</span>
                  <Input
                    value={state.noteAmendedTo}
                    onChange={(event) => onNoteAmended(event.target.value)}
                    disabled={!state.radioedMarcus}
                    aria-label="Write the amended salmon quantity"
                    className="kitchen-input h-8 w-16 border-red-200 bg-white text-center font-bold text-red-600"
                    placeholder="-"
                    style={{ fontFamily: 'cursive' }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-end pt-8 sm:mt-12 sm:pt-12">
              <div className="mb-2 text-xs font-bold text-zinc-500">Received in good condition</div>
              {state.signed ? (
                <div className="min-w-[160px] border-b border-black px-4 py-2 text-center text-2xl text-blue-800 sm:min-w-[200px] sm:px-8 sm:text-3xl" style={{ fontFamily: 'cursive' }}>
                  {state.signature}
                </div>
              ) : (
                <Button
                  onClick={() => {
                    kitchenAudio.play('write');
                    onSign();
                  }}
                  disabled={!state.radioedMarcus}
                  variant="outline"
                  className="h-11 w-48 rounded-none border-2 border-black font-bold text-black hover:bg-black hover:text-white"
                >
                  {SCENE_LABELS.signNote}
                </Button>
              )}
            </div>
          </div>
        </Sheet>
      </CloseUp>
    </div>
  );
}

function StatusButtons({ line, row, onLineStatus }: { line: OrderLine; row: any; onLineStatus: any }) {
  return (
    <div className="flex overflow-hidden rounded-sm border border-border bg-muted">
      {(['arrived', 'short', 'refused'] as LineStatus[]).map((status) => (
        <button
          type="button"
          key={status}
          onClick={() => {
            kitchenAudio.play('tap');
            onLineStatus(line.id, status);
          }}
          className={cn(
            'flex-1 px-1 py-2 text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary',
            row.status === status
              ? status === 'arrived'
                ? 'bg-brand-green/20 text-brand-green'
                : status === 'short'
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-destructive text-destructive-foreground'
              : 'text-zinc-500 hover:bg-zinc-200'
          )}
        >
          {SCENE_LABELS.status[status]}
        </button>
      ))}
    </div>
  );
}

function NoteField({
  line,
  row,
  field,
  note,
  onLineInput
}: {
  line: OrderLine;
  row: any;
  field: 'arrived' | 'temperature';
  note: any;
  onLineInput: any;
}) {
  const value = row[field] || '';
  const disabled = field === 'temperature' && !row.probed;
  const label = field === 'arrived' ? `Came in for ${line.item}` : `Temperature for ${line.item}`;
  return (
    <div className="flex flex-col items-center gap-1">
      <Input
        value={value}
        onChange={(event) => onLineInput(line.id, field, event.target.value)}
        disabled={disabled}
        aria-label={label}
        className={cn('kitchen-input w-full text-center text-lg', disabled && 'opacity-30')}
        placeholder="-"
        style={{ fontFamily: 'cursive' }}
      />
      {note && value === '' && (
        <button
          type="button"
          onClick={() => {
            kitchenAudio.play('write');
            onLineInput(line.id, field, field === 'temperature' ? note.value.replace(' °C', '') : note.value);
          }}
          className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {SCENE_LABELS.useMyNote}
        </button>
      )}
    </div>
  );
}

function OrderSheetRow({ line, row, quantityNote, temperatureNote, onLineInput, onLineStatus }: any) {
  return (
    <tr className={cn(row.status === 'short' && 'bg-red-50')}>
      <td className="px-2 py-3 font-medium">
        {line.item}
        <div className="text-[10px] text-zinc-500">Trolley {line.trolley}</div>
      </td>
      <td className="px-2 py-3 text-center font-mono text-zinc-500">{line.ordered} {line.unit}</td>
      <td className="px-2 py-3"><NoteField line={line} row={row} field="arrived" note={quantityNote} onLineInput={onLineInput} /></td>
      <td className="px-2 py-3 text-center">
        {line.chilled
          ? <NoteField line={line} row={row} field="temperature" note={temperatureNote} onLineInput={onLineInput} />
          : <span className="text-zinc-400">—</span>}
      </td>
      <td className="px-2 py-3"><StatusButtons line={line} row={row} onLineStatus={onLineStatus} /></td>
    </tr>
  );
}

function OrderSheetCard({ line, row, quantityNote, temperatureNote, onLineInput, onLineStatus }: any) {
  return (
    <div className={cn('flex flex-col gap-3 rounded border border-zinc-200 p-4 shadow-sm', row.status === 'short' ? 'bg-red-50' : 'bg-white')}>
      <div>
        <div className="font-bold">{line.item}</div>
        <div className="text-xs text-zinc-500">Trolley {line.trolley} · Ordered: {line.ordered} {line.unit}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-zinc-500">Came in</label>
          <NoteField line={line} row={row} field="arrived" note={quantityNote} onLineInput={onLineInput} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-zinc-500">Temp °C</label>
          {line.chilled
            ? <NoteField line={line} row={row} field="temperature" note={temperatureNote} onLineInput={onLineInput} />
            : <div className="flex h-10 items-center px-2 text-zinc-400">—</div>}
        </div>
      </div>
      <div>
        <div className="mb-1 text-xs font-bold text-zinc-500">Status</div>
        <StatusButtons line={line} row={row} onLineStatus={onLineStatus} />
      </div>
    </div>
  );
}