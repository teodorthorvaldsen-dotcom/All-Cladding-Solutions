"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
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
    geo.computeBoundingBox();
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

  const fitKey = `${flashing.pieceLength}-${flashing.segments.map((s) => `${s.length}:${s.angle}`).join(",")}`;

  return (
    <div className="h-[min(360px,42vh)] min-h-[280px] w-full overflow-hidden rounded-lg bg-white">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.1, far: 5000 }}
        gl={{ antialias: true }}
        style={{ background: "#ffffff" }}
      >
        <color attach="background" args={["#ffffff"]} />
        <Environment preset="studio" />
        <ambientLight intensity={0.65} />
        <directionalLight
          castShadow
          position={[15, 20, 10]}
          intensity={1.8}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 5, -5]} intensity={0.45} />

        <Bounds key={fitKey} fit clip observe margin={1.35} maxDuration={0.25}>
          <group rotation={[0, THREE.MathUtils.degToRad(-18), 0]}>
            <FlashingModel {...flashing} />
          </group>
        </Bounds>

        <ContactShadows
          position={[0, -0.05, 0]}
          opacity={0.2}
          scale={50}
          blur={2}
          far={20}
          color="#000000"
        />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.5}
          maxDistance={500}
        />
      </Canvas>
      {colorName ? <p className="sr-only">3D preview color: {colorName}</p> : null}
    </div>
  );
}
