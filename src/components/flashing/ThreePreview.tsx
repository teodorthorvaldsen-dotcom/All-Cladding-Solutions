"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { generateProfile } from "@/geometry/profileGenerator";
import { PIXELS_PER_INCH } from "@/geometry/bendMath";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";

type FlashingMeshProps = {
  colorHex?: string;
};

function FlashingMesh({ colorHex = "#b8bcc4" }: FlashingMeshProps) {
  const profile = useConfiguratorStore((s) => s.profile);

  const { shape, depth, center } = useMemo(() => {
    const geom = generateProfile(profile);
    const shape = new THREE.Shape();
    const verts = geom.vertices;
    const unitScale = 1 / PIXELS_PER_INCH;

    if (verts.length < 2) {
      shape.moveTo(0, 0);
      shape.lineTo(1, 0);
      return { shape, depth: profile.pieceLength / 12 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const v of verts) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }

    const cx = ((minX + maxX) / 2) * unitScale;
    const cy = ((minY + maxY) / 2) * unitScale;

    shape.moveTo(verts[0]!.x * unitScale - cx, -(verts[0]!.y * unitScale - cy));
    for (let i = 1; i < verts.length; i++) {
      shape.lineTo(verts[i]!.x * unitScale - cx, -(verts[i]!.y * unitScale - cy));
    }

    const depth = Math.max(0.08, profile.pieceLength / 12);

    return { shape, depth };
  }, [profile]);

  const extrudeSettings = useMemo(
    () => ({
      depth,
      bevelEnabled: false,
    }),
    [depth]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, depth / 2, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={colorHex} metalness={0.35} roughness={0.5} />
    </mesh>
  );
}

type ThreePreviewProps = {
  compact?: boolean;
  colorHex?: string;
  colorName?: string;
};

export default function ThreePreview({
  compact = false,
  colorHex,
  colorName,
}: ThreePreviewProps) {
  const profile = useConfiguratorStore((s) => s.profile);
  const span = Math.max(profile.baseWidth, profile.pieceLength, 1);
  const cameraDistance = Math.max(4, span / 4 + 3);

  const heightClass = compact ? "h-[200px]" : "h-[min(280px,40vh)] min-h-[220px]";

  return (
    <div className={`${heightClass} w-full overflow-hidden rounded-lg bg-[#fafafa]`}>
      <Canvas camera={{ position: [cameraDistance, cameraDistance, cameraDistance], fov: 42 }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 10, 5]} intensity={1.4} />
        <directionalLight position={[-4, 6, -3]} intensity={0.45} />
        <FlashingMesh colorHex={colorHex} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
      {colorName ? (
        <p className="sr-only">3D preview color: {colorName}</p>
      ) : null}
    </div>
  );
}
