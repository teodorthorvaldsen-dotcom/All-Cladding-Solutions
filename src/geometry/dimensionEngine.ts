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

export function buildDimensionAnnotations(segments: GeneratedSegment[]): DimensionAnnotation[] {
  const out: DimensionAnnotation[] = [];

  segments.forEach((seg, i) => {
    if (seg.isBase) return;
    const dx = seg.end.x - seg.start.x;
    const dy = seg.end.y - seg.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const off = DIM_OFFSET + (i % 2) * 10;

    const x1 = seg.start.x + nx * off;
    const y1 = seg.start.y + ny * off;
    const x2 = seg.end.x + nx * off;
    const y2 = seg.end.y + ny * off;
    const mid = midpoint({ x: x1, y: y1 }, { x: x2, y: y2 });

    out.push({
      id: `len-${seg.index}`,
      x1,
      y1,
      x2,
      y2,
      labelX: mid.x,
      labelY: mid.y - 6,
      text: formatInches(seg.lengthIn),
      kind: "length",
    });

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
