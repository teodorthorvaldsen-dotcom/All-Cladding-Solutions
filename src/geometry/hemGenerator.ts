import { PIXELS_PER_INCH, type Point, vunit } from "./bendMath";

export type HemType = "closed" | "open";

/** Fixed canvas radius — ACM hems are visual details, not true-scale from material thickness. */
const HEM_OPEN_RADIUS = 5;
const HEM_CLOSED_RADIUS = 6;

function inwardNormal(S: Point, f: Point): Point {
  let n = { x: -f.y, y: f.x };
  const toCenter = { x: -S.x, y: -S.y };
  if (n.x * toCenter.x + n.y * toCenter.y < 0) {
    n = { x: f.y, y: -f.x };
  }
  return vunit(n);
}

function openReturnLegPx(legLength: number): number {
  const scale = PIXELS_PER_INCH;
  const safeLegLength = Math.max(legLength, 0.375);
  return Math.max(safeLegLength * scale * 3, 14);
}

/** Open hem in world SVG coordinates — return leg stays perpendicular to flange (inward). */
function createOpenHemWorld(S: Point, prev: Point, legLength: number): string {
  const f = vunit({ x: S.x - prev.x, y: S.y - prev.y });
  const n = inwardNormal(S, f);
  const r = HEM_OPEN_RADIUS;
  const returnLeg = openReturnLegPx(legLength);
  const mostlyVertical = Math.abs(f.y) > Math.abs(f.x);

  if (mostlyVertical) {
    const p1x = S.x + n.x * r;
    const p1y = S.y + n.y * r;
    const p2x = S.x + n.x * 2 * r + f.x * r * (S.x >= 0 ? -1 : 1);
    const p2y = S.y + n.y * 2 * r + f.y * r * (S.x >= 0 ? -1 : 1);
    const p3x = p2x + n.x * returnLeg;
    const p3y = p2y + n.y * returnLeg;
    const qx = S.x + n.x * 2 * r;
    const qy = S.y + n.y * 2 * r;
    return `M ${S.x} ${S.y} L ${p1x} ${p1y} Q ${qx} ${qy} ${p2x} ${p2y} L ${p3x} ${p3y}`;
  }

  const p1x = S.x;
  const p1y = S.y + r;
  const p2x = S.x + n.x * r;
  const p2y = S.y + 2 * r;
  const p3x = p2x + n.x * returnLeg;
  const p3y = p2y;
  const qx = S.x;
  const qy = S.y + 2 * r;
  return `M ${S.x} ${S.y} L ${p1x} ${p1y} Q ${qx} ${qy} ${p2x} ${p2y} L ${p3x} ${p3y}`;
}

function createClosedHemWorld(S: Point, prev: Point): string {
  const f = vunit({ x: S.x - prev.x, y: S.y - prev.y });
  const n = inwardNormal(S, f);
  const r = HEM_CLOSED_RADIUS;
  const closedGap = 1.5;
  const mostlyVertical = Math.abs(f.y) > Math.abs(f.x);

  if (mostlyVertical) {
    const p1x = S.x + n.x * r * 1.25;
    const p1y = S.y + n.y * r * 1.25;
    const p2x = S.x + n.x * (r * 1.25 + r) + f.x * r * (S.x >= 0 ? -1 : 1);
    const p2y = S.y + n.y * (r * 1.25 + r) + f.y * r * (S.x >= 0 ? -1 : 1);
    const p3x = S.x + n.x * closedGap;
    const p3y = p2y;
    const qx = S.x + n.x * (r * 1.25 + r);
    const qy = S.y + n.y * (r * 1.25 + r);
    return `M ${S.x} ${S.y} L ${p1x} ${p1y} Q ${qx} ${qy} ${p2x} ${p2y} L ${p3x} ${p3y}`;
  }

  const drop = r * 1.25;
  const p1x = S.x;
  const p1y = S.y + drop;
  const p2x = S.x + n.x * r;
  const p2y = S.y + drop + r;
  const p3x = S.x + n.x * closedGap;
  const p3y = p2y;
  const qx = S.x;
  const qy = S.y + drop + r;
  return `M ${S.x} ${S.y} L ${p1x} ${p1y} Q ${qx} ${qy} ${p2x} ${p2y} L ${p3x} ${p3y}`;
}

function openHemWorldPoints(S: Point, prev: Point, legLength: number): Point[] {
  const f = vunit({ x: S.x - prev.x, y: S.y - prev.y });
  const n = inwardNormal(S, f);
  const r = HEM_OPEN_RADIUS;
  const returnLeg = openReturnLegPx(legLength);
  const mostlyVertical = Math.abs(f.y) > Math.abs(f.x);

  if (mostlyVertical) {
    const p2x = S.x + n.x * 2 * r + f.x * r * (S.x >= 0 ? -1 : 1);
    const p2y = S.y + n.y * 2 * r + f.y * r * (S.x >= 0 ? -1 : 1);
    const p3x = p2x + n.x * returnLeg;
    const p3y = p2y + n.y * returnLeg;
    return [S, { x: S.x + n.x * r, y: S.y + n.y * r }, { x: p2x, y: p2y }, { x: p3x, y: p3y }];
  }

  const p2x = S.x + n.x * r;
  const p2y = S.y + 2 * r;
  return [S, { x: S.x, y: S.y + r }, { x: p2x, y: p2y }, { x: p2x + n.x * returnLeg, y: p2y }];
}

export function hemAttachTransform(
  S: Point,
  prevPt: Point
): { x: number; y: number; rotate: number; direction: "left" | "right" } {
  const f = vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y });
  const rotate = (Math.atan2(f.y, f.x) * 180) / Math.PI;
  const direction: "left" | "right" = S.x >= 0 ? "left" : "right";
  return { x: S.x, y: S.y, rotate, direction };
}

export function hemWorldBounds(
  S: Point,
  prevPt: Point,
  _thickness: number,
  legLength: number,
  type: HemType
): Point[] {
  if (type === "open") {
    return openHemWorldPoints(S, prevPt, legLength);
  }
  const f = vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y });
  const n = inwardNormal(S, f);
  const r = HEM_CLOSED_RADIUS;
  const xs = [S.x, S.x + n.x * r, S.x + n.x * 1.5];
  const ys = [S.y, S.y + r * 2.5, S.y + r * 3];
  return [
    S,
    { x: Math.min(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.max(...ys) },
  ];
}

export function buildHemSvgPath(
  S: Point,
  prevPt: Point,
  _thickness: number,
  legLength: number,
  type: HemType
): { pathD: string; x: number; y: number; rotate: number; type: HemType } {
  const pathD =
    type === "open"
      ? createOpenHemWorld(S, prevPt, legLength)
      : createClosedHemWorld(S, prevPt);
  return { pathD, x: 0, y: 0, rotate: 0, type };
}
