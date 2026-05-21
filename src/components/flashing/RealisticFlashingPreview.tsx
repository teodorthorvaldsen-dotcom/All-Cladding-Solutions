"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";

type SegmentInput = {
  length: number;
  angle: number;
};

type FlashingModelProps = {
  pieceLength: number;
  segments: SegmentInput[];
  thickness?: number;
  color?: string;
};

function buildProfile(segments: SegmentInput[], thickness: number): THREE.Shape {
  const outer: THREE.Vector2[] = [];
  let x = 0;
  let y = 0;
  outer.push(new THREE.Vector2(x, y));

  let currentAngle = 0;
  for (const seg of segments) {
    currentAngle += seg.angle;
    const r = THREE.MathUtils.degToRad(currentAngle);
    x += Math.cos(r) * seg.length;
    y += Math.sin(r) * seg.length;
    outer.push(new THREE.Vector2(x, y));
  }

  const inner: THREE.Vector2[] = [];
  for (let i = outer.length - 1; i >= 0; i--) {
    const p = outer[i]!;
    inner.push(new THREE.Vector2(p.x, p.y - thickness));
  }

  return new THREE.Shape([...outer, ...inner]);
}

function FlashingModel({
  pieceLength,
  segments,
  thickness = 0.06,
  color = "#5a5a5a",
}: FlashingModelProps) {
  const geometry = useMemo(() => {
    const shape = buildProfile(segments, thickness);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.1, pieceLength),
      bevelEnabled: false,
      steps: 1,
    });
    geo.rotateX(Math.PI / 2);
    geo.center();
    return geo;
  }, [pieceLength, segments, thickness]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        metalness={0.85}
        roughness={0.42}
        reflectivity={0.5}
      />
    </mesh>
  );
}

export type RealisticFlashingPreviewProps = {
  colorHex?: string;
  colorName?: string;
};

export default function RealisticFlashingPreview({
  colorHex = "#5a5a5a",
  colorName,
}: RealisticFlashingPreviewProps) {
  const profile = useConfiguratorStore((s) => s.profile);

  const flashing = useMemo(() => {
    const foldSegments = profile.segments.map((seg) => ({
      length: Math.max(0, seg.length),
      angle: seg.angle,
    }));

    return {
      pieceLength: Math.max(0.1, profile.pieceLength),
      segments: [{ length: Math.max(0, profile.baseWidth), angle: 0 }, ...foldSegments],
      thickness: Math.max(0.02, profile.thickness),
      color: colorHex,
    };
  }, [profile.baseWidth, profile.pieceLength, profile.segments, profile.thickness, colorHex]);

  return (
    <div className="h-[min(360px,42vh)] min-h-[280px] w-full overflow-hidden rounded-lg bg-[#dcdcdc]">
      <Canvas
        shadows
        camera={{
          position: [18, 8, 16],
          fov: 28,
        }}
      >
        <Environment preset="warehouse" />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[15, 20, 10]}
          intensity={2.5}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 5, -5]} intensity={0.6} />
        <group rotation={[0, THREE.MathUtils.degToRad(-18), 0]}>
          <FlashingModel {...flashing} />
        </group>
        <ContactShadows
          position={[0, -2.8, 0]}
          opacity={0.35}
          scale={40}
          blur={2.5}
          far={10}
        />
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={40}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      {colorName ? <p className="sr-only">3D preview color: {colorName}</p> : null}
    </div>
  );
}
