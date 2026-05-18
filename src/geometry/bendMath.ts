export type Point = { x: number; y: number };

export const PIXELS_PER_INCH = 40;

export function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function vlen(p: Point): number {
  return Math.hypot(p.x, p.y);
}

export function vunit(p: Point): Point {
  const L = vlen(p) || 1;
  return { x: p.x / L, y: p.y / L };
}

export function cross2d(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
