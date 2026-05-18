import type { Hem, ProfileState } from "@/types/profile";
import { degToRad, PIXELS_PER_INCH, type Point } from "./bendMath";
import { generateHemPath, type HemKind } from "./hemGenerator";

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
  points: Point[];
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

function hemKindFromHem(hem: Hem): HemKind | null {
  if (!hem.enabled || hem.type === "none") return null;
  if (hem.type === "flattened") return "flattened";
  if (hem.type === "open") return "open";
  return "teardrop";
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
    current = next;
  });

  for (const [key, hem] of Object.entries(profile.hems)) {
    const segmentIndex = Number(key);
    const kind = hemKindFromHem(hem);
    if (kind === null || segmentIndex < 0 || segmentIndex >= profile.segments.length) continue;

    const foldSeg = segments.find((s) => s.index === segmentIndex);
    if (!foldSeg) continue;

    const S = foldSeg.end;
    const prevPt = foldSeg.start;
    const path = generateHemPath(S, prevPt, profile.thickness, kind, hem.length, hem.gap);
    hems.push({ segmentIndex, points: path });
  }

  const allPts = [
    ...vertices,
    ...hems.flatMap((h) => h.points),
  ];
  const bounds = boundsFromPoints(allPts);

  return { segments, hems, vertices, bounds };
}
