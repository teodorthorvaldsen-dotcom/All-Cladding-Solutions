"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { BoxTraySideRow } from "@/types/boxTray";
import { normalizeBoxTraySidesForFlashing } from "@/lib/boxTray";

const PREVIEW_H = 360;
const PREVIEW_H_COMPACT = 240;
const PREVIEW_W = 520;

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

type Pt = { x: number; y: number };

function midpoint(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function vlen(p: Pt): number {
  return Math.hypot(p.x, p.y);
}

function vunit(p: Pt): Pt {
  const L = vlen(p) || 1;
  return { x: p.x / L, y: p.y / L };
}

function cross2d(a: Pt, b: Pt): number {
  return a.x * b.y - a.y * b.x;
}

/** Outward sheet-normal for the hem bend (cross-section “inside” the fold). */
function hemBendNormal(S: Pt, E: Pt, prevPt: Pt): Pt {
  const tu = vunit({ x: E.x - S.x, y: E.y - S.y });
  let n: Pt = { x: -tu.y, y: tu.x };
  if (cross2d(tu, vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y })) < 0) {
    n = { x: tu.y, y: -tu.x };
  }
  return n;
}

function arcChordSweep(S: Pt, E: Pt, C: Pt, R: number, n: Pt, M: Pt): { a0: number; sweep: number } {
  const aS = Math.atan2(S.y - C.y, S.x - C.x);
  const aE = Math.atan2(E.y - C.y, E.x - C.x);
  let sweep = aE - aS;
  while (sweep <= -Math.PI) sweep += 2 * Math.PI;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  const midA = aS + sweep / 2;
  const midP = { x: C.x + R * Math.cos(midA), y: C.y + R * Math.sin(midA) };
  const vm = { x: midP.x - M.x, y: midP.y - M.y };
  if (vm.x * n.x + vm.y * n.y < 0) {
    sweep = sweep > 0 ? sweep - 2 * Math.PI : sweep + 2 * Math.PI;
  }
  return { a0: aS, sweep };
}

function sampleArc(C: Pt, R: number, a0: number, sweep: number, steps: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + sweep * t;
    out.push({ x: C.x + R * Math.cos(a), y: C.y + R * Math.sin(a) });
  }
  return out;
}

/**
 * Flat (closed) hem — single centerline like catalog section views.
 * A double semicircle (outer + offset inner) read as a thick “pipe”; one 180° arc matches shop drawings.
 */
function flatHemStrokes(S: Pt, E: Pt, n: Pt): Pt[][] {
  const L = dist(S, E);
  const half = L / 2;
  const R = half;
  const M = midpoint(S, E);
  const C = M;
  const outerOs = arcChordSweep(S, E, C, R, n, M);
  const outer = sampleArc(C, R, outerOs.a0, outerOs.sweep, 22);
  return [outer];
}

const OPEN_HEM_GAP_IN = 0.048;

/**
 * Open hem — ~180° hook with a visible gap between outer and inner layers (shop-style J hem).
 * Outer: bend arc (slightly open vs 180°) → return leg parallel to the flat (horizontal).
 * Inner: offset stroke so the gap reads between layers.
 */
