import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { DELIVERY_REDESIGN_COPY } from '@/content/scenes/delivery-redesign';
import { DELIVERY_PHOTOS } from '@/content/delivery-photos';
import { FISH_CHECKS, ORDER_LINES, READING_TOLERANCE_C } from '@/content/activities';
import { useProgress } from '@/lib/progress-store';
import { parseNumber, within } from '@/lib/simulation';
import { kitchenAudio } from '@/lib/audio';
import { useKitchenAction } from '@/components/kitchen/kitchen-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClipboardList, ArrowLeft, Radio, CheckCircle2 } from 'lucide-react';
import { AnalogueThermometer } from '../../kitchen/analogue-thermometer';
import { DeliveryItemPhoto } from './delivery-item-photo';

type OrderLine = (typeof ORDER_LINES)[number];

function GuideAction({ action, open }: { action: string; open: () => void }) {
  useKitchenAction(action, open);
  return null;
}

export function GoodsInSceneRedesign({
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
  const { updateTask } = useProgress();
  const redesign = state.redesign!;
  const firstArrivalRef = useRef(false);

  useEffect(() => {
    if (!firstArrivalRef.current) {
      firstArrivalRef.current = true;
      onFirstArrival();
    }
  }, [onFirstArrival]);

  const [openTrolley, setOpenTrolley] = useState<number | null>(null);
  const [openBoxId, setOpenBoxId] = useState<string | null>(null);
  const [countingId, setCountingId] = useState<string | null>(null);
  const [probingId, setProbingId] = useState<string | null>(null);
  const [probeValue, setProbeValue] = useState<number | null>(null);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const inspectorHeadingRef = useRef<HTMLHeadingElement>(null);
  const sheetHeadingRef = useRef<HTMLHeadingElement>(null);
  const reportHeadingRef = useRef<HTMLHeadingElement>(null);
  const amendmentHeadingRef = useRef<HTMLHeadingElement>(null);
  const initiatingButtonRef = useRef<HTMLButtonElement | null>(null);
  
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopWork = useCallback(() => {
    if (countTimer.current) clearTimeout(countTimer.current);
    if (probeTimer.current) clearInterval(probeTimer.current);
    countTimer.current = null;
    probeTimer.current = null;
    setCountingId(null);
    setProbingId(null);
  }, []);

  useEffect(() => stopWork, [stopWork]);

  const openBox = (line: OrderLine) => {
    stopWork();
    setOpenTrolley(line.trolley);
    setOpenBoxId(line.id);
    setMobileInspectorOpen(true);
    setProbeValue(null);
    requestAnimationFrame(() => inspectorHeadingRef.current?.focus());
  };

  const openBoxFrom = (line: OrderLine, button?: HTMLButtonElement | null) => {
    initiatingButtonRef.current = button ?? null;
    openBox(line);
  };

  const backToSheet = () => {
    stopWork();
    setMobileInspectorOpen(false);
    requestAnimationFrame(() => (initiatingButtonRef.current ?? sheetHeadingRef.current)?.focus());
  };

  const openReport = () => {
    setMobileInspectorOpen(false);
    requestAnimationFrame(() => {
      reportHeadingRef.current?.scrollIntoView({ block: 'center' });
      reportHeadingRef.current?.focus();
    });
  };

  const openAmendment = () => {
    setMobileInspectorOpen(false);
    requestAnimationFrame(() => {
      amendmentHeadingRef.current?.scrollIntoView({ block: 'center' });
      amendmentHeadingRef.current?.focus();
    });
  };

  const handleWeigh = (line: OrderLine) => {
    kitchenAudio.play('door');
    setCountingId(line.id);
    countTimer.current = setTimeout(() => {
      setCountingId(null);
      onCountSettled(line.id);
      setAnnouncement(`${line.item}: scales settled at ${line.arrived} ${line.unit}. Enter the amount you measured.`);
    }, 1500);
  };

  const handleProbe = (line: OrderLine) => {
    kitchenAudio.play('tap');
    setProbingId(line.id);
    setProbeValue(12.5); // start high
    
    let ticks = 0;
    probeTimer.current = setInterval(() => {
      ticks++;
      if (ticks >= 5) {
        clearInterval(probeTimer.current!);
        setProbingId(null);
        setProbeValue(line.actualC || 0);
        onProbeSettled(line.id);
        setAnnouncement(`${line.item}: temperature settled at ${line.actualC?.toFixed(1)} degrees Celsius. Enter the reading you measured.`);
        kitchenAudio.play('write');
      } else {
        setProbeValue(prev => prev !== null ? prev - ((prev - (line.actualC || 0)) * 0.4) : null);
      }
    }, 400);
  };

  const handleAcceptance = (id: string, decision: 'accept' | 'refuse') => {
    updateTask("check-the-delivery-in", (prev: any) => ({
      ...prev,
      signed: false,
      redesign: {
        ...prev.redesign,
        reportSent: false,
        accepted: { ...prev.redesign.accepted, [id]: decision }
      }
    }));
  };

  // derived state for checks
  const linesByTrolley = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [] } as Record<number, OrderLine[]>;
    ORDER_LINES.forEach(l => groups[l.trolley].push(l));
    return groups;
  }, []);

  const getRowState = (id: string) => state.lines[id] || { counted: false, arrived: '', probed: false, temperature: '', status: null };

  const activeLine = openBoxId ? ORDER_LINES.find(l => l.id === openBoxId) : null;
  const activeRow = activeLine ? getRowState(activeLine.id) : null;
  const activePhoto = activeLine ? DELIVERY_PHOTOS[activeLine.id] : null;

  const salmonRow = getRowState('salmon');
  const salmonMeasured = salmonRow.counted && parseNumber(salmonRow.arrived) === 8 && salmonRow.probed && (parseNumber(salmonRow.temperature) ?? Infinity) <= 5;
  const salmonStatusAccepted = salmonRow.status === 'short' && redesign?.accepted?.['salmon'] === 'accept';
  const shortageValid = parseNumber(redesign?.missingQuantity) === 4;
  
  // Can only send report if salmon is properly measured, status chosen, and own valid shortage is entered
  const canSendReport = salmonMeasured && salmonStatusAccepted && shortageValid && (redesign?.report || '').trim().length > 5;

  const allCountedAndFilled = ORDER_LINES.every((line) => {
    const row = getRowState(line.id);
    return row.counted && parseNumber(row.arrived) === line.arrived;
  });
  
  const allProbedAndFilled = ORDER_LINES.filter(l => l.chilled).every((line) => {
    const row = getRowState(line.id);
    return row.probed && within(row.temperature, line.actualC ?? 0, READING_TOLERANCE_C);
  });

  const allStatusAndAccepted = ORDER_LINES.every((line) => {
    const row = getRowState(line.id);
    return row.status === line.expectedStatus && redesign?.accepted?.[line.id] === 'accept';
  });

  const allFishChecked = ["eyes", "gills", "smell", "flesh"].every(id => state.fishChecks[id as keyof typeof state.fishChecks]);
  const fishReasonValid = (redesign?.fishReason || '').trim().length > 5;
  const validAmendment = parseNumber(state.noteAmendedTo) === 8;

  // Make note signature wait all10rows+temps+fishfinding+fishreason+report
  const canSignNote = allCountedAndFilled && allProbedAndFilled && allStatusAndAccepted && 
                      allFishChecked && fishReasonValid && redesign?.reportSent && state.radioedMarcus && validAmendment;

  // Render main layout
  return (
    <div className="absolute inset-0 z-0 bg-[#e9eded] flex flex-col md:flex-row overflow-hidden text-[#202427]">
      {ORDER_LINES.map(line => (
        <GuideAction key={line.id} action={`delivery:box:${line.id}`} open={() => openBoxFrom(line)} />
      ))}
      <GuideAction action="delivery:order-sheet" open={() => {
        setMobileInspectorOpen(false);
        setOpenBoxId(null);
        requestAnimationFrame(() => sheetHeadingRef.current?.focus());
      }} />
      <GuideAction action="delivery:radio" open={openReport} />
      <GuideAction action="delivery:note" open={openAmendment} />
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
      
      {/* Left pane: The Order Sheet */}
      <div className={cn("flex-1 md:w-3/5 border-r border-[#cdd3d5] bg-white flex-col overflow-hidden", mobileInspectorOpen ? "hidden md:flex" : "flex")}>
        <header className="p-4 border-b border-[#cdd3d5] bg-[#f1f4f4] flex justify-between items-center shrink-0">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-[#245b63] uppercase">Workspace</div>
            <h2 ref={sheetHeadingRef} tabIndex={-1} className="text-xl font-bold mt-1 outline-none">{DELIVERY_REDESIGN_COPY.sheetTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            {state.signed && <div className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Signed off</div>}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {[1, 2, 3].map(trolley => (
            <div key={trolley} className="mb-8">
              <h3 className="font-bold text-lg mb-3">Trolley {trolley}</h3>
              <div className="space-y-3 sm:hidden">
                {linesByTrolley[trolley].map(line => {
                  const row = getRowState(line.id);
                  const acceptance = redesign.accepted[line.id];
                  return (
                    <article key={line.id} className={cn("rounded border p-3", row.status === 'short' ? "border-red-300 bg-red-50" : "border-[#cdd3d5] bg-white")}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-[#202427]">{line.item}</h4>
                          <p className="text-sm text-gray-700">Ordered: {line.ordered} {line.unit} · Supplier says: {line.onDeliveryNote} {line.unit}</p>
                        </div>
                        <button
                          type="button"
                          data-testid={`delivery-select-${line.id}-mobile`}
                          onClick={event => openBoxFrom(line, event.currentTarget)}
                          className="min-h-11 shrink-0 rounded bg-[#202427] px-3 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          Inspect
                        </button>
                      </div>
                      <p className="mt-2 text-sm" role="status">
                        {row.counted ? `Entered: ${row.arrived || 'none'} ${line.unit}` : "Amount not checked"}
                        {line.chilled ? row.probed ? ` · ${row.temperature || 'none'} °C` : " · Temperature not checked" : ""}
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {row.status ? DELIVERY_REDESIGN_COPY.statusOptions[row.status as keyof typeof DELIVERY_REDESIGN_COPY.statusOptions] : DELIVERY_REDESIGN_COPY.statusNone}
                        {acceptance ? ` · ${DELIVERY_REDESIGN_COPY.acceptanceOptions[acceptance as keyof typeof DELIVERY_REDESIGN_COPY.acceptanceOptions]}` : ""}
                      </p>
                    </article>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto border border-[#cdd3d5] rounded-sm sm:block">
                 <table className="hidden w-full text-sm text-left border-collapse sm:table">
                   <caption className="sr-only">{`Trolley ${trolley} order and inspection results`}</caption>
                  <thead>
                    <tr className="bg-[#f1f4f4]">
                      <th className="border-b border-[#cdd3d5] p-3 w-1/4">{DELIVERY_REDESIGN_COPY.columns.kitchen}</th>
                      <th className="border-b border-[#cdd3d5] p-3 w-1/4">{DELIVERY_REDESIGN_COPY.columns.supplier}</th>
                      <th className="border-b border-[#cdd3d5] p-3 w-1/4">{DELIVERY_REDESIGN_COPY.columns.checked}</th>
                      <th className="border-b border-[#cdd3d5] p-3 w-1/4">{DELIVERY_REDESIGN_COPY.columns.decision}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linesByTrolley[trolley].map(line => {
                      const row = getRowState(line.id);
                      const isSelected = openBoxId === line.id;
                      const hasAccepted = redesign.accepted[line.id];
                      return (
                        <tr
                          key={line.id} 
                          className={cn(
                            "border-b border-[#cdd3d5] transition-colors motion-reduce:transition-none",
                            isSelected && "bg-blue-50",
                            row.status === 'short' && !isSelected && "bg-red-50"
                          )}
                        >
                          <th scope="row" className="p-3 align-top">
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              data-testid={`delivery-select-${line.id}`}
                              onClick={event => { event.stopPropagation(); openBoxFrom(line, event.currentTarget); }}
                              className="min-h-11 text-left font-bold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                              {line.item}
                            </button>
                            <div className="mt-1">{line.ordered} {line.unit}</div>
                          </th>
                          <td className="p-3 align-top border-l border-[#cdd3d5]">
                            <div className="text-sm">{line.onDeliveryNote} {line.unit}</div>
                            <div className="text-[11px] text-gray-500 mt-1">Note (claims)</div>
                          </td>
                          <td className="p-3 align-top border-l border-[#cdd3d5]">
                            {row.counted || (line.chilled && row.probed) ? (
                              <div className="space-y-1">
                                {row.counted && <div>{row.arrived || '?'} {line.unit}</div>}
                                {line.chilled && row.probed && <div>{row.temperature || '?'} °C</div>}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs italic">{DELIVERY_REDESIGN_COPY.inspectionNotChecked}</div>
                            )}
                          </td>
                          <td className="p-3 align-top border-l border-[#cdd3d5]">
                            {row.status || hasAccepted ? (
                              <div className="space-y-1">
                                {row.status && <div className="font-bold">{DELIVERY_REDESIGN_COPY.statusOptions[row.status as keyof typeof DELIVERY_REDESIGN_COPY.statusOptions]}</div>}
                                {hasAccepted && <div className="text-xs text-[#245b63]">Acceptance: {hasAccepted}</div>}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs italic">{DELIVERY_REDESIGN_COPY.statusNone}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {/* Discrepancy Report & Note Correction Section */}
          <div className="mt-8 border-t-2 border-[#245b63] pt-6">
            <h3 className="font-bold text-lg mb-4 text-[#245b63]">Final steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Report Panel */}
              <div className="border border-[#cdd3d5] bg-[#f1f4f4] p-4 rounded-sm">
                 <h4 ref={reportHeadingRef} tabIndex={-1} className="font-bold mb-2 flex items-center gap-2 outline-none">
                  <Radio size={16} /> 
                  Report to Terence
                </h4>
                
                {/* Disclosure gate: Only allow report fields if salmon is fully measured */}
                {salmonMeasured ? (
                  <div className="space-y-4 text-sm mt-4">
                    <div>
                       <label htmlFor="delivery-missing-quantity" className="block text-xs font-bold mb-1">{DELIVERY_REDESIGN_COPY.report.missingQuantityLabel}</label>
                      <Input 
                         id="delivery-missing-quantity"
                         inputMode="decimal"
                        value={redesign.missingQuantity || ''}
                        onChange={(e) => updateTask("check-the-delivery-in", (p:any) => ({ ...p, signed: false, redesign: { ...p.redesign, reportSent: false, missingQuantity: e.target.value } }))}
                        placeholder="e.g. 4"
                        className="bg-white"
                        disabled={redesign.reportSent || state.signed}
                         aria-describedby="delivery-missing-help"
                      />
                       <p id="delivery-missing-help" className="mt-1 text-xs text-gray-600">Work this out from the ordered and checked amounts.</p>
                    </div>

                    {shortageValid && (
                      <div className="bg-white p-3 border-l-4 border-blue-500 shadow-sm text-sm">
                        <div className="font-bold text-xs uppercase text-blue-800 mb-1">{DELIVERY_REDESIGN_COPY.complicationReveal.title}</div>
                        {DELIVERY_REDESIGN_COPY.complicationReveal.text}
                      </div>
                    )}

                    <div>
                       <label htmlFor="delivery-report-message" className="block text-xs font-bold mb-1">{DELIVERY_REDESIGN_COPY.report.messageTitle}</label>
                      <textarea 
                         id="delivery-report-message"
                        value={redesign.report || ''}
                        onChange={(e) => updateTask("check-the-delivery-in", (p:any) => ({ ...p, signed: false, redesign: { ...p.redesign, reportSent: false, report: e.target.value } }))}
                        placeholder={DELIVERY_REDESIGN_COPY.report.messagePlaceholder}
                        className="w-full bg-white border border-[#cdd3d5] p-2 rounded-sm resize-none"
                        rows={3}
                        disabled={redesign.reportSent || state.signed}
                      />
                    </div>
                    
                    {!redesign.reportSent ? (
                      <>
                      <Button 
                        onClick={() => {
                          onRadioMarcus();
                          updateTask("check-the-delivery-in", (p:any) => ({ ...p, redesign: { ...p.redesign, reportSent: true } }));
                        }}
                        disabled={!canSendReport || state.signed}
                        aria-describedby="delivery-report-requirements"
                        className="w-full bg-[#245b63] hover:bg-[#1a434a] text-white disabled:opacity-50"
                      >
                        {DELIVERY_REDESIGN_COPY.report.sendAction}
                      </Button>
                      {!canSendReport && (
                        <p id="delivery-report-requirements" className="text-xs font-medium text-amber-800" role="status">
                          Enter the checked salmon amount and temperature, choose Short and Accept, calculate the missing amount, then write your message.
                        </p>
                      )}
                      </>
                    ) : (
                      <div className="text-green-700 font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} /> Report sent
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic mt-2">
                    Inspect the discrepancy (count and probe the salmon) to prepare your report.
                  </div>
                )}
              </div>

              {/* Note Correction Panel */}
              <div className="border border-[#cdd3d5] p-4 rounded-sm bg-white">
                 <h4 ref={amendmentHeadingRef} tabIndex={-1} className="font-bold mb-2 outline-none">Exmouth Fish note correction</h4>
                {redesign.reportSent ? (
                  <div className="space-y-4 mt-4 text-sm">
                    <p className="text-gray-600">{DELIVERY_REDESIGN_COPY.amendment.instruction}</p>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50 rounded">
                      <div>
                        <div className="font-bold">Salmon fillet</div>
                        <div className="line-through text-gray-500">12 kg claimed</div>
                      </div>
                      <div>
                        <Input 
                           id="delivery-amended-salmon"
                           aria-label="Accepted salmon amount in kilograms"
                           inputMode="decimal"
                          value={state.noteAmendedTo || ''}
                          onChange={(e) => {
                            onNoteAmended(e.target.value);
                            updateTask("check-the-delivery-in", (p:any) => ({ ...p, signed: false }));
                          }}
                          placeholder="Accepted amount"
                          className="w-32 text-center"
                          disabled={state.signed}
                        />
                      </div>
                    </div>

                    {!state.signed ? (
                      <>
                      <Button 
                        onClick={onSign}
                        disabled={!canSignNote}
                        aria-describedby="delivery-sign-requirements"
                        className="w-full"
                        variant="default"
                      >
                        Sign the delivery note
                      </Button>
                      {!canSignNote && (
                        <p id="delivery-sign-requirements" className="text-xs font-medium text-amber-800" role="status">
                          Finish every measured entry and decision, explain the fish findings, send the report and correct the accepted salmon amount before signing.
                        </p>
                      )}
                      </>
                    ) : (
                      <div className="text-green-700 font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} /> Signed off
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic mt-2">
                    Complete your report to Terence first.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* Right pane: Inspection Area */}
      <div className={cn("min-h-0 min-w-0 flex-1 md:w-2/5 bg-[#202427] text-white flex-col relative", mobileInspectorOpen ? "flex" : "hidden md:flex")}>
        {activeLine && activeRow ? (
          <>
            <header className="p-4 border-b border-gray-700 bg-gray-900 shrink-0">
              <button type="button" onClick={backToSheet} className="mb-2 flex min-h-11 items-center gap-2 rounded px-2 font-bold md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <ArrowLeft className="h-4 w-4" /> Back to sheet
              </button>
              <h2 ref={inspectorHeadingRef} tabIndex={-1} className="text-lg font-bold text-white outline-none">{DELIVERY_REDESIGN_COPY.inspectionTitle(activeLine.item)}</h2>
              <div className="text-sm text-gray-400 mt-1">Trolley {activeLine.trolley}</div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
               {activePhoto && <DeliveryItemPhoto key={activeLine.id} photo={activePhoto} />}
              
              {/* Evidence controls */}
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <h3 className="font-bold mb-3 text-gray-300 uppercase text-xs tracking-wider">Evidence</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => handleWeigh(activeLine)}
                      disabled={countingId === activeLine.id || activeRow.counted || state.signed}
                      className="w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:text-white"
                    >
                       {countingId === activeLine.id ? "Measuring…" : activeLine.unit === 'kg' ? "Weigh it" : "Count them"}
                    </Button>
                  </div>
                  {activeLine.chilled && (
                    <div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleProbe(activeLine)}
                        disabled={probingId === activeLine.id || activeRow.probed || state.signed}
                        className="w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:text-white"
                      >
                       {probingId === activeLine.id ? "Taking temperature…" : "Take the temperature"}
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Visual feedback for thermometer */}
                {probingId === activeLine.id && probeValue !== null && (
                  <div className="mt-4 flex justify-center">
                    <AnalogueThermometer value={probeValue} />
                  </div>
                )}
                {activeRow.counted && (
                  <p className="mt-4 rounded bg-black/40 p-3 font-bold text-amber-300" role="status">
                    Measured amount: {activeLine.arrived} {activeLine.unit}
                  </p>
                )}
                {activeLine.chilled && activeRow.probed && (
                  <p className="mt-2 rounded bg-black/40 p-3 font-bold text-amber-300" role="status">
                    Measured temperature: {activeLine.actualC?.toFixed(1)} °C
                  </p>
                )}
              </div>

              {/* Data Entry Fields */}
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                 <h3 className="font-bold mb-3 text-white text-sm">Your entries</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label htmlFor={`delivery-quantity-${activeLine.id}`} className="block text-sm text-gray-200 mb-1">Quantity ({activeLine.unit})</label>
                    <Input 
                       id={`delivery-quantity-${activeLine.id}`}
                       inputMode="decimal"
                      value={activeRow.arrived || ''}
                      onChange={(e) => onLineInput(activeLine.id, 'arrived', e.target.value)}
                      disabled={!activeRow.counted || state.signed}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="-"
                    />
                     {activeRow.arrived.trim() !== '' && (
                       <p className={cn("mt-1 text-xs font-bold", parseNumber(activeRow.arrived) === activeLine.arrived ? "text-emerald-300" : "text-amber-300")} role="status">
                         {parseNumber(activeRow.arrived) === activeLine.arrived ? "Matches your measured amount." : "This does not match your measured amount."}
                       </p>
                     )}
                  </div>
                  {activeLine.chilled && (
                    <div>
                     <label htmlFor={`delivery-temperature-${activeLine.id}`} className="block text-sm text-gray-200 mb-1">Temperature (°C)</label>
                      <Input 
                       id={`delivery-temperature-${activeLine.id}`}
                       inputMode="decimal"
                        value={activeRow.temperature || ''}
                        onChange={(e) => onLineInput(activeLine.id, 'temperature', e.target.value)}
                        disabled={!activeRow.probed || state.signed}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="-"
                      />
                     {activeRow.temperature.trim() !== '' && (
                       <p className={cn("mt-1 text-xs font-bold", parseNumber(activeRow.temperature) === activeLine.actualC ? "text-emerald-300" : "text-amber-300")} role="status">
                         {parseNumber(activeRow.temperature) === activeLine.actualC ? "Matches your measured temperature." : "This does not match your measured temperature."}
                       </p>
                     )}
                    </div>
                  )}
                </div>

                {/* Sea bass special findings */}
                {activeLine.id === 'sea-bass' && (
                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <h3 className="font-bold mb-2 text-sm text-blue-200">Fish inspection findings</h3>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      {FISH_CHECKS.map(check => (
                        <div key={check.id} className="flex items-start gap-2 bg-gray-900 p-2 rounded">
                          <input 
                             id={`fish-check-${check.id}`}
                            type="checkbox" 
                            checked={!!state.fishChecks[check.id]}
                            onChange={() => onFishCheck(check.id)}
                            disabled={state.signed}
                            className="mt-1"
                          />
                           <div>
                             <label htmlFor={`fish-check-${check.id}`} className="font-bold text-sm text-gray-100">{check.label}</label>
                            {state.fishChecks[check.id] && <div className="text-xs text-gray-400">{check.whatYouFind}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {["eyes", "gills", "smell", "flesh"].every(id => state.fishChecks[id as any]) && (
                      <div>
                         <label htmlFor="delivery-fish-reason" className="block text-sm text-gray-200 mb-1">{DELIVERY_REDESIGN_COPY.seaBassReason}</label>
                        <textarea 
                           id="delivery-fish-reason"
                          value={redesign.fishReason || ''}
                          onChange={(e) => updateTask("check-the-delivery-in", (p:any) => ({ ...p, signed: false, redesign: { ...p.redesign, fishReason: e.target.value } }))}
                          placeholder={DELIVERY_REDESIGN_COPY.seaBassPrompt}
                          className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded-sm text-sm h-20"
                          disabled={state.signed}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Acceptance */}
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                 <h3 className="font-bold mb-3 text-white text-sm">Decisions</h3>
                
                <div className="space-y-4">
                  <div>
                     <fieldset>
                     <legend className="block text-sm text-gray-200 mb-2">Quantity status</legend>
                     <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={`Quantity status for ${activeLine.item}`}>
                      {(['arrived', 'short', 'refused'] as const).map(status => (
                        <Button
                          key={status}
                          variant="outline"
                          onClick={() => onLineStatus(activeLine.id, status)}
                           role="radio"
                           aria-checked={activeRow.status === status}
                          disabled={state.signed}
                          className={cn(
                            "flex-1 text-xs",
                            activeRow.status === status 
                              ? (status === 'short' || status === 'refused' ? "bg-amber-600 text-white border-amber-600 hover:bg-amber-700 hover:text-white" : "bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white")
                              : "bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
                          )}
                        >
                          {DELIVERY_REDESIGN_COPY.statusOptions[status]}
                        </Button>
                      ))}
                    </div>
                     {activeRow.status && (
                       <p className={cn("mt-2 text-xs font-bold", activeRow.status === activeLine.expectedStatus ? "text-emerald-300" : "text-amber-300")} role="status">
                         {activeRow.status === activeLine.expectedStatus ? "This status matches your evidence." : "Compare the checked amount with the order again."}
                       </p>
                     )}
                     </fieldset>
                  </div>

                  <div>
                     <fieldset>
                     <legend className="block text-sm text-gray-200 mb-2">Acceptance</legend>
                     <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`Acceptance decision for ${activeLine.item}`}>
                      {(['accept', 'refuse'] as const).map(decision => (
                        <Button
                          key={decision}
                          variant="outline"
                          onClick={() => handleAcceptance(activeLine.id, decision)}
                           role="radio"
                           aria-checked={redesign.accepted[activeLine.id] === decision}
                          disabled={state.signed}
                          className={cn(
                            "flex-1 text-xs",
                            redesign.accepted[activeLine.id] === decision 
                              ? (decision === 'accept' ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white" : "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white")
                              : "bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
                          )}
                        >
                          {DELIVERY_REDESIGN_COPY.acceptanceOptions[decision]}
                        </Button>
                      ))}
                    </div>
                     {redesign.accepted[activeLine.id] && (
                       <p className={cn("mt-2 text-xs font-bold", redesign.accepted[activeLine.id] === 'accept' ? "text-emerald-300" : "text-amber-300")} role="status">
                         {redesign.accepted[activeLine.id] === 'accept' ? "Accepted quantity saved." : "Refusal saved. Check the evidence and scenario guidance before moving on."}
                       </p>
                     )}
                     </fieldset>
                  </div>
                </div>

              </div>

              {/* Context Guidance Hints */}
              <div className="p-3 bg-gray-800 border-l-4 border-[#245b63] text-sm text-gray-300 rounded">
                {activeLine.id === 'salmon' && <div>{DELIVERY_REDESIGN_COPY.hints.salmonStatus}</div>}
                {activeLine.id === 'smoked-haddock' && <div>{DELIVERY_REDESIGN_COPY.hints.haddockCompare}</div>}
                {activeLine.chilled && activeLine.id !== 'salmon' && <div>{DELIVERY_REDESIGN_COPY.receivingGuidance.text}</div>}
                {!activeLine.chilled && <div>Check packaging counts match the order unit ({activeLine.unit}).</div>}
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4 p-8 text-center">
            <ClipboardList size={48} className="opacity-50" />
            <p>Select an item from the order sheet to inspect it.</p>
          </div>
        )}
      </div>

    </div>
  );
}
