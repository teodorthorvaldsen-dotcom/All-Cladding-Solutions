"use client";

import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, Environment, Line, OrbitControls, Text } from "@react-three/drei";
import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { buildDimensionAnnotations } from "@/geometry/dimensionEngine";
import { generateProfile } from "@/geometry/profileGenerator";
import {
  buildFlashingParts,
  dimensionToWorld,
  type FlashingPart,
} from "@/geometry/flashing3DLayout";
import type { ProfileState } from "@/types/profile";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import { FlangeBoxMesh } from "@/components/three/SwatchPreviewMaterial";

export type RealisticFlashingPreviewHandle = {
  toPngDataUrl: () => string | undefined;
};

const PREVIEW_KEY_LIGHT = "#fff7f2";
const PREVIEW_FILL_LIGHT = "#ffffff";

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
  parts,
  colorHex = "#5a5a5a",
  mapUrl,
}: {
  parts: FlashingPart[];
  colorHex?: string;
  mapUrl?: string;
}) {
  return (
    <group>
      {parts.map((p, i) => (
        <group key={i} position={p.position} rotation={p.rotation}>
          <FlangeBoxMesh args={p.args} colorHex={colorHex} mapUrl={mapUrl} />
        </group>
      ))}
    </group>
  );
}

function FlashingDimensions3D({
  profile,
}: {
  profile: ProfileState;
}) {
  const { dimensions, worldDims } = useMemo(() => {
    const geometry = generateProfile(profile);
    const dims = buildDimensionAnnotations(geometry.segments);
    const world = dims.map((d) =>
      dimensionToWorld(d, profile.pieceLength, profile.thickness)
    );
    return { dimensions: dims, worldDims: world };
  }, [profile]);

  const fontSize = useMemo(
    () => THREE.MathUtils.clamp(Math.max(profile.baseWidth, profile.pieceLength) * 0.014, 0.1, 0.22),
    [profile.baseWidth, profile.pieceLength]
  );

  return (
    <group>
      {worldDims.map((d, i) => (
        <group key={dimensions[i]?.id ?? i}>
          <Line
            points={[d.lineStart, d.lineEnd]}
            color="#9ca3af"
            lineWidth={1}
            transparent
            opacity={0.95}
          />
          <Text
            position={d.label}
            fontSize={fontSize}
            color="#374151"
            fontWeight={700}
            anchorX="center"
            anchorY="middle"
            outlineWidth={fontSize * 0.12}
            outlineColor="#ffffff"
            maxWidth={2.5}
          >
            {d.text}
          </Text>
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

  const parts = useMemo(() => buildFlashingParts(profile), [profile]);

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
            <FlashingPanelMesh parts={parts} colorHex={colorHex} mapUrl={mapUrl} />
            <Suspense fallback={null}>
              <FlashingDimensions3D profile={profile} />
            </Suspense>
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
