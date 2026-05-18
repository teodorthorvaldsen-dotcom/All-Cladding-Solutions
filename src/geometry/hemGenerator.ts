import { clamp, cross2d, dist, type Point, vunit } from "./bendMath";

export type HemKind = "flattened" | "open" | "teardrop";

function hemBendNormal(S: Point, E: Point, prevPt: Point): Point {
  const tu = vunit({ x: E.x - S.x, y: E.y - S.y });
  let n: Point = { x: -tu.y, y: tu.x };
  if (cross2d(tu, vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y })) < 0) {
    n = { x: tu.y, y: -tu.x };
  }
  return n;
}

function sampleArc(C: Point, R: number, a0: number, sweep: number, steps: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + sweep * t;
    out.push({ x: C.x + R * Math.cos(a), y: C.y + R * Math.sin(a) });
  }
  return out;
}

function arcSweepFromTangent(S: Point, C: Point, desiredTangent: Point): number {
  const rad = { x: S.x - C.x, y: S.y - C.y };
  const ccwTan = vunit({ x: -rad.y, y: rad.x });
  const cwTan = vunit({ x: rad.y, y: -rad.x });
  const want = vunit(desiredTangent);
  const ccwDot = ccwTan.x * want.x + ccwTan.y * want.y;
  const cwDot = cwTan.x * want.x + cwTan.y * want.y;
  return ccwDot >= cwDot ? Math.PI : -Math.PI;
}

/** Press-brake hem: tight 180° arc (~1T) + parallel return leg. */
export function generateHemPath(
  S: Point,
  prevPt: Point,
  thickness: number,
  type: HemKind,
  hemLength: number,
  gapOverride?: number
): Point[] {
  const T = Math.max(0.008, thickness);
  const f = vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y });
  const legLen = Math.max(hemLength, T * 4);
  const E: Point = { x: S.x - f.x * legLen, y: S.y - f.y * legLen };
  const n = hemBendNormal(S, E, prevPt);
  const r = clamp(T, 0.008, Math.min(T * 1.25, legLen * 0.35));
  const C = { x: S.x + n.x * r, y: S.y + n.y * r };
  const a0 = Math.atan2(S.y - C.y, S.x - C.x);
  const sweep = arcSweepFromTangent(S, C, { x: -f.x, y: -f.y });

  const kind =
    type === "flattened" ? "closed" : type === "open" ? "open_hem" : "teardrop";
  const sweepMul = kind === "teardrop" ? 0.9 : 1;
  const arc = sampleArc(C, r, a0, sweep * sweepMul, kind === "teardrop" ? 16 : 18);
  const bendEnd = arc[arc.length - 1]!;

  const gapMul =
    gapOverride !== undefined
      ? gapOverride / T
      : kind === "closed"
        ? 0.08
        : kind === "open_hem"
          ? 1.35
          : 2.4;

  const backDist = clamp(2 * r - T * 0.12, r * 1.35, legLen * 0.92);
  const offset = T * 0.45 + T * gapMul;
  const tip = {
    x: S.x - f.x * backDist + n.x * offset,
    y: S.y - f.y * backDist + n.y * offset,
  };

  let returnLen = clamp(legLen - 2 * r, 2.5 * T, legLen * 0.85);
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

  const path = arc.slice();
  const last = path[path.length - 1];
  if (!last || dist(last, mergedTip) > 1e-5) path.push(mergedTip);
  return path;
}

/** Scale hem polyline about the free edge for clearer section-view rendering. */
export function scaleHemPathAboutAnchor(path: Point[], anchor: Point, scale: number): Point[] {
  if (scale === 1) return path;
  return path.map((p) => ({
    x: anchor.x + (p.x - anchor.x) * scale,
    y: anchor.y + (p.y - anchor.y) * scale,
  }));
}