function openHemHookStrokes(S: Pt, E: Pt, prevPt: Pt, hemLegLen: number): Pt[][] {
  const tf = vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y });
  const chord = vunit({ x: E.x - S.x, y: E.y - S.y });
  const n = hemBendNormal(S, E, prevPt);
  const R = clamp(hemLegLen * 0.32, 0.05, 0.14);
  const gap = OPEN_HEM_GAP_IN;
  const sweepOpenDeg = 176;
  const sweep = (sweepOpenDeg * Math.PI) / 180;

  const leftPerp = { x: -tf.y, y: tf.x };
  const rightPerp = { x: tf.y, y: -tf.x };
  const useLeft = cross2d(tf, chord) >= 0;
  const perp = useLeft ? leftPerp : rightPerp;
  const C: Pt = { x: S.x + perp.x * R, y: S.y + perp.y * R };

  const aS = Math.atan2(S.y - C.y, S.x - C.x);
  const tryNeg = sampleArc(C, R, aS, -sweep, 22);
  const tryPos = sampleArc(C, R, aS, sweep, 22);
  const midNeg = tryNeg[Math.floor(tryNeg.length / 2)]!;
  const midPos = tryPos[Math.floor(tryPos.length / 2)]!;
  const towardCavity = (P: Pt) => P.x * n.x + P.y * n.y;
  const outerArc = towardCavity({ x: midNeg.x - S.x, y: midNeg.y - S.y }) >= towardCavity({ x: midPos.x - S.x, y: midPos.y - S.y }) ? tryNeg : tryPos;

  const arcEnd = outerArc[outerArc.length - 1]!;
  const legSign = arcEnd.x > 1e-6 ? -1 : arcEnd.x < -1e-6 ? 1 : chord.x >= 0 ? -1 : 1;
  const legTan: Pt = { x: legSign, y: 0 };
  const legEnd: Pt = {
    x: arcEnd.x + legTan.x * hemLegLen,
    y: arcEnd.y + legTan.y * hemLegLen,
  };

  const bendOut = vunit({ x: arcEnd.x - C.x, y: arcEnd.y - C.y });
  const bendTan = { x: -bendOut.y, y: bendOut.x };
  const bendSteps = 5;
  const outer: Pt[] = outerArc.slice(0, -1);
  for (let i = 1; i <= bendSteps; i++) {
    const u = i / bendSteps;
    outer.push({
      x: arcEnd.x + (legTan.x - bendTan.x) * hemLegLen * 0.1 * u,
      y: arcEnd.y + (legTan.y - bendTan.y) * hemLegLen * 0.1 * u,
    });
  }
  outer.push(legEnd);

  const cavityHint: Pt = { x: -(n.x + chord.x * 0.35), y: -(n.y + chord.y * 0.35) };
  const inner = offsetStrokeTowardCavity(outer, gap, cavityHint);

  return [outer, inner];
}

/** Offset polyline perpendicular to tangent, chosen side toward cavity (gap visualization). */
function offsetStrokeTowardCavity(stroke: Pt[], gap: number, cavityHint: Pt): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < stroke.length; i++) {
    const prev = stroke[i - 1] ?? stroke[i]!;
    const next = stroke[i + 1] ?? stroke[i]!;
    const seg = { x: next.x - prev.x, y: next.y - prev.y };
    let t = vunit(seg);
    if (vlen(seg) < 1e-9) {
      const fb = { x: stroke[i]!.x - prev.x, y: stroke[i]!.y - prev.y };
      t = vlen(fb) >= 1e-9 ? vunit(fb) : { x: 1, y: 0 };
    }
    let inward = { x: -t.y, y: t.x };
    if (inward.x * cavityHint.x + inward.y * cavityHint.y < 0) {
      inward = { x: t.y, y: -t.x };
    }
    const p = stroke[i]!;
    out.push({ x: p.x + inward.x * gap, y: p.y + inward.y * gap });
  }
  return out;
}

function cubicSample(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
    out.push({ x, y });
  }
  return out;
}

/** Teardrop hem — toned-down bulb vs old preview (closer to catalog line weights). */
function teardropHemStroke(S: Pt, E: Pt, n: Pt, tu: Pt): Pt[] {
  const L = dist(S, E);
  const tip = { x: S.x + tu.x * L * 0.16, y: S.y + tu.y * L * 0.16 };
  const cp1 = { x: S.x + n.x * L * 0.62 + tu.x * L * 0.28, y: S.y + n.y * L * 0.62 + tu.y * L * 0.28 };
  const cp2 = { x: tip.x + n.x * L * 0.34 + tu.x * L * 0.36, y: tip.y + n.y * L * 0.34 + tu.y * L * 0.36 };
  return cubicSample(S, cp1, cp2, tip, 24);
}

