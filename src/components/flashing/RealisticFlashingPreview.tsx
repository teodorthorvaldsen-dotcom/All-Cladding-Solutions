"use client";

import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls } from "@react-three/drei";
import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { ProfileState } from "@/types/profile";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import { SwatchPreviewMaterial } from "@/components/three/SwatchPreviewMaterial";

export type RealisticFlashingPreviewHandle = {
  toPngDataUrl: () => string | undefined;
};

const PREVIEW_KEY_LIGHT = "#fff7f2";
const PREVIEW_FILL_LIGHT = "#ffffff";

type FlashingPart = {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
};

/** One box per flange so swatch images map per face like ACM panel 3D preview. */
function buildFlashingParts(profile: ProfileState): FlashingPart[] {
  const pieceLength = Math.max(0.1, profile.pieceLength);
  const thickness = Math.max(0.02, profile.thickness);
  const parts: FlashingPart[] = [];

  let headingDeg = 0;
  let hingeX = 0;
  let hingeZ = 0;

  const addFlange = (length: number) => {
    const flangeLen = Math.max(0, length);
    if (flangeLen <= 0) return;
    const rad = THREE.MathUtils.degToRad(headingDeg);
    const midX = hingeX + (Math.cos(rad) * flangeLen) / 2;
    const midZ = hingeZ + (Math.sin(rad) * flangeLen) / 2;
    parts.push({
      position: [midX, pieceLength / 2, midZ],
      rotation: [0, rad, 0],
      args: [flangeLen, pieceLength, thickness],
    });
    hingeX += Math.cos(rad) * flangeLen;
    hingeZ += Math.sin(rad) * flangeLen;
  };

  const walk = (seg: { length: number; angle: number }) => {
    headingDeg += seg.angle;
    addFlange(seg.length);
  };

  walk({ length: profile.baseWidth, angle: 0 });
  profile.segments.forEach((seg) => walk(seg));

  return parts;
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

function FlashingPanelMesh({
  profile,
  colorHex = "#5a5a5a",
  mapUrl,
}: {
  profile: ProfileState;
  colorHex?: string;
  mapUrl?: string;
}) {
  const parts = useMemo(() => buildFlashingParts(profile), [profile]);

  return (
    <group>
      {parts.map((p, i) => (
        <group key={i} position={p.position} rotation={p.rotation}>
          <mesh castShadow={false} receiveShadow={false}>
            <boxGeometry args={p.args} />
            <SwatchPreviewMaterial colorHex={colorHex} mapUrl={mapUrl} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

type RealisticFlashingPreviewProps = {
  colorHex?: string;
  colorSwatchImage?: string;
  colorName?: string;
};

const RealisticFlashingPreview = forwardRef<
  RealisticFlashingPreviewHandle,
  RealisticFlashingPreviewProps
>(function RealisticFlashingPreview(
  { colorHex = "#5a5a5a", colorSwatchImage, colorName },
  ref
) {
  const profile = useConfiguratorStore((s) => s.profile);
  const captureRef = useRef<(() => string | undefined) | null>(null);
  const mapUrl =
    colorSwatchImage && colorSwatchImage.length > 0 ? colorSwatchImage : undefined;

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
    <div className="h-[min(360px,42vh)] min-h-[280px] w-full overflow-hidden rounded-lg bg-[#f4f5f7]">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 38, near: 0.1, far: 5000, position: [2.3, 1.8, 2.5] }}
        shadows={false}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.08,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: "#f4f5f7" }}
      >
        <color attach="background" args={["#f4f5f7"]} />
        <GlCapture onReady={(fn) => { captureRef.current = fn; }} />
        <hemisphereLight color="#ffffff" groundColor="#ebe6e1" intensity={0.48} />
        <ambientLight intensity={0.32} color="#fefefe" />
        <directionalLight
          castShadow={false}
          color={PREVIEW_KEY_LIGHT}
          position={[6, 11, 8]}
          intensity={1.38}
        />
        <directionalLight
          castShadow={false}
          color={PREVIEW_FILL_LIGHT}
          position={[-6, 5, 6]}
          intensity={0.62}
        />
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.5} />
        </Suspense>

        <Bounds key={fitKey} fit clip observe margin={1.35} maxDuration={0.25}>
          <group rotation={[0, THREE.MathUtils.degToRad(-18), 0]}>
            <FlashingPanelMesh profile={profile} colorHex={colorHex} mapUrl={mapUrl} />
          </group>
        </Bounds>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.78}
          minDistance={0.5}
          maxDistance={500}
        />
      </Canvas>
      {colorName ? <p className="sr-only">3D preview color: {colorName}</p> : null}
    </div>
  );
});

export default RealisticFlashingPreview;
