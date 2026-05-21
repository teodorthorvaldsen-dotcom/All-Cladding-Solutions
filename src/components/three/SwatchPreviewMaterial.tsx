"use client";

import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo } from "react";

/** Swatch image on a panel face — same settings as ACM 3D preview. */
export function SwatchTexturedMaterial({ mapUrl }: { mapUrl: string }) {
  const tex = useTexture(mapUrl);
  useLayoutEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  }, [tex]);
  return (
    <meshStandardMaterial
      color="#ffffff"
      map={tex}
      metalness={0}
      roughness={0.82}
      envMapIntensity={0.42}
    />
  );
}

const SIDE_MAT_PROPS = {
  metalness: 0,
  roughness: 0.88,
  envMapIntensity: 0.25,
} as const;

function useSideMaterial(colorHex: string) {
  return useMemo(
    () => new THREE.MeshStandardMaterial({ color: colorHex, ...SIDE_MAT_PROPS }),
    [colorHex]
  );
}

/** Swatch image on +Y (broad top face); edges use flat color to avoid rainbow banding. */
export function FlangeBoxMesh({
  args,
  colorHex,
  mapUrl,
}: {
  args: [number, number, number];
  colorHex: string;
  mapUrl?: string;
}) {
  const sideMat = useSideMaterial(colorHex);
  if (mapUrl) {
    return (
      <Suspense
        fallback={
          <mesh castShadow={false} receiveShadow={false} material={sideMat}>
            <boxGeometry args={args} />
          </mesh>
        }
      >
        <FlangeBoxTextured args={args} mapUrl={mapUrl} sideMat={sideMat} />
      </Suspense>
    );
  }
  return (
    <mesh castShadow={false} receiveShadow={false} material={sideMat}>
      <boxGeometry args={args} />
    </mesh>
  );
}

function FlangeBoxTextured({
  args,
  mapUrl,
  sideMat,
}: {
  args: [number, number, number];
  mapUrl: string;
  sideMat: THREE.MeshStandardMaterial;
}) {
  const tex = useTexture(mapUrl);
  useLayoutEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  }, [tex]);
  const materials = useMemo(() => {
    const top = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      map: tex,
      metalness: 0,
      roughness: 0.82,
      envMapIntensity: 0.42,
    });
    return [sideMat, sideMat, top, sideMat, sideMat, sideMat];
  }, [sideMat, tex]);
  return (
    <mesh material={materials} castShadow={false} receiveShadow={false}>
      <boxGeometry args={args} />
    </mesh>
  );
}

export function SwatchPreviewMaterial({
  colorHex,
  mapUrl,
}: {
  colorHex: string;
  mapUrl?: string;
}) {
  if (mapUrl) {
    return (
      <Suspense
        fallback={
          <meshStandardMaterial
            color={colorHex}
            metalness={0}
            roughness={0.82}
            envMapIntensity={0.42}
          />
        }
      >
        <SwatchTexturedMaterial mapUrl={mapUrl} />
      </Suspense>
    );
  }
  return (
    <meshStandardMaterial
      color={colorHex}
      metalness={0}
      roughness={0.82}
      envMapIntensity={0.42}
    />
  );
}
