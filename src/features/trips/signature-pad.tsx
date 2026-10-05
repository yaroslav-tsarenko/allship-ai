"use client";

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type SignaturePadHandle = { toBlob: () => Promise<Blob | null>; clear: () => void; isEmpty: () => boolean };

export const SignaturePad = forwardRef<SignaturePadHandle, { label?: string; onEmptyChange?: (empty: boolean) => void; className?: string }>(function SignaturePad(
  { label = "Recipient signature", onEmptyChange, className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const [empty, setEmpty] = useState(true);
  const labelId = useId();
  const hintId = useId();

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.round(canvas.offsetWidth * ratio);
    canvas.height = Math.round(canvas.offsetHeight * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#1b1b1f";
    strokes.current = 0;
    setEmpty(true);
  }, []);

  useEffect(() => {
    setup();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    let width = canvas.offsetWidth;
    const observer = new ResizeObserver(() => {
      const next = canvas.offsetWidth;
      if (Math.abs(next - width) > 1 && strokes.current === 0) {
        width = next;
        setup();
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [setup]);

  useEffect(() => {
    onEmptyChange?.(empty);
  }, [empty, onEmptyChange]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width ? canvas.offsetWidth / rect.width : 1;
    const sy = rect.height ? canvas.offsetHeight / rect.height : 1;
    return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    strokes.current = 0;
    setEmpty(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      clear,
      isEmpty: () => strokes.current === 0,
      toBlob: () =>
        new Promise<Blob | null>((resolve) => {
          const canvas = canvasRef.current;
          if (!canvas || strokes.current === 0) return resolve(null);
          const out = document.createElement("canvas");
          out.width = canvas.width;
          out.height = canvas.height;
          const ctx = out.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, out.width, out.height);
          ctx.drawImage(canvas, 0, 0);
          out.toBlob(resolve, "image/png");
        }),
    }),
    [clear],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p id={labelId} className="text-title-sm text-on-surface">
          {label}
        </p>
        <Button type="button" variant="text" size="sm" onClick={clear} disabled={empty}>
          Clear
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-md border border-outline bg-white">
        <canvas
          ref={canvasRef}
          role="img"
          aria-labelledby={labelId}
          aria-describedby={hintId}
          className="block h-40 w-full cursor-crosshair touch-none"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drawing.current = true;
            last.current = point(event);
            const ctx = event.currentTarget.getContext("2d");
            if (ctx && last.current) {
              ctx.beginPath();
              ctx.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2);
              ctx.fillStyle = "#1b1b1f";
              ctx.fill();
            }
          }}
          onPointerMove={(event) => {
            if (!drawing.current || !last.current) return;
            const ctx = event.currentTarget.getContext("2d");
            if (!ctx) return;
            const next = point(event);
            ctx.beginPath();
            ctx.moveTo(last.current.x, last.current.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
            last.current = next;
            if (strokes.current === 0) setEmpty(false);
            strokes.current += 1;
          }}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
          }}
          onPointerCancel={() => {
            drawing.current = false;
            last.current = null;
          }}
        />
        {empty && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-neutral-400 pb-1 text-body-sm text-neutral-500">
            Sign here
          </span>
        )}
      </div>
      <p id={hintId} className="text-body-sm text-on-surface-variant">
        Optional. Ask the recipient to sign with a finger or mouse.
      </p>
    </div>
  );
});
