import { PIXELS_PER_INCH, type Point, vunit } from "./bendMath";

export type HemType = "closed" | "open";

const HEM_OPEN_RADIUS = 5;

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

/** Closed hem — parallel top/return flanges with tight arc (local coords at flange tip). */
function createClosedHemPath(
  startX: number,
  startY: number,
  direction: "left" | "right",
  thickness: number,
  legLength: number
): string {
  const scale = PIXELS_PER_INCH;
  const safeLegLength = Math.max(legLength, 0.375);
  const t = thickness * scale;
  const closedGap = Math.max(t * 0.12, 2);
  const closedRadius = Math.max(t * 0.8, 5);
  const returnInset = closedRadius * 1.6;
  const returnLength = safeLegLength * scale;
  const dir = direction === "right" ? 1 : -1;

  const outerX = startX + returnLength * dir;
  const innerX = startX + returnInset * dir;
  const topY = startY;
  const bottomY = startY + closedRadius * 2;
  const returnY = bottomY - closedGap;

  return `
    M ${startX} ${topY}
    L ${outerX} ${topY}
    A ${closedRadius} ${closedRadius} 0 0 ${dir === 1 ? 1 : 0} ${outerX} ${bottomY}
    L ${innerX} ${bottomY}
    L ${innerX} ${returnY}
    L ${startX + closedRadius * 1.2 * dir} ${returnY}
  `.trim();
}

function localClosedHemBounds(thickness: number, legLength: number) {
  const scale = PIXELS_PER_INCH;
  const safeLegLength = Math.max(legLength, 0.375);
  const t = thickness * scale;
  const closedRadius = Math.max(t * 0.8, 5);
  const returnInset = closedRadius * 1.6;
  const returnLength = safeLegLength * scale;
  const bottomY = closedRadius * 2;
  const returnY = bottomY - Math.max(t * 0.12, 2);
  const endX = closedRadius * 1.2;
  const minX = Math.min(0, returnLength, returnInset, endX, -returnLength, -returnInset, -endX);
  const maxX = Math.max(0, returnLength, returnInset, endX, -returnLength, -returnInset, -endX);
  return { minX, maxX, minY: 0, maxY: Math.max(bottomY, returnY) };
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

function transformPoint(p: Point, origin: Point, rotateDeg: number): Point {
  const rad = (rotateDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: origin.x + p.x * cos - p.y * sin,
    y: origin.y + p.x * sin + p.y * cos,
  };
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
  thickness: number,
  legLength: number,
  type: HemType
): Point[] {
  if (type === "open") {
    return openHemWorldPoints(S, prevPt, legLength);
  }

  const { rotate } = hemAttachTransform(S, prevPt);
  const local = localClosedHemBounds(thickness, legLength);
  const corners: Point[] = [
    { x: local.minX, y: local.minY },
    { x: local.maxX, y: local.minY },
    { x: local.maxX, y: local.maxY },
    { x: local.minX, y: local.maxY },
    { x: 0, y: 0 },
  ];
  return corners.map((p) => transformPoint(p, S, rotate));
}

export function buildHemSvgPath(
  S: Point,
  prevPt: Point,
  thickness: number,
  legLength: number,
  type: HemType
): { pathD: string; x: number; y: number; rotate: number; type: HemType } {
  if (type === "open") {
    return {
      pathD: createOpenHemWorld(S, prevPt, legLength),
      x: 0,
      y: 0,
      rotate: 0,
      type,
    };
  }

  const attach = hemAttachTransform(S, prevPt);
  const pathD = createClosedHemPath(0, 0, attach.direction, thickness, legLength);
  return { pathD, x: attach.x, y: attach.y, rotate: attach.rotate, type };
}
