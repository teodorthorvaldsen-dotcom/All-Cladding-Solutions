"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { BoxTraySideRow } from "@/types/boxTray";
import { normalizeBoxTraySidesForFlashing } from "@/lib/boxTray";

const PREVIEW_H = 360;
const PREVIEW_H_COMPACT = 240;
const PREVIEW_W = 520;

/** World-space padding around hem strokes when fitting the preview so the hook stays readable. */
const HEM_FOCUS_PAD_IN = 0.38;
/** Minimum on-screen size (px) for the hem bounding box’s larger axis when a hem is present. */
const MIN_HEM_AXIS_PX = 52;
/** Avoid extreme zoom when hem geometry is tiny (still prioritizes hem detail vs full overview). */
const MAX_HEM_FOCUS_VS_OVERVIEW = 36;
/** Default metal thickness (4 mm ACM) when callers omit explicit thickness. */
const DEFAULT_METAL_THICKNESS_IN = 4 / 25.4;

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

function sampleArc(C: Pt, R: number, a0: number, sweep: number, steps: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + sweep * t;
    out.push({ x: C.x + R * Math.cos(a), y: C.y + R * Math.sin(a) });
  }
  return out;
}

/** Pick ±π sweep so the arc leaves S tangent to `desiredTangent` (unit). */
function arcSweepFromTangent(S: Pt, C: Pt, desiredTangent: Pt): number {
  const rad = { x: S.x - C.x, y: S.y - C.y };
  const ccwTan = vunit({ x: -rad.y, y: rad.x });
  const cwTan = vunit({ x: rad.y, y: -rad.x });
  const want = vunit(desiredTangent);
  const ccwDot = ccwTan.x * want.x + ccwTan.y * want.y;
  const cwDot = cwTan.x * want.x + cwTan.y * want.y;
  if (ccwDot >= cwDot) return Math.PI;
  return -Math.PI;
}

type HemBendFrame = {
  f: Pt;
  n: Pt;
  r: number;
  C: Pt;
  a0: number;
  sweep: number;
  B: Pt;
  T: number;
};

/** Tight press-brake hem frame: flange dir `f`, inside radius ~T, 180° bend only. */
function hemBendFrame(S: Pt, E: Pt, prevPt: Pt, thicknessIn: number, hemLegLen: number): HemBendFrame {
  const T = Math.max(0.008, thicknessIn);
  const f = vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y });
  const n = hemBendNormal(S, E, prevPt);
  const r = clamp(T, 0.008, Math.min(T * 1.25, hemLegLen * 0.35));
  const C = { x: S.x + n.x * r, y: S.y + n.y * r };
  const a0 = Math.atan2(S.y - C.y, S.x - C.x);
  const sweep = arcSweepFromTangent(S, C, { x: -f.x, y: -f.y });
  const aB = a0 + sweep;
  const B = { x: C.x + r * Math.cos(aB), y: C.y + r * Math.sin(aB) };
  return { f, n, r, C, a0, sweep, B, T };
}

function appendLineSegment(path: Pt[], tip: Pt): Pt[] {
  const out = path.slice();
  const last = out[out.length - 1];
  if (!last || dist(last, tip) > 1e-5) out.push(tip);
  return out;
}

function hemReturnTip(
  S: Pt,
  f: Pt,
  n: Pt,
  r: number,
  T: number,
  hemLegLen: number,
  gapMul: number
): Pt {
  const backDist = clamp(2 * r - T * 0.12, r * 1.35, hemLegLen * 0.92);
  const offset = T * 0.45 + T * gapMul;
  return {
    x: S.x - f.x * backDist + n.x * offset,
    y: S.y - f.y * backDist + n.y * offset,
  };
}

function buildSheetMetalHemStroke(
  S: Pt,
  E: Pt,
  prevPt: Pt,
  kind: "closed" | "open_hem" | "teardrop",
  thicknessIn: number,
  hemLegLen: number
): Pt[] {
  const frame = hemBendFrame(S, E, prevPt, thicknessIn, hemLegLen);
  const { f, n, r, C, a0, sweep, B, T } = frame;

  const sweepMul = kind === "teardrop" ? 0.9 : 1;
  const arc = sampleArc(C, r, a0, sweep * sweepMul, kind === "teardrop" ? 16 : 18);
  const bendEnd = arc[arc.length - 1] ?? B;

  const gapMul = kind === "closed" ? 0.08 : kind === "open_hem" ? 1.35 : 2.4;
  const tip = hemReturnTip(S, f, n, r, T, hemLegLen, gapMul);

  let returnLen = clamp(hemLegLen - 2 * r, 2.5 * T, hemLegLen * 0.85);
  if (kind === "teardrop") returnLen *= 1.06;

  const parallelTip = {
    x: bendEnd.x + f.x * returnLen,
    y: bendEnd.y + f.y * returnLen,
  };
  const blend = kind === "closed" ? 0.22 : kind === "open_hem" ? 0.42 : 0.34;
  const mergedTip = {
    x: parallelTip.x * (1 - blend) + tip.x * blend,
    y: parallelTip.y * (1 - blend) + tip.y * blend,
  };

  return appendLineSegment(arc, mergedTip);
}

function hemPreviewStrokesWorld(
  S: Pt,
  E: Pt,
  prevPt: Pt,
  kind: "closed" | "open_hem" | "teardrop",
  thicknessIn: number,
  hemLegLen: number
): Pt[][] {
  return [buildSheetMetalHemStroke(S, E, prevPt, kind, thicknessIn, hemLegLen)];
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
  /** Sheet metal thickness (in); drives hem bend radius (~1T) and gaps. */
  materialThicknessIn?: number;
}

