"use client";

import { useId, useMemo } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return { r: 220, g: 226, b: 230 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

function shadeColor(hex: string, percent: number) {
  const { r, g, b } = hexToRgb(hex);
  const factor = (100 + percent) / 100;
  return rgbToHex(r * factor, g * factor, b * factor);
}

function lightenColor(hex: string, percent: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * (percent / 100),
    g + (255 - g) * (percent / 100),
    b + (255 - b) * (percent / 100)
  );
}

function polygonPoints(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export type PanelConfiguratorPhotoPreviewProps = {
  panelColor: string;
  panelWidthIn: number;
  panelHeightIn: number;
  panelDepthIn: number;
  compact?: boolean;
};

function Rail({
  y,
  railGradId,
  railSlotsId,
}: {
  y: number;
  railGradId: string;
  railSlotsId: string;
}) {
  return (
    <g opacity={0.96}>
      <rect x="-40" y={y - 10} width="1480" height="20" fill={`url(#${railGradId})`} />
      <rect
        x="-40"
        y={y - 3}
        width="1480"
        height="6"
        fill={`url(#${railSlotsId})`}
        opacity={0.8}
      />
      <line
        x1="-40"
        y1={y - 10}
        x2="1440"
        y2={y - 10}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.4"
      />
      <line
        x1="-40"
        y1={y + 10}
        x2="1440"
        y2={y + 10}
        stroke="rgba(100,110,120,0.28)"
        strokeWidth="1.4"
      />
    </g>
  );
}

function Fastener({
  x,
  y,
  side,
  screwColor,
  fastenerGradId,
}: {
  x: number;
  y: number;
  side: "left" | "right";
  screwColor: string;
  fastenerGradId: string;
}) {
  const right = side === "right";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="0"
        y="0"
        width="52"
        height="62"
        rx="4"
        fill={`url(#${fastenerGradId})`}
        stroke="rgba(80,88,96,0.3)"
        strokeWidth="1.2"
      />
      <circle cx="13" cy="15" r="4" fill={screwColor} opacity={0.72} />
      <circle cx="39" cy="47" r="4" fill={screwColor} opacity={0.72} />
      {right ? (
        <g transform="translate(42,13)">
          <path
            d="M0 0 L0 36 L-11 36 L-11 27 L-6 23 L-6 10 L-11 6 L-11 0 Z"
            fill="#cfd5db"
            stroke="rgba(70,78,86,0.45)"
            strokeWidth="1"
          />
          <path
            d="M15 7 L0 7 L0 12 L9 12 L9 27 L0 27 L0 32 L15 32 Z"
            fill="#aeb5bd"
            stroke="rgba(70,78,86,0.35)"
            strokeWidth="1"
          />
        </g>
      ) : (
        <g transform="translate(9,13)">
          <path
            d="M15 0 L15 36 L26 36 L26 27 L21 23 L21 10 L26 6 L26 0 Z"
            fill="#cfd5db"
            stroke="rgba(70,78,86,0.45)"
            strokeWidth="1"
          />
          <path
            d="M0 7 L15 7 L15 12 L6 12 L6 27 L15 27 L15 32 L0 32 Z"
            fill="#aeb5bd"
            stroke="rgba(70,78,86,0.35)"
            strokeWidth="1"
          />
        </g>
      )}
      <line x1="2" y1="2" x2="50" y2="2" stroke="rgba(255,255,255,0.62)" strokeWidth="1.2" />
    </g>
  );
}

