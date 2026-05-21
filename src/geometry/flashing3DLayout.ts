import * as THREE from "three";
import type { DimensionAnnotation } from "@/geometry/dimensionEngine";
import { PIXELS_PER_INCH } from "@/geometry/bendMath";
import { degToRad } from "@/geometry/bendMath";
import type { ProfileState } from "@/types/profile";

export type FlashingPart = {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
};

/** Profile XZ plane (Y = piece length), centered like Drawing View. */
export function buildFlashingParts(profile: ProfileState): FlashingPart[] {
  const pieceLength = Math.max(0.1, profile.pieceLength);
  const thickness = Math.max(0.02, profile.thickness);
  const baseWidth = Math.max(0, profile.baseWidth);
  const parts: FlashingPart[] = [];

  if (baseWidth > 0) {
    parts.push({
      position: [0, pieceLength / 2, 0],
      rotation: [0, 0, 0],
      args: [baseWidth, pieceLength, thickness],
    });
  }

  let headingDeg = 0;
  let hingeX = baseWidth / 2;
  let hingeZ = 0;

  profile.segments.forEach((seg) => {
    headingDeg += seg.angle;
    const flangeLen = Math.max(0, seg.length);
    if (flangeLen <= 0) return;
    const rad = degToRad(headingDeg);
    const midX = hingeX + (Math.cos(rad) * flangeLen) / 2;
    const midZ = hingeZ + (Math.sin(rad) * flangeLen) / 2;
    parts.push({
      position: [midX, pieceLength / 2, midZ],
      rotation: [0, rad, 0],
      args: [flangeLen, pieceLength, thickness],
    });
    hingeX += Math.cos(rad) * flangeLen;
    hingeZ += Math.sin(rad) * flangeLen;
  });

  return parts;
}

export function profilePixelsToWorld(
  xPx: number,
  yPx: number,
  pieceLength: number,
  thickness: number
): THREE.Vector3 {
  const y =
    pieceLength / 2 + Math.max(0.02, thickness) / 2 + 0.08;
  return new THREE.Vector3(xPx / PIXELS_PER_INCH, y, yPx / PIXELS_PER_INCH);
}

export function dimensionToWorld(
  dim: DimensionAnnotation,
  pieceLength: number,
  thickness: number
): {
  text: string;
  label: THREE.Vector3;
  lineStart: THREE.Vector3;
  lineEnd: THREE.Vector3;
} {
  const lineY =
    pieceLength / 2 + Math.max(0.02, thickness) / 2 + 0.05;
  return {
    text: dim.text,
    label: profilePixelsToWorld(dim.labelX, dim.labelY, pieceLength, thickness),
    lineStart: new THREE.Vector3(
      dim.x1 / PIXELS_PER_INCH,
      lineY,
      dim.y1 / PIXELS_PER_INCH
    ),
    lineEnd: new THREE.Vector3(
      dim.x2 / PIXELS_PER_INCH,
      lineY,
      dim.y2 / PIXELS_PER_INCH
    ),
  };
}
