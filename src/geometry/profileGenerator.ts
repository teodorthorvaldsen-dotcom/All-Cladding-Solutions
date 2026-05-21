import type { Hem, ProfileState } from "@/types/profile";
import { degToRad, PIXELS_PER_INCH, type Point } from "./bendMath";

export type GeneratedSegment = {
  index: number;
  start: Point;
  end: Point;
  lengthIn: number;
  angleDeg: number;
  isBase?: boolean;
};

export type GeneratedHem = {
  segmentIndex: number;
  type: "open" | "closed";
  label: string;
  x: number;
  y: number;
};

export type ProfileGeometry = {
  segments: GeneratedSegment[];
  hems: GeneratedHem[];
  vertices: Point[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
};

function boundsFromPoints(pts: Point[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) {
    return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
  }
  return { minX, minY, maxX, maxY };
}

function hemTypeFromHem(hem: Hem | undefined): "open" | "closed" | null {
  if (!hem || hem.type === "none") return null;
  if (hem.type === "closed") return "closed";
  if (hem.type === "open") return "open";
  return null;
}

export function generateProfile(profile: ProfileState): ProfileGeometry {
  const scale = PIXELS_PER_INCH;
  const segments: GeneratedSegment[] = [];
  const hems: GeneratedHem[] = [];
  const vertices: Point[] = [];

  const baseStart: Point = { x: (-profile.baseWidth / 2) * scale, y: 0 };
  const baseEnd: Point = { x: (profile.baseWidth / 2) * scale, y: 0 };
  vertices.push(baseStart, baseEnd);
  segments.push({
    index: -1,
    start: baseStart,
    end: baseEnd,
    lengthIn: profile.baseWidth,
    angleDeg: 0,
    isBase: true,
  });

  let current = baseEnd;
  let headingDeg = 0;

  profile.segments.forEach((segment, index) => {
    headingDeg += segment.angle;
    const rad = degToRad(headingDeg);
    const next: Point = {
      x: current.x + Math.cos(rad) * segment.length * scale,
      y: current.y + Math.sin(rad) * segment.length * scale,
    };
    segments.push({
      index,
      start: current,
      end: next,
      lengthIn: segment.length,
      angleDeg: segment.angle,
    });
    vertices.push(next);

    const hem = profile.hems[index];
    const hemType = hemTypeFromHem(hem);
    if (hemType) {
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const segLen = Math.hypot(dx, dy);
      const labelOffset = 22;
      let labelX: number;
      let labelY: number;
      if (segLen > 1e-6) {
        labelX = next.x + (-dy / segLen) * labelOffset;
        labelY = next.y + (dx / segLen) * labelOffset;
      } else {
        const rad = degToRad(headingDeg);
        labelX = next.x + -Math.sin(rad) * labelOffset;
        labelY = next.y + Math.cos(rad) * labelOffset;
      }
      hems.push({ segmentIndex: index, type: hemType, label: hemType, x: labelX, y: labelY });
    }

    current = next;
  });

  const boundPts: Point[] = [...vertices, ...hems.map((h) => ({ x: h.x, y: h.y }))];
  const bounds = boundsFromPoints(boundPts);

  return { segments, hems, vertices, bounds };
}
