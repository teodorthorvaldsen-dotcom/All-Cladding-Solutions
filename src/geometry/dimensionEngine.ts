import { midpoint, PIXELS_PER_INCH, type Point } from "./bendMath";
import type { GeneratedSegment } from "./profileGenerator";

export type DimensionAnnotation = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  text: string;
  kind: "length" | "angle";
};

const DIM_OFFSET = 28;

function formatInches(lengthIn: number): string {
  const rounded = Math.round(lengthIn * 100) / 100;
  return `${rounded}"`;
}

function pushLengthDimension(
  out: DimensionAnnotation[],
  seg: GeneratedSegment,
  offsetIndex: number
) {
  const dx = seg.end.x - seg.start.x;
  const dy = seg.end.y - seg.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const off = DIM_OFFSET + (offsetIndex % 2) * 10;

  const x1 = seg.start.x + nx * off;
  const y1 = seg.start.y + ny * off;
  const x2 = seg.end.x + nx * off;
  const y2 = seg.end.y + ny * off;
  const mid = midpoint({ x: x1, y: y1 }, { x: x2, y: y2 });

  out.push({
    id: seg.isBase ? "len-base" : `len-${seg.index}`,
    x1,
    y1,
    x2,
    y2,
    labelX: mid.x,
    labelY: mid.y - 6,
    text: formatInches(seg.lengthIn),
    kind: "length",
  });
}

export function buildDimensionAnnotations(segments: GeneratedSegment[]): DimensionAnnotation[] {
  const out: DimensionAnnotation[] = [];

  const baseSeg = segments.find((s) => s.isBase);
  if (baseSeg) {
    pushLengthDimension(out, baseSeg, 0);
  }

  segments.forEach((seg, i) => {
    if (seg.isBase) return;
    pushLengthDimension(out, seg, i + 1);

    if (Math.abs(seg.angleDeg) > 0.01) {
      out.push({
        id: `ang-${seg.index}`,
        x1: seg.start.x,
        y1: seg.start.y,
        x2: seg.start.x + 36,
        y2: seg.start.y - 36,
        labelX: seg.start.x + 42,
        labelY: seg.start.y - 42,
        text: `${Math.round(seg.angleDeg)}°`,
        kind: "angle",
      });
    }
  });

  return out;
}

export function inchesFromPixels(px: number): number {
  return px / PIXELS_PER_INCH;
}
