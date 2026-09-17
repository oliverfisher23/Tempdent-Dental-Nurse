import { useCallback, useRef, useState } from 'react';
import {
  DragProvider,
  Gauge,
  HoldToRead,
  SignaturePad,
  type SignatureValue,
  useDraggable,
  useDropZone,
} from '@/components/kitchen/interact';
import { cn } from '@/lib/utils';

function DraggableObject({ id, kind, label, children }: { id: string; kind: string; label: string; children: React.ReactNode }) {
  const draggable = useDraggable({ id, kind, label });
  return (
    <div
      {...draggable.props}
      className={cn(
        'relative select-none rounded-lg border-2 border-border bg-background px-4 py-3 text-center font-bold shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-primary/40',
        draggable.isLifted && 'border-primary shadow-lg',
      )}
    >
      {children}
    </div>
  );
}

function PourZone({ id, onPour }: { id: string; onPour: (id: string) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const over = useCallback((itemId: string | null) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = itemId === 'ladle' ? setTimeout(() => onPour(id), 900) : null;
  }, [id, onPour]);
  const dropped = useCallback(() => onPour(id), [id, onPour]);
  const zone = useDropZone({ id, label: id === 'pour-a' ? 'Tray A' : 'Tray B', accepts: (kind) => kind === 'ladle', onDrop: dropped, onOverChange: over });
  return (
    <div
      ref={zone.ref}
      {...zone.props}
      className={cn(
        'flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 font-semibold',
        zone.canDrop && 'border-primary/50',
        (zone.isOver || zone.isTarget) && 'scale-[1.02] border-primary bg-primary/10',
      )}
    >
      {id === 'pour-a' ? 'Tray A' : 'Tray B'}
    </div>
  );
}

function ShelfZone({ index, onPlace }: { index: number; onPlace: (tray: string, shelf: number) => void }) {
  const drop = useCallback((tray: string) => onPlace(tray, index), [index, onPlace]);
  const zone = useDropZone({
    id: `shelf-${index}`,
    label: `Shelf ${index}`,
    accepts: (kind) => kind === 'tray',
    onDrop: drop,
  });
  return (
    <div
      ref={zone.ref}
      {...zone.props}
      className={cn(
        'flex min-h-16 items-center justify-center rounded-lg border-2 border-border bg-background text-sm font-semibold',
        zone.canDrop && 'border-primary/50',
        (zone.isOver || zone.isTarget) && 'border-primary bg-primary/10',
      )}
    >
      Shelf {index}
    </div>
  );
}

function DragExamples() {
  const [poured, setPoured] = useState<string[]>([]);
  const [placements, setPlacements] = useState<Record<string, number>>({});
  const [warning, setWarning] = useState('');
  const pour = useCallback((id: string) => setPoured((current) => current.includes(id) ? current : [...current, id]), []);
  const place = useCallback((tray: string, shelf: number) => {
    setPlacements((current) => {
      const occupied = Object.entries(current).find(([, placedShelf]) => Math.abs(placedShelf - shelf) === 1);
      setWarning(occupied ? `${tray} is adjacent to ${occupied[0]}. Leave a shelf gap.` : '');
      return { ...current, [tray]: shelf };
    });
  }, []);

  return (
    <DragProvider>
      <section className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="text-xl font-bold">Pour and store</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <DraggableObject id="ladle" kind="ladle" label="Ladle">🥄 Ladle</DraggableObject>
          <PourZone id="pour-a" onPour={pour} />
          <PourZone id="pour-b" onPour={pour} />
        </div>
        <p className="text-sm text-muted">Hold the ladle over a tray to pour. Poured: {poured.length ? poured.join(', ') : 'none'}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((tray) => (
            <DraggableObject key={tray} id={`tray-${tray}`} kind="tray" label={`Tray ${tray}`}>
              Tray {tray}{placements[`tray-${tray}`] ? ` → shelf ${placements[`tray-${tray}`]}` : ''}
            </DraggableObject>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((shelf) => <ShelfZone key={shelf} index={shelf} onPlace={place} />)}
        </div>
        {warning && <p role="alert" className="font-semibold text-primary">{warning}</p>}
      </section>
    </DragProvider>
  );
}

export default function InteractDemo() {
  const [gauge, setGauge] = useState(41.5);
  const [signature, setSignature] = useState<SignatureValue>({ inked: false, typed: '' });

  return (
    <main className="mx-auto max-w-5xl space-y-8 bg-background p-6 text-foreground">
      <h1 className="text-3xl font-bold">Interaction primitives</h1>
      <DragExamples />
      <section className="grid gap-8 rounded-xl border border-border p-5 md:grid-cols-3">
        <div>
          <h2 className="mb-4 text-lg font-bold">Probe</h2>
          <HoldToRead target={41.5} label="Chicken temperature">Keep the probe in place</HoldToRead>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-bold">Gauge</h2>
          <Gauge value={gauge} min={0} max={100} unit="°C" label="Oven temperature" />
          <input
            className="w-full accent-primary"
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={gauge}
            aria-label="Set gauge value"
            onChange={(event) => setGauge(event.target.valueAsNumber)}
          />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-bold">Sign-off</h2>
          <SignaturePad value={signature} onChange={setSignature} />
        </div>
      </section>
    </main>
  );
}