function buildProfilePolyline(
  panelWidthIn: number,
  sides: BoxTraySideRow[],
  materialThicknessIn: number
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
      hemStrokesWorld = hemPreviewStrokesWorld(
        p0,
        p1,
        prevForHem,
        hemType,
        materialThicknessIn,
        hemSize
      );
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
    "Scaled section-style preview (no rotation). Use +, −, and 1× for annotation zoom; when a hem is small vs the return, the view zooms to keep the hem outline readable.",
  compact = false,
  scale = 1,
  canvasRef,
  materialThicknessIn = DEFAULT_METAL_THICKNESS_IN,
}: AcmPanelLinePreviewProps) {
  const safeScale = Number.isFinite(scale) ? clamp(scale, 0.5, 3) : 1;
  const viewportH = (compact ? PREVIEW_H_COMPACT : PREVIEW_H) * safeScale;
  const viewportW = PREVIEW_W * safeScale;

  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outCanvasRef = canvasRef ?? localCanvasRef;

  const [zoomMul, setZoomMul] = useState(1);
  /** Fixed orthographic orientation (shop-detail style). */
  const rot = 0;

  const thicknessIn = Math.max(0.008, Number(materialThicknessIn) || DEFAULT_METAL_THICKNESS_IN);

  const { points, hemRender, hemStrokesWorld, hemBoundsPts } = useMemo(
    () => buildProfilePolyline(panelWidthIn, boxSides, thicknessIn),
    [panelWidthIn, boxSides, thicknessIn]
  );

  const hemFocusMeta = useMemo(() => {
    if (!hemBoundsPts?.length || !hemRender) return null;
    const hb = hemBoundsPts;
    let hMinX = Infinity,
      hMinY = Infinity,
      hMaxX = -Infinity,
      hMaxY = -Infinity;
    for (const p of hb) {
      hMinX = Math.min(hMinX, p.x);
      hMinY = Math.min(hMinY, p.y);
      hMaxX = Math.max(hMaxX, p.x);
      hMaxY = Math.max(hMaxY, p.y);
    }
    const s = points[hemRender.startIndex];
    const e = points[hemRender.endIndex];
    if (s) {
      hMinX = Math.min(hMinX, s.x);
      hMinY = Math.min(hMinY, s.y);
      hMaxX = Math.max(hMaxX, s.x);
      hMaxY = Math.max(hMaxY, s.y);
    }
    if (e) {
      hMinX = Math.min(hMinX, e.x);
      hMinY = Math.min(hMinY, e.y);
      hMaxX = Math.max(hMaxX, e.x);
      hMaxY = Math.max(hMaxY, e.y);
    }
    const pad = HEM_FOCUS_PAD_IN;
    hMinX -= pad;
    hMinY -= pad;
    hMaxX += pad;
    hMaxY += pad;
    const hSpanX = Math.max(0.02, hMaxX - hMinX);
    const hSpanY = Math.max(0.02, hMaxY - hMinY);
    /** Anchor zoom/pan on the flange free edge (hem starts here). Centroid of the hem bbox can sit far from F1 when the hook extends sideways, which looked “disconnected.” */
    const tip = points[hemRender.startIndex];
    const focusX = tip?.x ?? (hMinX + hMaxX) / 2;
    const focusY = tip?.y ?? (hMinY + hMaxY) / 2;
    return { focusX, focusY, hSpanX, hSpanY };
  }, [hemBoundsPts, hemRender, points]);

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
    const availW = rectW - pad * 2;
    const availH = rectH - pad * 2;

    let k = scaleFit;
    let tx: (p: Pt) => Pt;

    if (hemFocusMeta) {
      const { focusX, focusY, hSpanX, hSpanY } = hemFocusMeta;
      const kHem = Math.min(availW / hSpanX, availH / hSpanY);
      const hemLargerAxisPx = Math.max(hSpanX, hSpanY) * scaleFit;
      const needHemFocus =
        kHem > scaleFit * 1.06 || (Number.isFinite(hemLargerAxisPx) && hemLargerAxisPx < MIN_HEM_AXIS_PX);
      if (needHemFocus) {
        k = Math.min(kHem, scaleFit * MAX_HEM_FOCUS_VS_OVERVIEW);
        k = Math.max(k, MIN_HEM_AXIS_PX / Math.max(hSpanX, hSpanY, 0.01));
        tx = (p: Pt) => {
          const x1 = (p.x - focusX) * k;
          const y1 = (p.y - focusY) * k;
          return { x: cx + x1, y: cy - y1 };
        };
      } else {
        tx = (p: Pt) => {
          const x0 = p.x - midX;
          const y0 = p.y - midY;
          const xr = x0 * cosR - y0 * sinR;
          const yr = x0 * sinR + y0 * cosR;
          const x1 = (xr - (rMinX + rMaxX) / 2) * k;
          const y1 = (yr - (rMinY + rMaxY) / 2) * k;
          return { x: cx + x1, y: cy - y1 };
        };
      }
    } else {
      tx = (p: Pt) => {
        const x0 = p.x - midX;
        const y0 = p.y - midY;
        const xr = x0 * cosR - y0 * sinR;
        const yr = x0 * sinR + y0 * cosR;
        const x1 = (xr - (rMinX + rMaxX) / 2) * k;
        const y1 = (yr - (rMinY + rMaxY) / 2) * k;
        return { x: cx + x1, y: cy - y1 };
      };
    }

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
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.miterLimit = 8;
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
  }, [outCanvasRef, viewportH, viewportW, points, zoomMul, hemRender, hemStrokesWorld, hemBoundsPts, hemFocusMeta]);

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

