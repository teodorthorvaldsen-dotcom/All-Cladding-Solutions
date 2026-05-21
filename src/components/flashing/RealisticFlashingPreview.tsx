"use client";

import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { ProfileState } from "@/types/profile";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";

export type RealisticFlashingPreviewHandle = {
  toPngDataUrl: () => string | undefined;
};

type SegmentInput = {
  length: number;
  angle: number;
};

type HemKind = "open" | "closed";

function appendHemToContour(
  outer: THREE.Vector2[],
  hemType: HemKind,
  headingDeg: number,
  sheetThickness: number
) {
  const last = outer[outer.length - 1]!;
  const rad = THREE.MathUtils.degToRad(headingDeg);
  const tx = Math.cos(rad);
  const ty = Math.sin(rad);
  const nx = -ty;
  const ny = tx;
  const drop = 0.14;
  const leg = 0.28;

  if (hemType === "open") {
    const hemGap = Math.max(sheetThickness * 0.6, 0.03);
    outer.push(new THREE.Vector2(last.x + nx * drop, last.y + ny * drop));
    outer.push(
      new THREE.Vector2(
        last.x + nx * (drop + leg),
        last.y + ny * (drop + leg)
      )
    );
    outer.push(
      new THREE.Vector2(
        last.x + tx * leg * 0.45 + nx * (drop + leg + hemGap),
        last.y + ty * leg * 0.45 + ny * (drop + leg + hemGap)
      )
    );
    return;
  }

  // Closed hem: 0° — fold straight back parallel to flange (flush, no extra bend).
  const offset = Math.max(sheetThickness, 0.04);
  const hemReturn = Math.max(sheetThickness * 2.5, 0.08);
  outer.push(new THREE.Vector2(last.x + nx * offset, last.y + ny * offset));
  outer.push(
    new THREE.Vector2(
      last.x + nx * offset - tx * hemReturn,
      last.y + ny * offset - ty * hemReturn
    )
  );
}

function buildProfile(
  baseWidth: number,
  foldSegments: SegmentInput[],
  hems: ProfileState["hems"],
  thickness: number
): THREE.Shape {
  const outer: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  let x = 0;
  let y = 0;
  let headingDeg = 0;

  const walk = (seg: SegmentInput) => {
    headingDeg += seg.angle;
    const r = THREE.MathUtils.degToRad(headingDeg);
    x += Math.cos(r) * seg.length;
    y += Math.sin(r) * seg.length;
    outer.push(new THREE.Vector2(x, y));
  };

  walk({ length: Math.max(0, baseWidth), angle: 0 });

  foldSegments.forEach((seg, foldIndex) => {
    walk(seg);
    const hem = hems[foldIndex];
    if (hem?.enabled && (hem.type === "open" || hem.type === "closed")) {
      appendHemToContour(outer, hem.type, headingDeg, thickness);
    }
  });

  const inner: THREE.Vector2[] = [];
  for (let i = outer.length - 1; i >= 0; i--) {
    const p = outer[i]!;
    inner.push(new THREE.Vector2(p.x, p.y - thickness));
  }

  return new THREE.Shape([...outer, ...inner]);
}

function GlCapture({
  onReady,
}: {
  onReady: (capture: () => string | undefined) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    onReady(() => {
      gl.render(scene, camera);
      try {
        return gl.domElement.toDataURL("image/png");
      } catch {
        return undefined;
      }
    });
  }, [gl, scene, camera, onReady]);

  return null;
}

function FlashingModel({
  profile,
  color = "#5a5a5a",
}: {
  profile: ProfileState;
  color?: string;
}) {
  const geometry = useMemo(() => {
    const foldSegments = profile.segments.map((seg) => ({
      length: Math.max(0, seg.length),
      angle: seg.angle,
    }));
    const thickness = Math.max(0.02, profile.thickness);
    const shape = buildProfile(profile.baseWidth, foldSegments, profile.hems, thickness);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.1, profile.pieceLength),
      bevelEnabled: false,
      steps: 1,
    });
    geo.rotateX(Math.PI / 2);
    geo.center();
    return geo;
  }, [profile]);

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

type RealisticFlashingPreviewProps = {
  colorHex?: string;
  colorName?: string;
};

const RealisticFlashingPreview = forwardRef<
  RealisticFlashingPreviewHandle,
  RealisticFlashingPreviewProps
>(function RealisticFlashingPreview({ colorHex = "#5a5a5a", colorName }, ref) {
  const profile = useConfiguratorStore((s) => s.profile);
  const captureRef = useRef<(() => string | undefined) | null>(null);

  useImperativeHandle(ref, () => ({
    toPngDataUrl: () => captureRef.current?.(),
  }));

  const fitKey = useMemo(() => {
    const segs = profile.segments.map((s) => `${s.length}:${s.angle}`).join(",");
    const hems = Object.entries(profile.hems)
      .map(([k, h]) => `${k}:${h.type}`)
      .join(",");
    return `${profile.baseWidth}-${profile.pieceLength}-${segs}-${hems}`;
  }, [profile]);

  return (
    <div className="h-[min(360px,42vh)] min-h-[280px] w-full overflow-hidden rounded-lg bg-white">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.1, far: 5000 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ background: "#ffffff" }}
      >
        <color attach="background" args={["#ffffff"]} />
        <GlCapture onReady={(fn) => { captureRef.current = fn; }} />
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
            <FlashingModel profile={profile} color={colorHex} />
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
});

export default RealisticFlashingPreview;
