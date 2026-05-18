"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { buildDimensionAnnotations } from "@/geometry/dimensionEngine";
import { generateProfile } from "@/geometry/profileGenerator";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import DimensionLayer from "./DimensionLayer";

const VIEW_PAD = 80;

function polylinePoints(pts: { x: number; y: number }[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(" ");
}

export type ProfileCanvasHandle = {
  toSvgDataUrl: () => string | undefined;
};

type ProfileCanvasProps = {
  canvasRef?: MutableRefObject<ProfileCanvasHandle | null>;
};

export default function ProfileCanvas({ canvasRef }: ProfileCanvasProps) {
  const profile = useConfiguratorStore((s) => s.profile);
  const svgRef = useRef<SVGSVGElement>(null);

  const geometry = useMemo(() => generateProfile(profile), [profile]);
  const dimensions = useMemo(
    () => buildDimensionAnnotations(geometry.segments),
    [geometry.segments]
  );

  const viewBox = useMemo(() => {
    const { minX, minY, maxX, maxY } = geometry.bounds;
    return `${minX - VIEW_PAD} ${minY - VIEW_PAD} ${maxX - minX + VIEW_PAD * 2} ${maxY - minY + VIEW_PAD * 2}`;
  }, [geometry.bounds]);

  useEffect(() => {
    if (!canvasRef) return;
    canvasRef.current = {
      toSvgDataUrl: () => {
        const el = svgRef.current;
        if (!el) return undefined;
        try {
          const xml = new XMLSerializer().serializeToString(el);
          return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
        } catch {
          return undefined;
        }
      },
    };
  }, [canvasRef, geometry]);

  return (
    <div className="flex h-full min-h-[420px] w-full flex-col">
      <div className="flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#fafafa]">
        <svg ref={svgRef} viewBox={viewBox} className="h-full w-full max-h-full" aria-label="Flashing profile">
          <g strokeLinecap="butt" strokeLinejoin="miter">
            {geometry.segments.map((seg) => (
              <line
                key={seg.isBase ? "base" : `fold-${seg.index}`}
                x1={seg.start.x}
                y1={seg.start.y}
                x2={seg.end.x}
                y2={seg.end.y}
                stroke="#111827"
                strokeWidth={5}
              />
            ))}

            {geometry.hems.map((hem) => (
              <polyline
                key={`hem-${hem.segmentIndex}`}
                points={polylinePoints(hem.points)}
                fill="none"
                stroke="#111827"
                strokeWidth={3.5}
              />
            ))}
          </g>

          <DimensionLayer dimensions={dimensions} />

          {geometry.vertices.map((v, i) => (
            <circle key={`v-${i}`} cx={v.x} cy={v.y} r={3.5} fill="#111827" />
          ))}
        </svg>
      </div>
    </div>
  );
}
