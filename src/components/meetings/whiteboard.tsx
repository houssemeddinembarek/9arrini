"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, UID } from "agora-rtc-sdk-ng";
import { Pen, Eraser, Trash2, X, Undo2, Wifi, WifiOff, Minus, Square, Circle, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = ["#0f172a", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];

// "pen" writes freehand, "line" is the ruler (segments), "circle" is the
// compass (perfect circles), "hand" selects and moves a drawing.
type Tool = "pen" | "eraser" | "line" | "rect" | "circle" | "hand";

// The data-stream send method exists at runtime but is missing from the public
// type defs, so we describe just the bit we use.
type RtcClientWithDataStream = IAgoraRTCClient & {
  sendStreamMessage?: (msg: string | Uint8Array, ordered?: boolean) => Promise<void>;
};

// Every drawing is stored as a movable object. All coordinates are normalised
// to 0..1 of the canvas (x by width, y by height; radius and stroke width by
// width), so each participant renders them identically at any screen size.
type El =
  | { id: string; kind: "stroke"; color: string; size: number; pts: number[] }
  | { id: string; kind: "line" | "rect"; color: string; size: number; x0: number; y0: number; x1: number; y1: number }
  | { id: string; kind: "circle"; color: string; size: number; cx: number; cy: number; r: number };

// Wire protocol carried over the Agora data stream.
type WireMessage =
  | { t: "add"; el: El }
  | { t: "move"; id: string; dx: number; dy: number }
  | { t: "del"; id: string }
  | { t: "clear" };

const uid = () => Math.random().toString(36).slice(2);

/**
 * A shared "white table" for a meeting. Drawings are objects (freehand strokes,
 * ruler segments, rectangles, compass circles) broadcast over the Agora data
 * stream so everyone sees the same board. The hand tool selects an object and
 * drags it to a new position, live for the whole room.
 *
 * Late joiners see whatever is drawn from the moment they open the board (the
 * data stream carries no history).
 */
export function Whiteboard({
  client, onClose, readOnly = false, onCanvas,
}: {
  client: IAgoraRTCClient | null;
  onClose: () => void;
  // Students view the board but get no tools and can't draw on it.
  readOnly?: boolean;
  // Exposes the live canvas so the meeting recorder can capture the board.
  onCanvas?: (canvas: HTMLCanvasElement | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // The whole scene, plus an undo stack of past scenes.
  const elements = useRef<El[]>([]);
  const history = useRef<El[][]>([]);

  // In-progress interaction state.
  const drawing = useRef(false);
  const draft = useRef<El | null>(null);            // shape/stroke being drawn
  const previewBase = useRef<ImageData | null>(null); // canvas snapshot for shape rubber-banding
  const dragLast = useRef<{ x: number; y: number } | null>(null); // last hand-drag point (px)
  const selected = useRef<string | null>(null);      // id of the selected object

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(3);
  const synced = !!(client as RtcClientWithDataStream | null)?.sendStreamMessage;

  const dims = () => {
    const c = canvasRef.current;
    return { W: c?.width || 1, H: c?.height || 1 };
  };

  // ── Rendering ──
  const drawEl = useCallback((ctx: CanvasRenderingContext2D, el: El, W: number, H: number) => {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = Math.max(1, el.size * W);
    ctx.beginPath();
    if (el.kind === "stroke") {
      const p = el.pts;
      if (p.length >= 2) ctx.moveTo(p[0] * W, p[1] * H);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] * W, p[i + 1] * H);
    } else if (el.kind === "line") {
      ctx.moveTo(el.x0 * W, el.y0 * H);
      ctx.lineTo(el.x1 * W, el.y1 * H);
    } else if (el.kind === "rect") {
      ctx.rect(Math.min(el.x0, el.x1) * W, Math.min(el.y0, el.y1) * H, Math.abs(el.x1 - el.x0) * W, Math.abs(el.y1 - el.y0) * H);
    } else if (el.kind === "circle") {
      ctx.arc(el.cx * W, el.cy * H, el.r * W, 0, Math.PI * 2);
    }
    ctx.stroke();
  }, []);

  // Pixel-space bounding box of an object, for hit-testing and the selection frame.
  const bboxPx = (el: El, W: number, H: number) => {
    if (el.kind === "stroke") {
      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      for (let i = 0; i < el.pts.length; i += 2) {
        minx = Math.min(minx, el.pts[i]); maxx = Math.max(maxx, el.pts[i]);
        miny = Math.min(miny, el.pts[i + 1]); maxy = Math.max(maxy, el.pts[i + 1]);
      }
      return { x: minx * W, y: miny * H, w: (maxx - minx) * W, h: (maxy - miny) * H };
    }
    if (el.kind === "circle") {
      const r = el.r * W;
      return { x: el.cx * W - r, y: el.cy * H - r, w: r * 2, h: r * 2 };
    }
    return {
      x: Math.min(el.x0, el.x1) * W, y: Math.min(el.y0, el.y1) * H,
      w: Math.abs(el.x1 - el.x0) * W, h: Math.abs(el.y1 - el.y0) * H,
    };
  };

  const redraw = useCallback(() => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    for (const el of elements.current) drawEl(ctx, el, W, H);

    if (selected.current) {
      const el = elements.current.find((e) => e.id === selected.current);
      if (el) {
        const b = bboxPx(el, W, H);
        const pad = 6;
        ctx.save();
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
        ctx.restore();
      }
    }
  }, [drawEl]);

  const hitTest = (px: number, py: number): El | null => {
    const { W, H } = dims();
    const pad = 8;
    // Topmost (last drawn) object wins.
    for (let i = elements.current.length - 1; i >= 0; i--) {
      const b = bboxPx(elements.current[i], W, H);
      if (px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad) {
        return elements.current[i];
      }
    }
    return null;
  };

  const translate = (el: El, dx: number, dy: number) => {
    if (el.kind === "stroke") {
      for (let i = 0; i < el.pts.length; i += 2) { el.pts[i] += dx; el.pts[i + 1] += dy; }
    } else if (el.kind === "circle") {
      el.cx += dx; el.cy += dy;
    } else {
      el.x0 += dx; el.x1 += dx; el.y0 += dy; el.y1 += dy;
    }
  };

  // ── Canvas setup ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      redraw(); // objects are normalised, so just repaint them at the new size
    };
    resize();
    window.addEventListener("resize", resize);
    onCanvas?.(canvas); // hand the live canvas to the recorder
    return () => {
      window.removeEventListener("resize", resize);
      onCanvas?.(null);
    };
  }, [redraw, onCanvas]);

  // ── Receive remote operations ──
  useEffect(() => {
    if (!client) return;
    const decoder = new TextDecoder();
    const onMessage = (_uid: UID, payload: Uint8Array) => {
      try {
        const msg = JSON.parse(decoder.decode(payload)) as WireMessage;
        if (msg.t === "add") {
          elements.current.push(msg.el);
          const ctx = ctxRef.current, canvas = canvasRef.current;
          if (ctx && canvas) drawEl(ctx, msg.el, canvas.width, canvas.height); // additive: no full repaint
        } else if (msg.t === "move") {
          const el = elements.current.find((e) => e.id === msg.id);
          if (el) { translate(el, msg.dx, msg.dy); redraw(); }
        } else if (msg.t === "del") {
          elements.current = elements.current.filter((e) => e.id !== msg.id);
          if (selected.current === msg.id) selected.current = null;
          redraw();
        } else if (msg.t === "clear") {
          elements.current = [];
          selected.current = null;
          redraw();
        }
      } catch {
        // ignore malformed messages
      }
    };
    client.on("stream-message", onMessage);
    return () => { client.off("stream-message", onMessage); };
  }, [client, drawEl, redraw]);

  const broadcast = useCallback((msg: WireMessage) => {
    const c = client as RtcClientWithDataStream | null;
    c?.sendStreamMessage?.(JSON.stringify(msg)).catch(() => {});
  }, [client]);

  // ── Input plumbing ──
  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushHistory = () => {
    history.current.push(JSON.parse(JSON.stringify(elements.current)));
    if (history.current.length > 30) history.current.shift();
  };

  const eraseAt = (p: { x: number; y: number }) => {
    const hit = hitTest(p.x, p.y);
    if (!hit) return;
    elements.current = elements.current.filter((e) => e.id !== hit.id);
    if (selected.current === hit.id) selected.current = null;
    broadcast({ t: "del", id: hit.id });
    redraw();
  };

  const start = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pos(e);
    const { W, H } = dims();
    drawing.current = true;

    if (tool === "hand") {
      const hit = hitTest(p.x, p.y);
      selected.current = hit?.id ?? null;
      dragLast.current = p;
      if (hit) pushHistory();
      redraw();
      return;
    }

    pushHistory();

    if (tool === "eraser") { eraseAt(p); return; }

    const id = uid();
    if (tool === "pen") {
      draft.current = { id, kind: "stroke", color, size: size / W, pts: [p.x / W, p.y / H] };
      return;
    }

    // Shapes rubber-band: snapshot the canvas so each move redraws cleanly.
    previewBase.current = ctxRef.current?.getImageData(0, 0, W, H) ?? null;
    if (tool === "line" || tool === "rect") {
      draft.current = { id, kind: tool, color, size: size / W, x0: p.x / W, y0: p.y / H, x1: p.x / W, y1: p.y / H };
    } else {
      // Compass: the press point is the centre, the drag sets the radius.
      draft.current = { id, kind: "circle", color, size: size / W, cx: p.x / W, cy: p.y / H, r: 0 };
    }
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = pos(e);
    const { W, H } = dims();

    if (tool === "hand") {
      const id = selected.current;
      if (!id || !dragLast.current) return;
      const el = elements.current.find((x) => x.id === id);
      if (!el) return;
      const dx = (p.x - dragLast.current.x) / W;
      const dy = (p.y - dragLast.current.y) / H;
      translate(el, dx, dy);
      dragLast.current = p;
      broadcast({ t: "move", id, dx, dy });
      redraw();
      return;
    }

    if (tool === "eraser") { eraseAt(p); return; }

    if (tool === "pen") {
      const d = draft.current;
      if (!d || d.kind !== "stroke") return;
      const lastX = d.pts[d.pts.length - 2] * W, lastY = d.pts[d.pts.length - 1] * H;
      ctx.strokeStyle = d.color;
      ctx.lineWidth = Math.max(1, d.size * W);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      d.pts.push(p.x / W, p.y / H);
      return;
    }

    // Shapes: restore the snapshot, then draw the shape at its current size.
    if (previewBase.current) ctx.putImageData(previewBase.current, 0, 0);
    const d = draft.current;
    if (!d) return;
    if (d.kind === "line" || d.kind === "rect") {
      d.x1 = p.x / W; d.y1 = p.y / H;
    } else if (d.kind === "circle") {
      d.r = Math.hypot(p.x - d.cx * W, p.y - d.cy * H) / W;
    }
    drawEl(ctx, d, W, H);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;

    if (tool === "hand") { dragLast.current = null; return; }
    if (tool === "eraser") return;

    const d = draft.current;
    draft.current = null;
    previewBase.current = null;
    if (!d) return;

    // Discard accidental zero-size shapes / empty strokes.
    const valid =
      d.kind === "stroke" ? d.pts.length >= 4 :
      d.kind === "circle" ? d.r > 0.003 :
      Math.abs(d.x1 - d.x0) > 0.003 || Math.abs(d.y1 - d.y0) > 0.003;

    if (valid) {
      elements.current.push(d);
      broadcast({ t: "add", el: d });
    } else {
      redraw(); // wipe the leftover preview
    }
  };

  const undo = () => {
    const prev = history.current.pop();
    if (prev) {
      elements.current = prev;
      selected.current = null;
      redraw();
    }
  };

  const clear = () => {
    pushHistory();
    elements.current = [];
    selected.current = null;
    redraw();
    broadcast({ t: "clear" });
  };

  // Switching to a non-hand tool drops the current selection.
  const pickTool = (t: Tool) => {
    setTool(t);
    if (t !== "hand" && selected.current) { selected.current = null; redraw(); }
  };

  const toolBtn = (t: Tool, label: string, icon: React.ReactNode) => (
    <Button variant={tool === t ? "gradient" : "outline"} size="icon" className="h-8 w-8" onClick={() => pickTool(t)} title={label}>
      {icon}
    </Button>
  );

  const drawingColor = tool !== "eraser" && tool !== "hand";

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden flex flex-col h-full">
      {/* Toolbar — hidden for students, who only view the board. */}
      {!readOnly && (
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--border))] flex-wrap">
        {toolBtn("hand", "Main (déplacer un dessin)", <Hand className="h-4 w-4" />)}
        {toolBtn("pen", "Stylo (écrire)", <Pen className="h-4 w-4" />)}
        {toolBtn("eraser", "Gomme (supprimer un dessin)", <Eraser className="h-4 w-4" />)}
        {toolBtn("line", "Règle (segment)", <Minus className="h-4 w-4" />)}
        {toolBtn("rect", "Rectangle", <Square className="h-4 w-4" />)}
        {toolBtn("circle", "Compas (cercle)", <Circle className="h-4 w-4" />)}

        <div className="flex items-center gap-1 ml-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); if (tool === "eraser" || tool === "hand") setTool("pen"); }}
              className={cn(
                "h-5 w-5 rounded-full border transition-transform",
                color === c && drawingColor ? "ring-2 ring-offset-1 ring-[hsl(var(--primary))] scale-110" : "border-black/10"
              )}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <input type="range" min={1} max={12} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-20 ml-1" title="Épaisseur du trait" />

        <span
          className={cn("flex items-center gap-1 text-[10px] font-medium ml-1", synced ? "text-green-600" : "text-[hsl(var(--muted-foreground))]")}
          title={synced ? "Everyone in the room sees this board" : "Not shared — join the room to share"}
        >
          {synced ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {synced ? "Shared" : "Local"}
        </span>

        <Button variant="outline" size="icon" className="h-8 w-8 ml-auto" onClick={undo} title="Annuler">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={clear} title="Tout effacer (pour tout le monde)">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onClose} title="Fermer le tableau">
          <X className="h-4 w-4" />
        </Button>
      </div>
      )}

      {/* Canvas */}
      <div className="relative flex-1 min-h-[360px] bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 touch-none",
            readOnly ? "cursor-default pointer-events-none" : tool === "hand" ? "cursor-move" : "cursor-crosshair",
          )}
          onPointerDown={readOnly ? undefined : start}
          onPointerMove={readOnly ? undefined : move}
          onPointerUp={readOnly ? undefined : end}
          onPointerLeave={readOnly ? undefined : end}
        />
      </div>
    </div>
  );
}
