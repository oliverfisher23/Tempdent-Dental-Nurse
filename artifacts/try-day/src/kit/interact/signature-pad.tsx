import { type PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@kit/lib/utils';
import { kitchenAudio } from '@kit/lib/audio';

export interface SignatureValue {
  inked: boolean;
  typed: string;
  dataUrl?: string;
}

export interface SignaturePadProps {
  value: { inked: boolean; typed: string };
  onChange: (value: SignatureValue) => void;
  label?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
  className?: string;
  typedFallback?: boolean;
}

export function SignaturePad({
  value,
  onChange,
  label = 'Sign here',
  width = 320,
  height = 120,
  disabled = false,
  className,
  typedFallback = true,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const inked = useRef(value.inked);
  const [typing, setTyping] = useState(Boolean(value.typed));

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    inked.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }, [height, width]);

  useEffect(() => {
    if (!value.inked && !value.typed) clearCanvas();
  }, [clearCanvas, value.inked, value.typed]);

  useEffect(() => {
    inked.current = value.inked;
  }, [value.inked]);

  const coordinates = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  };

  const startStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const point = coordinates(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.strokeStyle = '#171717';
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    drawing.current = true;
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const point = coordinates(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    inked.current = true;
  };

  const endStroke = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    onChange({
      inked: inked.current,
      typed: value.typed,
      dataUrl: inked.current && canvas ? canvas.toDataURL('image/png') : undefined,
    });
    kitchenAudio.play('page');
  };

  const clear = () => {
    clearCanvas();
    onChange({ inked: false, typed: value.typed });
    kitchenAudio.play('tap');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn('relative overflow-hidden rounded-lg border-2 border-border bg-background', disabled && 'opacity-60')}
        style={{ width: '100%', maxWidth: width, aspectRatio: `${width} / ${height}` }}
      >
        <span className="pointer-events-none absolute bottom-7 left-7 right-5 border-b border-foreground/25" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-5 left-3 font-serif text-lg text-foreground/35" aria-hidden="true">x</span>
        <canvas
          ref={canvasRef}
          className={cn('relative block h-full w-full', disabled ? 'cursor-default' : 'cursor-crosshair')}
          style={{ touchAction: 'none' }}
          aria-label={label}
          role="img"
          onPointerDown={startStroke}
          onPointerMove={draw}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || !value.inked}
          onClick={clear}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground outline-none hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
        {typedFallback && (
          <button
            type="button"
            disabled={disabled}
            aria-expanded={typing}
            onClick={() => setTyping((current) => !current)}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            {typing ? 'Draw your signature instead' : 'Type your name instead'}
          </button>
        )}
      </div>
      {typedFallback && typing && (
        <input
          type="text"
          value={value.typed}
          disabled={disabled}
          aria-label="Type your name"
          onChange={(event) => onChange({ inked: inked.current, typed: event.target.value })}
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        />
      )}
    </div>
  );
}