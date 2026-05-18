"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { generateProfile } from "@/geometry/profileGenerator";
import { PIXELS_PER_INCH } from "@/geometry/bendMath";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";

function FlashingMesh() {
  const profile = useConfiguratorStore((s) => s.profile);

  const { shape, depth } = useMemo(() => {
    const geom = generateProfile(profile);
    const shape = new THREE.Shape();
    const verts = geom.vertices;
    if (verts.length < 2) {
      shape.moveTo(0, 0);
      shape.lineTo(1, 0);
    } else {
      const scale = 1 / PIXELS_PER_INCH;
      shape.moveTo(verts[0]!.x * scale, -verts[0]!.y * scale);
      for (let i = 1; i < verts.length; i++) {
        shape.lineTo(verts[i]!.x * scale, -verts[i]!.y * scale);
      }
    }
    return { shape, depth: profile.pieceLength / 12 };
  }, [profile]);

  const extrudeSettings = useMemo(
    () => ({
      depth: Math.max(0.05, depth),
      bevelEnabled: false,
    }),
    [depth]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#b8bcc4" metalness={0.35} roughness={0.55} />
    </mesh>
  );
}

export default function ThreePreview() {
  return (
    <div className="h-full min-h-[280px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
      <Canvas camera={{ position: [6, 6, 6], fov: 42 }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 10, 5]} intensity={1.4} />
        <FlashingMesh />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
