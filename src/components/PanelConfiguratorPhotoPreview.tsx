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
  gradId,
  slotsId,
  slotsOpacity = 0.75,
}: {
  y: number;
  gradId: string;
  slotsId: string;
  slotsOpacity?: number;
}) {
  return (
    <g>
      <rect x="-40" y={y - 10} width="1480" height="20" fill={`url(#${gradId})`} />
      <rect
        x="-40"
        y={y - 3}
        width="1480"
        height="6"
        fill={`url(#${slotsId})`}
        opacity={slotsOpacity}
      />
      <line
        x1="-40"
        y1={y - 10}
        x2="1440"
        y2={y - 10}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
      />
      <line
        x1="-40"
        y1={y + 10}
        x2="1440"
        y2={y + 10}
        stroke="rgba(120,126,134,0.35)"
        strokeWidth="1.5"
      />
    </g>
  );
}

function Fastener({
  x,
  y,
  side,
  screw,
  fastenerGradId,
}: {
  x: number;
  y: number;
  side: "left" | "right";
  screw: string;
  fastenerGradId: string;
}) {
  const isRight = side === "right";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="0"
        y="0"
        width="54"
        height="66"
        rx="4"
        fill={`url(#${fastenerGradId})`}
        stroke="rgba(80,88,96,0.35)"
        strokeWidth="1.2"
      />
      <circle cx="14" cy="16" r="4.2" fill={screw} opacity={0.75} />
      <circle cx="41" cy="50" r="4.2" fill={screw} opacity={0.75} />
      <g transform={isRight ? "translate(44,14)" : "translate(10,14)"}>
        {!isRight && (
          <>
            <path
              d="M16 0 L16 38 L28 38 L28 28 L23 24 L23 10 L28 6 L28 0 Z"
              fill="#cfd5db"
              stroke="rgba(70,78,86,0.45)"
              strokeWidth="1"
            />
            <path
              d="M0 7 L16 7 L16 12 L6 12 L6 28 L16 28 L16 33 L0 33 Z"
              fill="#aeb5bd"
              stroke="rgba(70,78,86,0.35)"
              strokeWidth="1"
            />
          </>
        )}
        {isRight && (
          <>
            <path
              d="M0 0 L0 38 L-12 38 L-12 28 L-7 24 L-7 10 L-12 6 L-12 0 Z"
              fill="#cfd5db"
              stroke="rgba(70,78,86,0.45)"
              strokeWidth="1"
            />
            <path
              d="M16 7 L0 7 L0 12 L10 12 L10 28 L0 28 L0 33 L16 33 Z"
              fill="#aeb5bd"
              stroke="rgba(70,78,86,0.35)"
              strokeWidth="1"
            />
          </>
        )}
      </g>
      <line x1="2" y1="2" x2="52" y2="2" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" />
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

  const panel = useMemo(
    () => ({
      front: panelColor,
      top: shadeColor(panelColor, -18),
      side: shadeColor(panelColor, -45),
      rail: "#cfd3d8",
      railDark: "#a9afb7",
      fastener: "#bcc3ca",
      fastenerDark: "#8f97a0",
      wall: "#f6f6f5",
      wallShadow: "#ededeb",
      outline: "rgba(60,60,60,0.18)",
      screw: "#7c838b",
    }),
    [panelColor]
  );

  const geometry = useMemo(() => {
    const viewW = 1400;
    const viewH = 1100;
    const frontLeft = 320;
    const frontTop = 300;
    const pxPerIn = 13.2;

    let widthPx = panelWidthIn * pxPerIn;
    let heightPx = panelHeightIn * pxPerIn;
    const maxWidthPx = 760;
    const maxHeightPx = 500;
    const minWidthPx = 180;
    const minHeightPx = 120;
    const widthScale = maxWidthPx / widthPx;
    const heightScale = maxHeightPx / heightPx;
    const downScale = Math.min(1, widthScale, heightScale);
    widthPx *= downScale;
    heightPx *= downScale;
    widthPx = clamp(widthPx, minWidthPx, maxWidthPx);
    heightPx = clamp(heightPx, minHeightPx, maxHeightPx);

    const depthPx = clamp(panelDepthIn * 28, 14, 44);
    const skewY = clamp(depthPx * 0.38, 6, 18);
    const skewX = depthPx;

    const frontTopLeft = { x: frontLeft, y: frontTop };
    const frontTopRight = { x: frontLeft + widthPx, y: frontTop + skewY };
    const frontBottomRight = { x: frontLeft + widthPx, y: frontTop + skewY + heightPx };
    const frontBottomLeft = { x: frontLeft, y: frontTop + heightPx };
    const topBackLeft = { x: frontLeft + skewX, y: frontTop - skewY };
    const topBackRight = { x: frontLeft + widthPx + skewX, y: frontTop };
    const sideTopRight = { x: frontLeft + widthPx + skewX, y: frontTop };
    const sideBottomRight = { x: frontLeft + widthPx + skewX, y: frontTop + heightPx };

    const topRailY = frontTop + Math.max(34, heightPx * 0.12);
    const bottomRailY = frontTop + heightPx - Math.max(18, heightPx * 0.08);
    const leftFastenerX = frontLeft - 86;
    const rightFastenerX = frontLeft + widthPx + 36;
    const leftTopFastenerY = topRailY - 15;
    const leftBottomFastenerY = bottomRailY - 15;
    const rightTopFastenerY = topRailY + Math.max(56, heightPx * 0.18);
    const rightBottomFastenerY = bottomRailY + Math.max(38, heightPx * 0.1);

    const shadowOffsetX = clamp(depthPx * 0.45, 8, 20);
    const shadowOffsetY = clamp(depthPx * 0.75, 10, 28);

    return {
      viewW,
      viewH,
      frontTopLeft,
      frontTopRight,
      frontBottomRight,
      frontBottomLeft,
      topBackLeft,
      topBackRight,
      sideTopRight,
      sideBottomRight,
      topRailY,
      bottomRailY,
      leftFastenerX,
      rightFastenerX,
      leftTopFastenerY,
      leftBottomFastenerY,
      rightTopFastenerY,
      rightBottomFastenerY,
      shadowOffsetX,
      shadowOffsetY,
      downScale,
    };
  }, [panelWidthIn, panelHeightIn, panelDepthIn]);

  const railGradId = `rg-${uid}`;
  const faceGradId = `pfg-${uid}`;
  const topGradId = `ptg-${uid}`;
  const sideGradId = `psg-${uid}`;

  const sizeWarning =
    geometry.downScale < 1 ? "Preview scaled slightly to fit this scene." : null;

  return (
    <div className={compact ? "flex flex-col gap-1.5" : "flex flex-col gap-2"}>
      {!compact && (
        <p className="text-[13px] text-gray-600">
          3D preview — panel size and color update from your configuration.
        </p>
      )}
      {compact && (
        <p className="text-[11px] leading-snug text-gray-600">
          Panel color & proportions match your selection.
        </p>
      )}

      <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-[#eef1f4] shadow-inner"
        style={{ aspectRatio: "1400 / 1100" }}
      >
        <svg
          viewBox={`0 0 ${geometry.viewW} ${geometry.viewH}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Panel ${panelWidthIn} by ${panelHeightIn} inches, ${panelDepthIn.toFixed(2)} inches deep`}
        >
          <defs>
            <linearGradient id={`wallGrad-${uid}`} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor={panel.wall} />
              <stop offset="100%" stopColor={panel.wallShadow} />
            </linearGradient>
            <linearGradient id={railGradId} x1="0%" y1="0%" x2="0%" y2="1">
              <stop offset="0%" stopColor="#e3e6ea" />
              <stop offset="50%" stopColor={panel.rail} />
              <stop offset="100%" stopColor={panel.railDark} />
            </linearGradient>
            <linearGradient id={`fg-${uid}`} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor="#dde2e7" />
              <stop offset="100%" stopColor={panel.fastenerDark} />
            </linearGradient>
            <linearGradient id={faceGradId} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor={lightenColor(panel.front, 8)} />
              <stop offset="100%" stopColor={shadeColor(panel.front, -8)} />
            </linearGradient>
            <linearGradient id={topGradId} x1="0%" y1="0%" x2="0%" y2="1">
              <stop offset="0%" stopColor={lightenColor(panel.top, 8)} />
              <stop offset="100%" stopColor={shadeColor(panel.top, -12)} />
            </linearGradient>
            <linearGradient id={sideGradId} x1="0%" y1="0%" x2="1" y2="1">
              <stop offset="0%" stopColor={lightenColor(panel.side, 6)} />
              <stop offset="100%" stopColor={shadeColor(panel.side, -12)} />
            </linearGradient>
            <filter id={`panelShadow-${uid}`} x="-30%" y="-30%" width="200%" height="200%">
              <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="rgba(0,0,0,0.15)" />
            </filter>
            <pattern id={`wallTexture-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="5" r="0.75" fill="rgba(0,0,0,0.04)" />
              <circle cx="12" cy="7" r="0.65" fill="rgba(0,0,0,0.03)" />
              <circle cx="7" cy="13" r="0.6" fill="rgba(0,0,0,0.03)" />
              <circle cx="15" cy="15" r="0.55" fill="rgba(255,255,255,0.25)" />
            </pattern>
            <pattern id={`rs-${uid}`} width="34" height="14" patternUnits="userSpaceOnUse">
              <ellipse cx="17" cy="7" rx="3.1" ry="1.4" fill="rgba(110,118,128,0.55)" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={geometry.viewW} height={geometry.viewH} fill={`url(#wallGrad-${uid})`} />
          <rect
            x="0"
            y="0"
            width={geometry.viewW}
            height={geometry.viewH}
            fill={`url(#wallTexture-${uid})`}
            opacity={0.9}
          />

          <g opacity={0.95}>
            <Rail y={geometry.topRailY} gradId={railGradId} slotsId={`rs-${uid}`} />
            <Rail y={geometry.bottomRailY} gradId={railGradId} slotsId={`rs-${uid}`} />
          </g>

          <g filter={`url(#panelShadow-${uid})`}>
            <Fastener
              x={geometry.leftFastenerX}
              y={geometry.leftTopFastenerY}
              side="left"
              screw={panel.screw}
              fastenerGradId={`fg-${uid}`}
            />
            <Fastener
              x={geometry.leftFastenerX}
              y={geometry.leftBottomFastenerY}
              side="left"
              screw={panel.screw}
              fastenerGradId={`fg-${uid}`}
            />
            <Fastener
              x={geometry.rightFastenerX}
              y={geometry.rightTopFastenerY}
              side="right"
              screw={panel.screw}
              fastenerGradId={`fg-${uid}`}
            />
            <Fastener
              x={geometry.rightFastenerX}
              y={geometry.rightBottomFastenerY}
              side="right"
              screw={panel.screw}
              fastenerGradId={`fg-${uid}`}
            />

            <polygon
              points={polygonPoints([
                {
                  x: geometry.frontTopLeft.x + geometry.shadowOffsetX,
                  y: geometry.frontTopLeft.y + geometry.shadowOffsetY,
                },
                {
                  x: geometry.frontTopRight.x + geometry.shadowOffsetX,
                  y: geometry.frontTopRight.y + geometry.shadowOffsetY,
                },
                {
                  x: geometry.frontBottomRight.x + geometry.shadowOffsetX,
                  y: geometry.frontBottomRight.y + geometry.shadowOffsetY,
                },
                {
                  x: geometry.frontBottomLeft.x + geometry.shadowOffsetX,
                  y: geometry.frontBottomLeft.y + geometry.shadowOffsetY,
                },
              ])}
              fill="rgba(0,0,0,0.08)"
              opacity={0.16}
            />

            <polygon
              points={polygonPoints([
                geometry.frontTopLeft,
                geometry.frontTopRight,
                geometry.topBackRight,
                geometry.topBackLeft,
              ])}
              fill={`url(#${topGradId})`}
              stroke={panel.outline}
              strokeWidth="1.2"
            />
            <polygon
              points={polygonPoints([
                geometry.frontTopRight,
                geometry.topBackRight,
                geometry.sideBottomRight,
                geometry.frontBottomRight,
              ])}
              fill={`url(#${sideGradId})`}
              stroke={panel.outline}
              strokeWidth="1.2"
            />
            <polygon
              points={polygonPoints([
                geometry.frontTopLeft,
                geometry.frontTopRight,
                geometry.frontBottomRight,
                geometry.frontBottomLeft,
              ])}
              fill={`url(#${faceGradId})`}
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2"
            />
            <polygon
              points={polygonPoints([
                { x: geometry.frontTopLeft.x + 10, y: geometry.frontTopLeft.y + 8 },
                { x: geometry.frontTopRight.x - 10, y: geometry.frontTopRight.y + 4 },
                { x: geometry.frontBottomRight.x - 10, y: geometry.frontBottomRight.y - 10 },
                { x: geometry.frontBottomLeft.x + 10, y: geometry.frontBottomLeft.y - 10 },
              ])}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
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

      {sizeWarning && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] leading-snug text-amber-900">
          {sizeWarning}
        </p>
      )}
    </div>
  );
}
