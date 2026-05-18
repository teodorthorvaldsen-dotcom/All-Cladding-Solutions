import { PIXELS_PER_INCH, type Point, vunit } from "./bendMath";

export type HemType = "closed" | "open";

export interface HemOptions {
  startX: number;
  startY: number;
  direction: "left" | "right";
  thickness: number;
  legLength: number;
  type: HemType;
}

/** Engineered ACM hem SVG path — closed and open only. */
export function createHemPath({
  startX,
  startY,
  direction,
  thickness,
  legLength,
  type,
}: HemOptions): string {
  const scale = PIXELS_PER_INCH;

  const safeLegLength = Math.max(legLength, 0.375);
  const t = thickness * scale;
  const radius = Math.max(t * 0.9, 5);
  const returnLength = safeLegLength * scale;

  const dir = direction === "right" ? 1 : -1;

  if (type === "closed") {
    const closedGap = Math.max(t * 0.12, 2);
    const closedRadius = Math.max(t * 0.8, 5);
    const returnInset = closedRadius * 1.6;

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

  return `
    M ${startX} ${startY}
    L ${startX + returnLength * dir} ${startY}
    A ${radius} ${radius} 0 0 ${dir === 1 ? 1 : 0} ${startX + returnLength * dir} ${startY + radius * 2}
    L ${startX + radius * dir} ${startY + radius * 2}
  `.trim();
}

export function hemAttachTransform(
  S: Point,
  prevPt: Point
): { x: number; y: number; rotate: number } {
  const f = vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y });
  const rotate = (Math.atan2(-f.y, -f.x) * 180) / Math.PI;
  return { x: S.x, y: S.y, rotate };
}

function localHemBounds(thickness: number, legLength: number, type: HemType) {
  const scale = PIXELS_PER_INCH;
  const safeLegLength = Math.max(legLength, 0.375);
  const t = thickness * scale;
  const radius = Math.max(t * 0.9, 5);
  const returnLength = safeLegLength * scale;

  if (type === "closed") {
    const closedGap = Math.max(t * 0.12, 2);
    const closedRadius = Math.max(t * 0.8, 5);
    const returnInset = closedRadius * 1.6;
    const bottomY = closedRadius * 2;
    const returnY = bottomY - closedGap;
    const endX = closedRadius * 1.2;
    const minX = Math.min(0, returnLength, returnInset, endX, -returnLength, -returnInset, -endX);
    const maxX = Math.max(0, returnLength, returnInset, endX, -returnLength, -returnInset, -endX);
    return { minX, maxX, minY: 0, maxY: Math.max(bottomY, returnY) };
  }

  const gap = radius * 0.9;
  const maxY = radius * 2;
  const minX = Math.min(0, gap, radius, returnLength, -returnLength, -gap, -radius);
  const maxX = Math.max(0, gap, radius, returnLength, -returnLength, -gap, -radius);

  return { minX, maxX, minY: 0, maxY };
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

export function hemWorldBounds(
  S: Point,
  prevPt: Point,
  thickness: number,
  legLength: number,
  type: HemType
): Point[] {
  const { rotate } = hemAttachTransform(S, prevPt);
  const local = localHemBounds(thickness, legLength, type);
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
): { pathD: string; x: number; y: number; rotate: number } {
  const attach = hemAttachTransform(S, prevPt);
  const pathD = createHemPath({
    startX: 0,
    startY: 0,
    direction: "right",
    thickness,
    legLength,
    type,
  });
  return { pathD, x: attach.x, y: attach.y, rotate: attach.rotate };
}
