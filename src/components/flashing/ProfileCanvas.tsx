"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { buildDimensionAnnotations } from "@/geometry/dimensionEngine";
import { generateProfile } from "@/geometry/profileGenerator";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import DimensionLayer from "./DimensionLayer";

const VIEW_PAD_DEFAULT = 80;
const VIEW_PAD_LARGE = 48;

export type ProfileCanvasHandle = {
  toSvgDataUrl: () => string | undefined;
};

type ProfileCanvasProps = {
  canvasRef?: MutableRefObject<ProfileCanvasHandle | null>;
  /** @deprecated Use `large` */
  compact?: boolean;
  large?: boolean;
};

export default function ProfileCanvas({
  canvasRef,
  compact = false,
  large = false,
}: ProfileCanvasProps) {
  const profile = useConfiguratorStore((s) => s.profile);
  const svgRef = useRef<SVGSVGElement>(null);

  const geometry = useMemo(() => generateProfile(profile), [profile]);
  const dimensions = useMemo(
    () => buildDimensionAnnotations(geometry.segments),
    [geometry.segments]
  );

  const isLarge = large || !compact;

  const viewBox = useMemo(() => {
    const pad = isLarge ? VIEW_PAD_LARGE : VIEW_PAD_DEFAULT;
    const { minX, minY, maxX, maxY } = geometry.bounds;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [geometry.bounds, isLarge]);

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

  const shellClass = isLarge
    ? "h-[min(420px,52vh)] min-h-[320px] w-full"
    : "h-[220px] w-full";
  const profileStroke = isLarge ? 4 : 5;

  return (
    <div className={shellClass}>
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-[#fafafa]">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Flashing profile"
        >
          <g id="profile-lines" strokeLinecap="butt" strokeLinejoin="miter">
            {geometry.segments.map((seg) => (
              <line
                key={seg.isBase ? "base" : `fold-${seg.index}`}
                x1={seg.start.x}
                y1={seg.start.y}
                x2={seg.end.x}
                y2={seg.end.y}
                stroke="#111827"
                strokeWidth={profileStroke}
              />
            ))}
            {geometry.vertices.map((v, i) => (
              <circle key={`v-${i}`} cx={v.x} cy={v.y} r={3.5} fill="#111827" />
            ))}
          </g>

          <g id="dimensions">
            <DimensionLayer dimensions={dimensions} />
          </g>

          <g id="hems">
            {geometry.hems.map((hem) => (
              <g
                key={`hem-${hem.segmentIndex}`}
                transform={
                  hem.x !== 0 || hem.y !== 0 || hem.rotate !== 0
                    ? `translate(${hem.x},${hem.y}) rotate(${hem.rotate})`
                    : undefined
                }
              >
                <path
                  d={hem.pathD}
                  fill="none"
                  stroke="#111827"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
