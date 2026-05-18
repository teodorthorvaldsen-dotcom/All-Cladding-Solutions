import { PIXELS_PER_INCH, type Point, vunit } from "./bendMath";

export type HemType = "closed" | "open";

/** Fixed canvas radius — ACM hems are visual details, not true-scale from material thickness. */
const HEM_VISUAL_RADIUS = 6;

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
  legLength,
  type,
}: HemOptions): string {
  const scale = PIXELS_PER_INCH;
  const safeLegLength = Math.max(legLength, 0.375);
  const radius = HEM_VISUAL_RADIUS;
  const dir = direction === "right" ? 1 : -1;
  const dirSign = dir === 1 ? -1 : 1;

  if (type === "closed") {
    const drop = radius * 1.25;
    const closedGap = 1.5;

    const x0 = startX;
    const y0 = startY;
    const y1 = y0 + drop;
    const x2 = x0 + radius * dirSign;
    const y2 = y1 + radius;
    const x3 = x0 + closedGap * dirSign;

    return `
      M ${x0} ${y0}
      L ${x0} ${y1}
      Q ${x0} ${y1 + radius} ${x2} ${y2}
      L ${x3} ${y2}
    `.trim();
  }

  const openRadius = 5;
  const hemLegPx = safeLegLength * scale;
  const returnLeg = Math.max(hemLegPx * 3, 14);
  const inward = dir === 1 ? -1 : 1;

  const x0 = startX;
  const y0 = startY;
  const x1 = x0;
  const y1 = y0 + openRadius;
  const x2 = x1 + openRadius * inward;
  const y2 = y1 + openRadius;
  const x3 = x2 + returnLeg * inward;
  const y3 = y2;

  return `
    M ${x0} ${y0}
    L ${x1} ${y1}
    Q ${x1} ${y2} ${x2} ${y2}
    L ${x3} ${y3}
  `.trim();
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

function localHemBounds(legLength: number, type: HemType) {
  const scale = PIXELS_PER_INCH;
  const safeLegLength = Math.max(legLength, 0.375);
  const radius = HEM_VISUAL_RADIUS;
  const dirSign = 1;

  if (type === "closed") {
    const drop = radius * 1.25;
    const closedGap = 1.5;
    const y1 = drop;
    const x2 = radius * dirSign;
    const y2 = y1 + radius;
    const x3 = closedGap * dirSign;
    const xs = [0, x2, x3, -x2, -x3];
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: 0, maxY: y2 };
  }

  const openRadius = 5;
  const hemLegPx = safeLegLength * scale;
  const returnLeg = Math.max(hemLegPx * 3, 14);
  const inward = -1;
  const y2 = openRadius + openRadius;
  const x2 = openRadius * inward;
  const x3 = x2 + returnLeg * inward;
  const xs = [0, x2, x3, -x2, -x3];
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: 0, maxY: y2 };
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
  _thickness: number,
  legLength: number,
  type: HemType
): Point[] {
  const { rotate } = hemAttachTransform(S, prevPt);
  const local = localHemBounds(legLength, type);
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
  const attach = hemAttachTransform(S, prevPt);
  const pathD = createHemPath({
    startX: 0,
    startY: 0,
    direction: attach.direction,
    thickness,
    legLength,
    type,
  });
  return { pathD, x: attach.x, y: attach.y, rotate: attach.rotate, type };
}
