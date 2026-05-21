"use client";

import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { Suspense, useLayoutEffect } from "react";

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