function hemPreviewStrokesWorld(
  S: Pt,
  E: Pt,
  prevPt: Pt,
  kind: "closed" | "open_hem" | "teardrop",
  hemLegLen: number
): Pt[][] {
  const tu = vunit({ x: E.x - S.x, y: E.y - S.y });
  const n = hemBendNormal(S, E, prevPt);
  if (kind === "closed") return flatHemStrokes(S, E, n);
  if (kind === "open_hem") return openHemHookStrokes(S, E, prevPt, hemLegLen);
  return [teardropHemStroke(S, E, n, tu)];
}

function flattenStrokes(strokes: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const s of strokes) {
    for (const p of s) out.push(p);
  }
  return out;
}

export interface AcmPanelLinePreviewProps {
  /** Flat center width (in). */
  panelWidthIn: number;
  /** Flat center length (in). Not shown in the profile; used in caption only. */
  panelLengthIn: number;
  /** Flashing/tray side rows; flashing uses a single-edge fold chain. */
  boxSides?: BoxTraySideRow[];
  panelColorName: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  scale?: number;
  /** For add-to-cart screenshot capture (canvas `toDataURL`). */
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
}

function buildProfilePolyline(
  panelWidthIn: number,
  sides: BoxTraySideRow[]
): {
  points: Pt[];
  labels: { text: string; at: Pt; angleRad: number }[];
  segmentLensIn: number[];
  vertexAnglesDeg: number[];
  hemRender?: { type: "open_hem" | "closed" | "teardrop"; startIndex: number; endIndex: number };
  /** Hem outline samples (world inches) for fit bounds + drawing. */
  hemStrokesWorld?: Pt[][];
  hemBoundsPts?: Pt[];
} {
  const width = Math.max(0.01, Number(panelWidthIn) || 0.01);
  const n = normalizeBoxTraySidesForFlashing(sides);
  const rootEdge = n[0]?.edge ?? "east";
  const anchorRight = rootEdge === "east" || rootEdge === "north";

  // Base segment centered on origin.
  const left: Pt = { x: -width / 2, y: 0 };
  const right: Pt = { x: width / 2, y: 0 };
  const baseStart = anchorRight ? left : right;
  const baseEnd = anchorRight ? right : left;

  const pts: Pt[] = [baseStart, baseEnd];
  const labels: { text: string; at: Pt; angleRad: number }[] = [
    { text: "Flat center", at: midpoint(baseStart, baseEnd), angleRad: 0 },
  ];
  const segmentLensIn: number[] = [width];
  const vertexAnglesDeg: number[] = [];

  let dir = anchorRight ? 0 : Math.PI; // along the base, away from center
  for (let i = 0; i < n.length; i++) {
    const row = n[i]!;
    const H = Math.max(0.01, Number(row.flangeHeightIn) || 0.01);
    const a = clamp(Number(row.angleDeg) || 0, -180, 180);
    dir += (anchorRight ? 1 : -1) * degToRad(a);
    const p0 = pts[pts.length - 1]!;
    const p1 = { x: p0.x + Math.cos(dir) * H, y: p0.y + Math.sin(dir) * H };
    pts.push(p1);
    labels.push({ text: `F${i + 1}`, at: midpoint(p0, p1), angleRad: dir });
    segmentLensIn.push(H);
    vertexAnglesDeg.push(a);
  }

  // Hem is stored per-fold; only leaf folds have a free edge. Flashing is linear, so the last row is the leaf.
  let hemRender: { type: "open_hem" | "closed" | "teardrop"; startIndex: number; endIndex: number } | undefined;
  let hemStrokesWorld: Pt[][] | undefined;
  let hemBoundsPts: Pt[] | undefined;
  if (n.length > 0) {
    const last = n[n.length - 1]!;
    const hemType = last.hemType;
    const hemSize =
      typeof last.hemSizeIn === "number" && Number.isFinite(last.hemSizeIn) ? last.hemSizeIn : 0.5;
    if (hemType === "open_hem" || hemType === "closed" || hemType === "teardrop") {
      const a = 180;
      dir += (anchorRight ? 1 : -1) * degToRad(a);
      const p0 = pts[pts.length - 1]!;
      const p1 = { x: p0.x + Math.cos(dir) * hemSize, y: p0.y + Math.sin(dir) * hemSize };
      const prevForHem = pts.length >= 2 ? pts[pts.length - 2]! : baseStart;
      pts.push(p1);
      // Place the hem label near the hem start and rotate it perpendicular,
      // so it doesn't cover the hem end detail.
      const hemLabelAt = {
        x: p0.x + (p1.x - p0.x) * 0.35,
        y: p0.y + (p1.y - p0.y) * 0.35,
      };
      const hemLabel =
        hemType === "closed" ? "Flat hem" : hemType === "open_hem" ? "Open hem" : "Teardrop hem";
      labels.push({
        text: hemLabel,
        at: hemLabelAt,
        angleRad: dir + Math.PI / 2,
      });
      segmentLensIn.push(hemSize);
      vertexAnglesDeg.push(a);
      hemRender = { type: hemType, startIndex: pts.length - 2, endIndex: pts.length - 1 };
      hemStrokesWorld = hemPreviewStrokesWorld(p0, p1, prevForHem, hemType, hemSize);
      hemBoundsPts = flattenStrokes(hemStrokesWorld);
    }
  }

  return {
    points: pts,
    labels,
    segmentLensIn,
    vertexAnglesDeg,
    ...(hemRender ? { hemRender } : {}),
    ...(hemStrokesWorld ? { hemStrokesWorld } : {}),
    ...(hemBoundsPts ? { hemBoundsPts } : {}),
  };
}

