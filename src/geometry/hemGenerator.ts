import { PIXELS_PER_INCH, type Point, vunit } from "./bendMath";

export type AcmHemType = "flattened" | "open" | "teardrop";

export interface HemPathOptions {
  startX: number;
  startY: number;
  direction: "left" | "right" | "up" | "down";
  thickness: number;
  legLength: number;
  type: AcmHemType;
}

/** Production-style ACM hem SVG path (explicit lines + arc; teardrop uses one quadratic). */
export function createHemPath({
  startX,
  startY,
  direction,
  thickness,
  legLength,
  type,
}: HemPathOptions): string {
  const t = thickness * PIXELS_PER_INCH;
  const radius = Math.max(t * 1.1, 6);
  const returnLength = legLength * PIXELS_PER_INCH;

  const gap =
    type === "flattened" ? t * 0.15 : type === "open" ? t * 1.25 : t * 2.2;

  const teardropOffset = type === "teardrop" ? radius * 0.45 : 0;

  if (direction === "right") {
    if (type !== "teardrop") {
      return `
        M ${startX} ${startY}
        L ${startX + returnLength} ${startY}
        A ${radius} ${radius} 0 0 1 ${startX + returnLength} ${startY + radius * 2}
        L ${startX + gap} ${startY + radius * 2}
      `.trim();
    }

    return `
      M ${startX} ${startY}
      L ${startX + returnLength} ${startY}
      A ${radius} ${radius} 0 0 1 ${startX + returnLength} ${startY + radius * 2}
      Q ${startX + returnLength * 0.5} ${startY + radius * 2 + teardropOffset} ${startX + gap} ${startY + radius * 2}
    `.trim();
  }

  if (direction === "left") {
    if (type !== "teardrop") {
      return `
        M ${startX} ${startY}
        L ${startX - returnLength} ${startY}
        A ${radius} ${radius} 0 0 0 ${startX - returnLength} ${startY + radius * 2}
        L ${startX - gap} ${startY + radius * 2}
      `.trim();
    }

    return `
      M ${startX} ${startY}
      L ${startX - returnLength} ${startY}
      A ${radius} ${radius} 0 0 0 ${startX - returnLength} ${startY + radius * 2}
      Q ${startX - returnLength * 0.5} ${startY + radius * 2 + teardropOffset} ${startX - gap} ${startY + radius * 2}
    `.trim();
  }

  if (direction === "down") {
    if (type !== "teardrop") {
      return `
        M ${startX} ${startY}
        L ${startX} ${startY + returnLength}
        A ${radius} ${radius} 0 0 1 ${startX + radius * 2} ${startY + returnLength}
        L ${startX + radius * 2} ${startY + gap}
      `.trim();
    }

    return `
      M ${startX} ${startY}
      L ${startX} ${startY + returnLength}
      A ${radius} ${radius} 0 0 1 ${startX + radius * 2} ${startY + returnLength}
      Q ${startX + radius * 2 + teardropOffset} ${startY + returnLength * 0.5} ${startX + radius * 2} ${startY + gap}
    `.trim();
  }

  if (direction === "up") {
    if (type !== "teardrop") {
      return `
        M ${startX} ${startY}
        L ${startX} ${startY - returnLength}
        A ${radius} ${radius} 0 0 0 ${startX + radius * 2} ${startY - returnLength}
        L ${startX + radius * 2} ${startY - gap}
      `.trim();
    }

    return `
      M ${startX} ${startY}
      L ${startX} ${startY - returnLength}
      A ${radius} ${radius} 0 0 0 ${startX + radius * 2} ${startY - returnLength}
      Q ${startX + radius * 2 + teardropOffset} ${startY - returnLength * 0.5} ${startX + radius * 2} ${startY - gap}
    `.trim();
  }

  return "";
}

export function hemAttachTransform(
  S: Point,
  prevPt: Point
): { x: number; y: number; rotate: number; direction: HemPathOptions["direction"] } {
  const f = vunit({ x: S.x - prevPt.x, y: S.y - prevPt.y });
  const rotate = (Math.atan2(-f.y, -f.x) * 180) / Math.PI;

  let direction: HemPathOptions["direction"] = "right";
  if (Math.abs(f.x) >= Math.abs(f.y)) {
    direction = f.x >= 0 ? "left" : "right";
  } else {
    direction = f.y >= 0 ? "up" : "down";
  }

  return { x: S.x, y: S.y, rotate, direction };
}

function localHemBounds(thickness: number, legLength: number, type: AcmHemType) {
  const t = thickness * PIXELS_PER_INCH;
  const radius = Math.max(t * 1.1, 6);
  const returnLength = legLength * PIXELS_PER_INCH;
  const gap =
    type === "flattened" ? t * 0.15 : type === "open" ? t * 1.25 : t * 2.2;
  const maxY = radius * 2 + (type === "teardrop" ? radius * 0.45 : 0);

  return {
    minX: Math.min(0, gap, returnLength, -returnLength),
    maxX: Math.max(0, gap, returnLength, -returnLength),
    minY: 0,
    maxY,
  };
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

/** World-space bounds for a hem attached at the free edge. */
export function hemWorldBounds(
  S: Point,
  prevPt: Point,
  thickness: number,
  legLength: number,
  type: AcmHemType
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
  type: AcmHemType
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
