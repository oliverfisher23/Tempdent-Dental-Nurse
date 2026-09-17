import {
  createContext,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { kitchenAudio } from '@/lib/audio';

export interface DragItem {
  id: string;
  kind: string;
  label: string;
  source: HTMLElement;
}

interface ZoneRecord {
  id: string;
  label: string;
  node: HTMLElement | null;
  accepts: (kind: string) => boolean;
  onDrop: (itemId: string) => void;
  onOverChange?: (itemId: string | null) => void;
  disabled: boolean;
  rect: DOMRect | null;
}

interface DragContextValue {
  active: DragItem | null;
  hoveredId: string | null;
  targetIndex: number;
  keyboardMode: boolean;
  registerZone: (record: ZoneRecord) => void;
  unregisterZone: (id: string) => void;
  begin: (item: DragItem, keyboard: boolean) => void;
  hoverAt: (x: number, y: number) => void;
  dropAt: (x: number, y: number) => boolean;
  moveTarget: (direction: 1 | -1) => void;
  dropTarget: () => boolean;
  cancel: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

function useDragContext() {
  const context = useContext(DragContext);
  if (!context) throw new Error('Drag interactions must be used inside DragProvider');
  return context;
}

export function DragProvider({ children }: { children: ReactNode }) {
  const zones = useRef(new Map<string, ZoneRecord>());
  const [active, setActive] = useState<DragItem | null>(null);
  const activeRef = useRef<DragItem | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [targetIndex, setTargetIndex] = useState(-1);
  const targetIndexRef = useRef(-1);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const keyboardRef = useRef(false);
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 0);
  }, []);

  const acceptingZones = useCallback((item: DragItem) => {
    return [...zones.current.values()]
      .filter((zone) => zone.node && !zone.disabled && zone.accepts(item.kind))
      .sort((a, b) => {
        if (!a.node || !b.node) return 0;
        const position = a.node.compareDocumentPosition(b.node);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
      });
  }, []);

  const changeOver = useCallback((nextId: string | null) => {
    if (nextId === hoveredRef.current) return;
    const item = activeRef.current;
    const previous = hoveredRef.current ? zones.current.get(hoveredRef.current) : undefined;
    if (item) previous?.onOverChange?.(null);
    hoveredRef.current = nextId;
    setHoveredId(nextId);
    const next = nextId ? zones.current.get(nextId) : undefined;
    if (item && next) {
      next.onOverChange?.(item.id);
      announce(`Over ${next.label}`);
    }
  }, [announce]);

  const clear = useCallback(() => {
    changeOver(null);
    activeRef.current = null;
    setActive(null);
    keyboardRef.current = false;
    setKeyboardMode(false);
    targetIndexRef.current = -1;
    setTargetIndex(-1);
  }, [changeOver]);

  const registerZone = useCallback((record: ZoneRecord) => {
    zones.current.set(record.id, record);
  }, []);

  const unregisterZone = useCallback((id: string) => {
    zones.current.delete(id);
  }, []);

  const measureZones = useCallback(() => {
    zones.current.forEach((zone) => {
      zone.rect = zone.node?.getBoundingClientRect() ?? null;
    });
  }, []);

  const begin = useCallback((item: DragItem, keyboard: boolean) => {
    activeRef.current = item;
    setActive(item);
    keyboardRef.current = keyboard;
    setKeyboardMode(keyboard);
    measureZones();
    if (keyboard) {
      const available = acceptingZones(item);
      const first = available[0];
      targetIndexRef.current = first ? 0 : -1;
      setTargetIndex(first ? 0 : -1);
      changeOver(first?.id ?? null);
      announce(`Picked up ${item.label}. Use the arrow keys to choose where to put it, Enter to drop, Escape to cancel.`);
    }
  }, [acceptingZones, announce, changeOver, measureZones]);

  useEffect(() => {
    if (!active) return;
    const update = () => measureZones();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [active, measureZones]);

  const zoneAt = useCallback((x: number, y: number) => {
    const item = activeRef.current;
    if (!item) return undefined;
    return [...zones.current.values()].reverse().find((zone) => {
      if (!zone.node || zone.disabled || !zone.accepts(item.kind)) return false;
      const rect = zone.node.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
  }, []);

  const hoverAt = useCallback((x: number, y: number) => {
    changeOver(zoneAt(x, y)?.id ?? null);
  }, [changeOver, zoneAt]);

  const dropAt = useCallback((x: number, y: number) => {
    const item = activeRef.current;
    if (!item) return false;
    const zone = zoneAt(x, y);
    if (zone) {
      zone.onDrop(item.id);
      announce(`${item.label} put on ${zone.label}`);
    }
    clear();
    return Boolean(zone);
  }, [announce, clear, zoneAt]);

  const moveTarget = useCallback((direction: 1 | -1) => {
    const item = activeRef.current;
    if (!item) return;
    const available = acceptingZones(item);
    if (!available.length) return;
    const current = targetIndexRef.current;
    const next = current < 0 ? 0 : (current + direction + available.length) % available.length;
    targetIndexRef.current = next;
    setTargetIndex(next);
    changeOver(available[next].id);
  }, [acceptingZones, changeOver]);

  const dropTarget = useCallback(() => {
    const item = activeRef.current;
    if (!item) return false;
    const available = acceptingZones(item);
    const zone = available[targetIndexRef.current];
    if (zone) {
      zone.onDrop(item.id);
      announce(`${item.label} put on ${zone.label}`);
    }
    clear();
    return Boolean(zone);
  }, [acceptingZones, announce, clear]);

  const cancel = useCallback(() => {
    if (!activeRef.current) return;
    announce('Dropped back');
    clear();
  }, [announce, clear]);

  const value = useMemo<DragContextValue>(() => ({
    active,
    hoveredId,
    targetIndex,
    keyboardMode,
    registerZone,
    unregisterZone,
    begin,
    hoverAt,
    dropAt,
    moveTarget,
    dropTarget,
    cancel,
  }), [active, begin, cancel, dropAt, dropTarget, hoverAt, hoveredId, keyboardMode, moveTarget, registerZone, targetIndex, unregisterZone]);

  return (
    <DragContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    </DragContext.Provider>
  );
}

export interface UseDraggableOptions {
  id: string;
  kind: string;
  label: string;
  disabled?: boolean;
}

type DraggableProps = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  tabIndex: number;
  role: 'button';
  'aria-label': string;
  'aria-pressed': boolean;
  'aria-describedby': string;
  style: CSSProperties;
};

/**
 * Make an element carryable with the pointer or the keyboard (Space to pick up, arrows
 * to move between places it can go, Enter to put down, Escape to put back). Give the
 * element its own `position` (relative or absolute) so it rises above its neighbours
 * while carried.
 */
export function useDraggable({ id, kind, label, disabled = false }: UseDraggableOptions): {
  props: DraggableProps;
  isDragging: boolean;
  isLifted: boolean;
} {
  const context = useDragContext();
  const instructionsId = useId();
  const pointer = useRef<{ id: number; x: number; y: number; node: HTMLElement } | null>(null);
  const draggedRef = useRef(false);
  const [isPointerDragging, setPointerDragging] = useState(false);
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const [returning, setReturning] = useState(false);
  const isLifted = context.active?.id === id;

  useEffect(() => {
    let instructions = document.getElementById(instructionsId);
    if (!instructions) {
      instructions = document.createElement('span');
      instructions.id = instructionsId;
      instructions.className = 'sr-only';
      instructions.textContent = 'Press Space or Enter to pick up. Use arrow keys to choose a destination, Enter to drop, or Escape to cancel.';
      document.body.appendChild(instructions);
    }
    return () => instructions?.remove();
  }, [instructionsId]);

  const resetTransform = useCallback((animate: boolean) => {
    if (animate) {
      setReturning(true);
      window.setTimeout(() => setReturning(false), 180);
    }
    setDelta({ x: 0, y: 0 });
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (disabled || event.button !== 0 || context.active) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, node: event.currentTarget };
    draggedRef.current = false;
  }, [context.active, disabled]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (!draggedRef.current && Math.hypot(x, y) >= 4) {
      draggedRef.current = true;
      setPointerDragging(true);
      context.begin({ id, kind, label, source: start.node }, false);
    }
    if (!draggedRef.current) return;
    event.preventDefault();
    setDelta({ x, y });
    context.hoverAt(event.clientX, event.clientY);
  }, [context, id, kind, label]);

  const finishPointer = useCallback((event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    pointer.current = null;
    if (!draggedRef.current) return;
    event.preventDefault();
    setPointerDragging(false);
    const dropped = !cancelled && context.dropAt(event.clientX, event.clientY);
    if (cancelled) context.cancel();
    if (!dropped) {
      resetTransform(true);
      kitchenAudio.play('tap');
    } else {
      resetTransform(false);
    }
    draggedRef.current = false;
  }, [context, resetTransform]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    if (!isLifted) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        context.begin({ id, kind, label, source: event.currentTarget }, true);
      }
      return;
    }
    if (!context.keyboardMode) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      context.cancel();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
      event.preventDefault();
      context.moveTarget(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
      event.preventDefault();
      context.moveTarget(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      context.dropTarget();
    }
  }, [context, disabled, id, isLifted, kind, label]);

  return {
    props: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event) => finishPointer(event, false),
      onPointerCancel: (event) => finishPointer(event, true),
      onKeyDown,
      tabIndex: disabled ? -1 : 0,
      role: 'button',
      'aria-label': `${label}. ${isLifted ? 'Picked up' : 'Press Space or Enter to pick up'}`,
      'aria-pressed': isLifted,
      'aria-describedby': instructionsId,
      style: {
        touchAction: 'none',
        transform: `translate3d(${delta.x}px, ${delta.y}px, 0)`,
        willChange: 'transform',
        cursor: disabled ? 'not-allowed' : isPointerDragging ? 'grabbing' : 'grab',
        zIndex: isPointerDragging ? 50 : undefined,
        transition: isPointerDragging ? 'none' : returning ? 'transform 180ms cubic-bezier(.2,.8,.2,1)' : undefined,
        // No `position` here: the element keeps its own (relative or absolute), which is
        // what lets the z-index take while it is carried.
      },
    },
    isDragging: isPointerDragging,
    isLifted,
  };
}