export function AcmPanelLinePreview({
  panelWidthIn,
  panelLengthIn,
  boxSides = [],
  panelColorName,
  title = "Fold & bend preview",
  subtitle =
    "Scaled section-style preview (no rotation). Use +, −, and 1× to zoom. Hems use single centerlines like typical flashing drawings.",
  compact = false,
  scale = 1,
  canvasRef,
}: AcmPanelLinePreviewProps) {
  const safeScale = Number.isFinite(scale) ? clamp(scale, 0.5, 3) : 1;
  const viewportH = (compact ? PREVIEW_H_COMPACT : PREVIEW_H) * safeScale;
  const viewportW = PREVIEW_W * safeScale;

  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outCanvasRef = canvasRef ?? localCanvasRef;

  const [zoomMul, setZoomMul] = useState(1);
  /** Fixed orthographic orientation (shop-detail style). */
  const rot = 0;

  const { points, hemRender, hemStrokesWorld, hemBoundsPts } = useMemo(
    () => buildProfilePolyline(panelWidthIn, boxSides),
    [panelWidthIn, boxSides]
  );

  useEffect(() => {
    const canvas = outCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const rectW = parent?.clientWidth && parent.clientWidth > 0 ? parent.clientWidth : viewportW;
    const rectH = parent?.clientHeight && parent.clientHeight > 0 ? parent.clientHeight : viewportH;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(rectW * dpr);
    canvas.height = Math.floor(rectH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Zoom is for annotation readability, not geometry scaling.
    // Keep the profile fully inside the viewport at all times.
    const textZoom = clamp(zoomMul, 0.6, 2.2);
    const pad = 28 * textZoom;

    ctx.clearRect(0, 0, rectW, rectH);

    // Background.
    ctx.fillStyle = "#f4f5f7";
    ctx.fillRect(0, 0, rectW, rectH);

    const cx = rectW / 2;
    const cy = rectH / 2;

    // Center/scale using full profile + hem outline so folds and long returns stay in view.
    const fitPts: Pt[] = [...points, ...(hemBoundsPts ?? [])];

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of fitPts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const rotPts = fitPts.map((p) => {
      const x0 = p.x - midX;
      const y0 = p.y - midY;
      return { x: x0 * cosR - y0 * sinR, y: x0 * sinR + y0 * cosR };
    });

    let rMinX = Infinity,
      rMinY = Infinity,
      rMaxX = -Infinity,
      rMaxY = -Infinity;
    for (const p of rotPts) {
      rMinX = Math.min(rMinX, p.x);
      rMinY = Math.min(rMinY, p.y);
      rMaxX = Math.max(rMaxX, p.x);
      rMaxY = Math.max(rMaxY, p.y);
    }
    const rSpanX = Math.max(0.01, rMaxX - rMinX);
    const rSpanY = Math.max(0.01, rMaxY - rMinY);

    const scaleFit = Math.min((rectW - pad * 2) / rSpanX, (rectH - pad * 2) / rSpanY);
    const k = scaleFit;

    const tx = (p: Pt): Pt => {
      const x0 = p.x - midX;
      const y0 = p.y - midY;
      const xr = x0 * cosR - y0 * sinR;
      const yr = x0 * sinR + y0 * cosR;
      const x1 = (xr - (rMinX + rMaxX) / 2) * k;
      const y1 = (yr - (rMinY + rMaxY) / 2) * k;
      return { x: cx + x1, y: cy - y1 };
    };

    const screenPts = points.map(tx);

    const strokeColor = "#111827";
    const mainLw = Math.max(2.25, 3.1 * Math.min(1.12, textZoom));
    const hemLw = Math.max(1.35, 2 * Math.min(1.12, textZoom));

    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.miterLimit = 10;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = mainLw;

    ctx.beginPath();
    const p0 = tx(points[0]!);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < points.length; i++) {
      const p = tx(points[i]!);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    if (hemRender && hemStrokesWorld && hemStrokesWorld.length > 0) {
      const s = screenPts[hemRender.startIndex];
      const e = screenPts[hemRender.endIndex];
      if (s && e) {
        const bg = "#f4f5f7";
        ctx.strokeStyle = bg;
        ctx.lineWidth = mainLw + hemLw + 2;
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = hemLw;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const stroke of hemStrokesWorld) {
          if (stroke.length === 0) continue;
          ctx.beginPath();
          const pFirst = tx(stroke[0]!);
          ctx.moveTo(pFirst.x, pFirst.y);
          for (let j = 1; j < stroke.length; j++) {
            const q = tx(stroke[j]!);
            ctx.lineTo(q.x, q.y);
          }
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = strokeColor;
    for (const p of points) {
      const q = tx(p);
      ctx.beginPath();
      ctx.arc(q.x, q.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [outCanvasRef, viewportH, viewportW, points, zoomMul, hemRender, hemStrokesWorld, hemBoundsPts]);

  return (
    <section
      className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-4"
      aria-labelledby="acm-panel-line-preview-heading"
    >
      <h2
        id="acm-panel-line-preview-heading"
        className="text-[15px] font-medium uppercase tracking-wider text-gray-500"
      >
        {title}
      </h2>
      <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>

      <div
        className="relative mx-auto mt-3 overflow-hidden rounded-xl border border-gray-100 bg-[#f4f5f7]"
        style={{ height: viewportH, maxWidth: viewportW }}
      >
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-lg border border-gray-200/90 bg-white/95 p-0.5 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-md text-base font-semibold text-gray-800 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            aria-label="Zoom preview out"
            onClick={() => setZoomMul((z) => clamp(z / 1.14, 0.42, 3.1))}
          >
            −
          </button>
          <button
            type="button"
            className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-md text-base font-semibold text-gray-800 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            aria-label="Reset preview zoom"
            onClick={() => setZoomMul(1)}
          >
            1×
          </button>
          <button
            type="button"
            className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-md text-base font-semibold text-gray-800 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            aria-label="Zoom preview in"
            onClick={() => setZoomMul((z) => clamp(z * 1.14, 0.42, 3.1))}
          >
            +
          </button>
        </div>

        <canvas
          ref={(el) => {
            outCanvasRef.current = el;
          }}
          className="block h-full w-full cursor-default"
          aria-label="Line preview"
        />
      </div>
    </section>
  );
}

