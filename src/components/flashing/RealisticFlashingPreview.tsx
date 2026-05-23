"use client";

import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls } from "@react-three/drei";
import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { buildFlashingParts } from "@/geometry/flashingHem3D";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import { SwatchPreviewMaterial } from "@/components/three/SwatchPreviewMaterial";

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
  colorHex = "#5a5a5a",
  mapUrl,
  parts,
}: {
  colorHex?: string;
  mapUrl?: string;
  parts: ReturnType<typeof buildFlashingParts>;
}) {
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

  const parts = useMemo(() => buildFlashingParts(profile), [profile]);

  useImperativeHandle(ref, () => ({
    toPngDataUrl: () => captureRef.current?.(),
  }));

  const fitKey = useMemo(() => {
    const segs = profile.segments.map((s) => `${s.length}:${s.angle}`).join(",");
    const hems = Object.entries(profile.hems)
      .map(([k, h]) => `${k}:${h.type}`)
      .join(",");
    const edgeHems = `L${profile.edgeHems.start.type}-R${profile.edgeHems.end.type}`;
    return `${profile.baseWidth}-${profile.pieceLength}-${segs}-${hems}-${edgeHems}`;
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

        <Bounds key={fitKey} fit clip observe margin={1.45} maxDuration={0.25}>
          <group rotation={[0, THREE.MathUtils.degToRad(-18), 0]}>
            <FlashingPanelMesh parts={parts} colorHex={colorHex} mapUrl={mapUrl} />
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
