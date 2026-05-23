import { degToRad } from "@/geometry/bendMath";
import type { BlankEdgeSide, Hem, ProfileState } from "@/types/profile";

export type FlashingPart = {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
};

function hemKind(hem: Hem | undefined): "open" | "closed" | null {
  if (!hem || hem.type === "none") return null;
  if (hem.type === "open" || hem.type === "closed") return hem.type;
  return null;
}

function toWorldXZ(
  originX: number,
  originZ: number,
  headingRad: number,
  localX: number,
  localZ: number
) {
  const cos = Math.cos(headingRad);
  const sin = Math.sin(headingRad);
  return {
    x: originX + cos * localX - sin * localZ,
    z: originZ + sin * localX + cos * localZ,
  };
}

function pushPart(
  parts: FlashingPart[],
  originX: number,
  originZ: number,
  headingRad: number,
  pieceLength: number,
  localX: number,
  localZ: number,
  args: [number, number, number]
) {
  const w = toWorldXZ(originX, originZ, headingRad, localX, localZ);
  parts.push({
    position: [w.x, pieceLength / 2, w.z],
    rotation: [0, headingRad, 0],
    args,
  });
}

/** Closed hem: short drop then return leg flush (0°) back toward the sheet. */
function appendClosedHem(
  parts: FlashingPart[],
  originX: number,
  originZ: number,
  headingRad: number,
  inwardLocalX: number,
  profile: ProfileState,
  hem: Hem
) {
  const t = Math.max(0.02, profile.thickness);
  const L = Math.max(0.1, profile.pieceLength);
  const offset = Math.max(t, 0.04);
  const hemReturn = Math.max(t * 2.5, Math.min(hem.length, 0.75));
  const topZ = t / 2;
  const edgeX = inwardLocalX * t * 0.35;

  pushPart(parts, originX, originZ, headingRad, L, edgeX, topZ + offset / 2, [t, L, offset]);
  pushPart(
    parts,
    originX,
    originZ,
    headingRad,
    L,
    edgeX + inwardLocalX * (hemReturn / 2),
    topZ + offset,
    [hemReturn, L, t]
  );
}

/** Open hem: drop, leg, and gap step (perpendicular return). */
function appendOpenHem(
  parts: FlashingPart[],
  originX: number,
  originZ: number,
  headingRad: number,
  inwardLocalX: number,
  profile: ProfileState,
  hem: Hem
) {
  const t = Math.max(0.02, profile.thickness);
  const L = Math.max(0.1, profile.pieceLength);
  const drop = 0.14;
  const leg = Math.max(0.2, Math.min(hem.length, 0.75));
  const gap = Math.max(t * 0.6, hem.gap, 0.03);
  const topZ = t / 2;
  const edgeX = inwardLocalX * t * 0.35;

  pushPart(parts, originX, originZ, headingRad, L, edgeX, topZ + drop / 2, [t, L, drop]);
  pushPart(parts, originX, originZ, headingRad, L, edgeX, topZ + drop + leg / 2, [t, L, leg]);
  pushPart(
    parts,
    originX,
    originZ,
    headingRad,
    L,
    edgeX + inwardLocalX * (gap / 2),
    topZ + drop + leg + gap / 2,
    [gap, L, t]
  );
}

function appendEdgeHem(
  parts: FlashingPart[],
  side: BlankEdgeSide,
  kind: "open" | "closed",
  profile: ProfileState,
  hem: Hem
) {
  const w = Math.max(0, profile.baseWidth);
  if (w <= 0) return;
  const originX = side === "start" ? -w / 2 : w / 2;
  const inwardLocalX = side === "start" ? 1 : -1;
  if (kind === "closed") {
    appendClosedHem(parts, originX, 0, 0, inwardLocalX, profile, hem);
  } else {
    appendOpenHem(parts, originX, 0, 0, inwardLocalX, profile, hem);
  }
}

function appendFoldTipHem(
  parts: FlashingPart[],
  tipX: number,
  tipZ: number,
  headingRad: number,
  kind: "open" | "closed",
  profile: ProfileState,
  hem: Hem
) {
  const inwardLocalX = -1;
  if (kind === "closed") {
    appendClosedHem(parts, tipX, tipZ, headingRad, inwardLocalX, profile, hem);
  } else {
    appendOpenHem(parts, tipX, tipZ, headingRad, inwardLocalX, profile, hem);
  }
}

export function buildFlashingParts(profile: ProfileState): FlashingPart[] {
  const pieceLength = Math.max(0.1, profile.pieceLength);
  const thickness = Math.max(0.02, profile.thickness);
  const parts: FlashingPart[] = [];

  const baseWidth = Math.max(0, profile.baseWidth);
  if (baseWidth > 0) {
    parts.push({
      position: [0, pieceLength / 2, 0],
      rotation: [0, 0, 0],
      args: [baseWidth, pieceLength, thickness],
    });
  }

  const startKind = hemKind(profile.edgeHems.start);
  if (startKind) appendEdgeHem(parts, "start", startKind, profile, profile.edgeHems.start);
  const endKind = hemKind(profile.edgeHems.end);
  if (endKind) appendEdgeHem(parts, "end", endKind, profile, profile.edgeHems.end);

  let headingDeg = 0;
  let hingeX = baseWidth / 2;
  let hingeZ = 0;

  profile.segments.forEach((seg, index) => {
    headingDeg += seg.angle;
    const rad = degToRad(headingDeg);
    const flangeLen = Math.max(0, seg.length);
    if (flangeLen > 0) {
      const midX = hingeX + (Math.cos(rad) * flangeLen) / 2;
      const midZ = hingeZ + (Math.sin(rad) * flangeLen) / 2;
      parts.push({
        position: [midX, pieceLength / 2, midZ],
        rotation: [0, rad, 0],
        args: [flangeLen, pieceLength, thickness],
      });
      hingeX += Math.cos(rad) * flangeLen;
      hingeZ += Math.sin(rad) * flangeLen;
    }

    const foldHem = profile.hems[index];
    const foldHemKind = hemKind(foldHem);
    if (foldHemKind && foldHem) {
      appendFoldTipHem(parts, hingeX, hingeZ, rad, foldHemKind, profile, foldHem);
    }
  });

  return parts;
}