export function PanelConfiguratorPhotoPreview({
  panelColor,
  panelWidthIn,
  panelHeightIn,
  panelDepthIn,
  compact = false,
}: PanelConfiguratorPhotoPreviewProps) {
  const uid = useId().replace(/:/g, "");

  const colors = useMemo(
    () => ({
      front: panelColor,
      top: shadeColor(panelColor, -20),
      side: shadeColor(panelColor, -46),
      wallA: "#f7f7f6",
      wallB: "#ececeb",
      railA: "#e0e4e8",
      railB: "#b7bec6",
      railSlot: "rgba(120,128,138,0.52)",
      fastenerA: "#d9dee3",
      fastenerB: "#98a1aa",
      screw: "#7f8790",
      outline: "rgba(50,50,50,0.18)",
    }),
    [panelColor]
  );

  const scene = useMemo(() => {
    const viewW = 1400;
    const viewH = 1100;
    const panelLeft = 320;
    const panelTop = 360;
    const pxPerIn = 12.5;

    let panelW = panelWidthIn * pxPerIn;
    let panelH = panelHeightIn * pxPerIn;
    const maxW = 760;
    const maxH = 420;
    const minW = 180;
    const minH = 90;
    const fitScale = Math.min(1, maxW / panelW, maxH / panelH);
    panelW *= fitScale;
    panelH *= fitScale;
    panelW = clamp(panelW, minW, maxW);
    panelH = clamp(panelH, minH, maxH);

    const depth = clamp(panelDepthIn * 26, 14, 40);
    const skewY = clamp(depth * 0.36, 6, 16);
    const skewX = depth;

    const frontTL = { x: panelLeft, y: panelTop };
    const frontTR = { x: panelLeft + panelW, y: panelTop + skewY };
    const frontBR = { x: panelLeft + panelW, y: panelTop + skewY + panelH };
    const frontBL = { x: panelLeft, y: panelTop + panelH };
    const topBL = { x: panelLeft + skewX, y: panelTop - skewY };
    const topBR = { x: panelLeft + panelW + skewX, y: panelTop };
    const sideTR = { x: panelLeft + panelW + skewX, y: panelTop };
    const sideBR = { x: panelLeft + panelW + skewX, y: panelTop + panelH };

    const topRailY = panelTop + Math.max(22, panelH * 0.12);
    const bottomRailY = panelTop + panelH - Math.max(16, panelH * 0.08);
    const leftFastenerX = panelLeft - 54;
    const rightFastenerX = panelLeft + panelW + 18;
    const leftTopFastenerY = topRailY - 18;
    const leftBottomFastenerY = bottomRailY - 18;
    const rightTopFastenerY = topRailY - 2;
    const rightBottomFastenerY = bottomRailY - 2;

    const shadowDx = clamp(depth * 0.42, 6, 18);
    const shadowDy = clamp(depth * 0.72, 10, 24);

    return {
      viewW,
      viewH,
      frontTL,
      frontTR,
      frontBR,
      frontBL,
      topBL,
      topBR,
      sideTR,
      sideBR,
      topRailY,
      bottomRailY,
      leftFastenerX,
      rightFastenerX,
      leftTopFastenerY,
      leftBottomFastenerY,
      rightTopFastenerY,
      rightBottomFastenerY,
      shadowDx,
      shadowDy,
      wasScaled: fitScale < 1,
    };
  }, [panelWidthIn, panelHeightIn, panelDepthIn]);

  const wallGradId = `wallGrad-${uid}`;
  const railGradId = `railGrad-${uid}`;
  const panelFaceGradId = `panelFaceGrad-${uid}`;
  const panelTopGradId = `panelTopGrad-${uid}`;
  const panelSideGradId = `panelSideGrad-${uid}`;
  const fastenerGradId = `fastenerGrad-${uid}`;
  const wallTextureId = `wallTexture-${uid}`;
  const railSlotsId = `railSlots-${uid}`;
  const panelShadowId = `panelShadow-${uid}`;

  return (
    <div className={compact ? "flex flex-col gap-1.5" : "flex flex-col gap-2"}>
      {!compact && (
        <p className="text-[13px] text-gray-600">
          The panel in the scene changes size and color — no separate overlay.
        </p>
      )}
      {compact && (
        <p className="text-[11px] leading-snug text-gray-600">
          Panel color & size match your selection.
        </p>
      )}

      <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-[#eef1f4] shadow-inner"
        style={{ aspectRatio: "1400 / 1100" }}
      >
        <svg
          viewBox={`0 0 ${scene.viewW} ${scene.viewH}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`ACM panel preview ${panelWidthIn} by ${panelHeightIn} inches`}
        >
          <defs>
            <linearGradient id={wallGradId} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor={colors.wallA} />
              <stop offset="100%" stopColor={colors.wallB} />
            </linearGradient>
            <linearGradient id={railGradId} x1="0%" y1="0%" x2="0%" y2="1">
              <stop offset="0%" stopColor={colors.railA} />
              <stop offset="100%" stopColor={colors.railB} />
            </linearGradient>
            <linearGradient id={panelFaceGradId} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor={lightenColor(colors.front, 8)} />
              <stop offset="100%" stopColor={shadeColor(colors.front, -8)} />
            </linearGradient>
            <linearGradient id={panelTopGradId} x1="0%" y1="0%" x2="0%" y2="1">
              <stop offset="0%" stopColor={lightenColor(colors.top, 7)} />
              <stop offset="100%" stopColor={shadeColor(colors.top, -12)} />
            </linearGradient>
            <linearGradient id={panelSideGradId} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor={lightenColor(colors.side, 6)} />
              <stop offset="100%" stopColor={shadeColor(colors.side, -12)} />
            </linearGradient>
            <linearGradient id={fastenerGradId} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor={colors.fastenerA} />
              <stop offset="100%" stopColor={colors.fastenerB} />
            </linearGradient>
            <pattern id={wallTextureId} width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="5" r="0.75" fill="rgba(0,0,0,0.03)" />
              <circle cx="11" cy="8" r="0.55" fill="rgba(0,0,0,0.025)" />
              <circle cx="8" cy="13" r="0.5" fill="rgba(255,255,255,0.2)" />
            </pattern>
            <pattern id={railSlotsId} width="34" height="14" patternUnits="userSpaceOnUse">
              <ellipse cx="17" cy="7" rx="3" ry="1.35" fill={colors.railSlot} />
            </pattern>
            <filter id={panelShadowId} x="-30%" y="-30%" width="180%" height="180%">
              <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="rgba(0,0,0,0.14)" />
            </filter>
          </defs>

          <rect x="0" y="0" width={scene.viewW} height={scene.viewH} fill={`url(#${wallGradId})`} />
          <rect
            x="0"
            y="0"
            width={scene.viewW}
            height={scene.viewH}
            fill={`url(#${wallTextureId})`}
            opacity={0.9}
          />

          <Rail y={scene.topRailY} railGradId={railGradId} railSlotsId={railSlotsId} />
          <Rail y={scene.bottomRailY} railGradId={railGradId} railSlotsId={railSlotsId} />

          <g filter={`url(#${panelShadowId})`}>
            <polygon
              points={polygonPoints([
                { x: scene.frontTL.x + scene.shadowDx, y: scene.frontTL.y + scene.shadowDy },
                { x: scene.frontTR.x + scene.shadowDx, y: scene.frontTR.y + scene.shadowDy },
                { x: scene.frontBR.x + scene.shadowDx, y: scene.frontBR.y + scene.shadowDy },
                { x: scene.frontBL.x + scene.shadowDx, y: scene.frontBL.y + scene.shadowDy },
              ])}
              fill="rgba(0,0,0,0.09)"
              opacity={0.16}
            />

            <Fastener
              x={scene.leftFastenerX}
              y={scene.leftTopFastenerY}
              side="left"
              screwColor={colors.screw}
              fastenerGradId={fastenerGradId}
            />
            <Fastener
              x={scene.leftFastenerX}
              y={scene.leftBottomFastenerY}
              side="left"
              screwColor={colors.screw}
              fastenerGradId={fastenerGradId}
            />
            <Fastener
              x={scene.rightFastenerX}
              y={scene.rightTopFastenerY}
              side="right"
              screwColor={colors.screw}
              fastenerGradId={fastenerGradId}
            />
            <Fastener
              x={scene.rightFastenerX}
              y={scene.rightBottomFastenerY}
              side="right"
              screwColor={colors.screw}
              fastenerGradId={fastenerGradId}
            />

            <polygon
              points={polygonPoints([scene.frontTL, scene.frontTR, scene.topBR, scene.topBL])}
              fill={`url(#${panelTopGradId})`}
              stroke={colors.outline}
              strokeWidth="1.2"
            />
            <polygon
              points={polygonPoints([scene.frontTR, scene.topBR, scene.sideBR, scene.frontBR])}
              fill={`url(#${panelSideGradId})`}
              stroke={colors.outline}
              strokeWidth="1.2"
            />
            <polygon
              points={polygonPoints([scene.frontTL, scene.frontTR, scene.frontBR, scene.frontBL])}
              fill={`url(#${panelFaceGradId})`}
              stroke="rgba(255,255,255,0.58)"
              strokeWidth="2"
            />
            <polygon
              points={polygonPoints([
                { x: scene.frontTL.x + 10, y: scene.frontTL.y + 8 },
                { x: scene.frontTR.x - 10, y: scene.frontTR.y + 4 },
                { x: scene.frontBR.x - 10, y: scene.frontBR.y - 10 },
                { x: scene.frontBL.x + 10, y: scene.frontBL.y - 10 },
              ])}
              fill="none"
              stroke="rgba(255,255,255,0.24)"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>

      <p
        className={
          compact
            ? "text-center text-[10px] font-semibold tabular-nums text-gray-700"
            : "text-center text-[12px] font-semibold tabular-nums text-gray-800"
        }
      >
        {panelWidthIn}" × {panelHeightIn}" · {panelDepthIn.toFixed(2)}" deep
      </p>

      {scene.wasScaled && (
        <p
          className={
            compact
              ? "rounded-lg border border-[#f5d28c] bg-[#fff8e8] px-2 py-1.5 text-[10px] leading-snug text-[#9a6400]"
              : "rounded-xl border border-[#f5d28c] bg-[#fff8e8] px-3 py-2 text-[13px] text-[#9a6400]"
          }
        >
          Preview scaled slightly to fit this scene.
        </p>
      )}
    </div>
  );
}