export interface UseDropZoneOptions {
  id: string;
  label: string;
  accepts: (kind: string) => boolean;
  onDrop: (itemId: string) => void;
  onOverChange?: (itemId: string | null) => void;
  disabled?: boolean;
}

export function useDropZone({ id, label, accepts, onDrop, onOverChange, disabled = false }: UseDropZoneOptions) {
  const context = useDragContext();
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    context.registerZone({
      id,
      label,
      node: nodeRef.current,
      accepts,
      onDrop,
      onOverChange,
      disabled,
      rect: nodeRef.current?.getBoundingClientRect() ?? null,
    });
    return () => context.unregisterZone(id);
  }, [accepts, context, disabled, id, label, onDrop, onOverChange]);

  const ref = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
    context.registerZone({ id, label, node, accepts, onDrop, onOverChange, disabled, rect: node?.getBoundingClientRect() ?? null });
  }, [accepts, context, disabled, id, label, onDrop, onOverChange]);

  const active = context.active;
  const compatible = Boolean(active && !disabled && accepts(active.kind));
  return {
    ref,
    isOver: context.hoveredId === id,
    canDrop: compatible,
    isTarget: compatible && context.keyboardMode && context.hoveredId === id,
    props: {
      'data-drop-zone': id,
      'aria-label': label,
      role: 'group' as const,
    },
  };
}