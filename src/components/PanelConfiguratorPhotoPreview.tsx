"use client";

import Image from "next/image";
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
  /** Nominal panel depth in inches (e.g. from thickness) */
  panelDepthIn: number;
  compact?: boolean;
};

export function PanelConfiguratorPhotoPreview({
  panelColor,
  panelWidthIn,
  panelHeightIn,
  panelDepthIn,
  compact = false,
}: PanelConfiguratorPhotoPreviewProps) {
  const uid = useId().replace(/:/g, "");

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

    const cx =
      (frontTopLeft.x + frontTopRight.x + frontBottomRight.x + frontBottomLeft.x) / 4;
    const cy =
      (frontTopLeft.y + frontTopRight.y + frontBottomRight.y + frontBottomLeft.y) / 4;

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
      cx,
      cy,
      downScale,
    };
  }, [panelWidthIn, panelHeightIn, panelDepthIn]);

  const faceGradId = `pf-${uid}-face`;
  const topGradId = `pf-${uid}-top`;
  const sideGradId = `pf-${uid}-side`;

  const sizeWarning =
    geometry.downScale < 1
      ? "Preview scaled slightly to fit this scene."
      : null;

  return (
    <div className={compact ? "flex flex-col gap-1.5" : "flex flex-col gap-2"}>
      {!compact && (
        <p className="text-[13px] text-gray-600">
          Live preview: color and size update from your configuration.
        </p>
      )}
      {compact && (
        <p className="text-[11px] leading-snug text-gray-600">
          Color & size match your selection.
        </p>
      )}

      <div
        className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-[#f5f5f4] shadow-inner"
        style={{ aspectRatio: "1400 / 1100" }}
      >
        <Image
          src="/acm-panel-preview-scene.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 420px"
          priority
          unoptimized
        />
        <svg
          viewBox={`0 0 ${geometry.viewW} ${geometry.viewH}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Panel preview ${panelWidthIn} by ${panelHeightIn} inches`}
        >
          <defs>
            <linearGradient id={faceGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={lightenColor(panelColor, 10)} />
              <stop offset="100%" stopColor={shadeColor(panelColor, -6)} />
            </linearGradient>
            <linearGradient id={topGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lightenColor(shadeColor(panelColor, -22), 6)} />
              <stop offset="100%" stopColor={shadeColor(panelColor, -32)} />
            </linearGradient>
            <linearGradient id={sideGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={lightenColor(shadeColor(panelColor, -38), 5)} />
              <stop offset="100%" stopColor={shadeColor(panelColor, -48)} />
            </linearGradient>
          </defs>

          <g style={{ mixBlendMode: "multiply" as const }} opacity={0.88}>
            <polygon
              points={polygonPoints([
                geometry.frontTopLeft,
                geometry.frontTopRight,
                geometry.topBackRight,
                geometry.topBackLeft,
              ])}
              fill={`url(#${topGradId})`}
            />
            <polygon
              points={polygonPoints([
                geometry.frontTopRight,
                geometry.topBackRight,
                geometry.sideBottomRight,
                geometry.frontBottomRight,
              ])}
              fill={`url(#${sideGradId})`}
            />
            <polygon
              points={polygonPoints([
                geometry.frontTopLeft,
                geometry.frontTopRight,
                geometry.frontBottomRight,
                geometry.frontBottomLeft,
              ])}
              fill={`url(#${faceGradId})`}
            />
          </g>

          <g
            style={{ mixBlendMode: "soft-light" as const }}
            opacity={0.35}
            pointerEvents="none"
          >
            <polygon
              points={polygonPoints([
                { x: geometry.frontTopLeft.x + 12, y: geometry.frontTopLeft.y + 10 },
                { x: geometry.frontTopRight.x - 12, y: geometry.frontTopRight.y + 6 },
                { x: geometry.frontBottomRight.x - 12, y: geometry.frontBottomRight.y - 12 },
                { x: geometry.frontBottomLeft.x + 12, y: geometry.frontBottomLeft.y - 12 },
              ])}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.5"
            />
          </g>

          <text
            x={geometry.cx}
            y={geometry.cy - 6}
            textAnchor="middle"
            className="fill-white"
            style={{
              fontSize: compact ? 26 : 34,
              fontWeight: 700,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              paintOrder: "stroke",
              stroke: "rgba(0,0,0,0.55)",
              strokeWidth: 5,
            }}
          >
            {`${panelWidthIn}" × ${panelHeightIn}"`}
          </text>
          <text
            x={geometry.cx}
            y={geometry.cy + (compact ? 22 : 30)}
            textAnchor="middle"
            className="fill-white"
            style={{
              fontSize: compact ? 17 : 21,
              fontWeight: 600,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              paintOrder: "stroke",
              stroke: "rgba(0,0,0,0.5)",
              strokeWidth: 4,
            }}
          >
            {`${panelDepthIn.toFixed(2)}" deep`}
          </text>
        </svg>
      </div>

      {sizeWarning && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] leading-snug text-amber-900">
          {sizeWarning}
        </p>
      )}
    </div>
  );
}
