"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  allWidths,
  colors,
  finishes,
  thicknesses,
  type ColorId,
  type ThicknessId,
} from "@/data/acm";
import { type QuoteDraft, QUOTE_DRAFT_STORAGE_KEY } from "@/types/quote";
import Link from "next/link";
import type { PanelType } from "@/lib/pricing";
import { useCart } from "@/context/CartContext";
import { ColorSwatches } from "./ColorSwatches";
import { MaterialCompositionDiagram } from "./MaterialCompositionDiagram";
import { PanelTypePicker } from "./PanelTypePicker";
import { PriceSummary } from "./PriceSummary";
import { QuantityPicker } from "./QuantityPicker";
import { SizePicker, type SizeSelection } from "./SizePicker";
import { ThicknessPicker } from "./ThicknessPicker";

const defaultSize: SizeSelection = {
  widthId: "custom",
  widthIn: 62,
  lengthIn: 96,
};

const MIN_WIDTH_IN = 12;
const MAX_WIDTH_IN = 62;
const MIN_LENGTH_IN = 12;
const MAX_LENGTH_IN = 190;

type PanelStateMap = Record<string, string>;

interface ProjectExampleProps {
  activeHex: string;
}

type PanelDef = {
  id: string;
  pts: string;
};

type FacadePanel = {
  id: string;
  points: string;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(ax: number, ay: number, bx: number, by: number, t: number) {
  return { x: lerp(ax, bx, t), y: lerp(ay, by, t) };
}

function buildGridPanels(
  idPrefix: string,
  rows: number,
  cols: number,
  tl: { x: number; y: number },
  tr: { x: number; y: number },
  bl: { x: number; y: number },
  br: { x: number; y: number }
): PanelDef[] {
  const panels: PanelDef[] = [];

  for (let r = 0; r < rows; r += 1) {
    const tTop0 = r / rows;
    const tTop1 = (r + 1) / rows;

    const leftTop = lerpPoint(tl.x, tl.y, bl.x, bl.y, tTop0);
    const rightTop = lerpPoint(tr.x, tr.y, br.x, br.y, tTop0);
    const leftBottom = lerpPoint(tl.x, tl.y, bl.x, bl.y, tTop1);
    const rightBottom = lerpPoint(tr.x, tr.y, br.x, br.y, tTop1);

    for (let c = 0; c < cols; c += 1) {
      const s0 = c / cols;
      const s1 = (c + 1) / cols;

      const p1 = lerpPoint(leftTop.x, leftTop.y, rightTop.x, rightTop.y, s0);
      const p2 = lerpPoint(leftTop.x, leftTop.y, rightTop.x, rightTop.y, s1);
      const p3 = lerpPoint(leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y, s1);
      const p4 = lerpPoint(leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y, s0);

      panels.push({
        id: `${idPrefix}-R${r + 1}-C${c + 1}`,
        pts: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`,
      });
    }
  }

  return panels;
}

function ProjectExampleMahwahFord({ activeHex }: ProjectExampleProps) {
  const materials: Record<string, string> = {
    default: activeHex,
    micaGrey: "#6b7280",
    marineAluminum: "#bfc5c9",
    charcoal: "#374151",
    black: "#111827",
    white: "#f8fafc",
  };

  const [activeMaterial, setActiveMaterial] = useState<string>("micaGrey");
  const [panelState, setPanelState] = useState<PanelStateMap>({});
  const [hovered, setHovered] = useState<string | null>(null);

  const materialEntries = Object.entries(materials);

  const lineY = (x: number, x1: number, y1: number, x2: number, y2: number) => {
    if (x2 === x1) return y1;
    const t = (x - x1) / (x2 - x1);
    return lerp(y1, y2, t);
  };

  const pt = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;

  const quadPoints = (
    x1: number,
    x2: number,
    topFn: (x: number) => number,
    bottomFn: (x: number) => number
  ) => {
    return [
      pt(x1, topFn(x1)),
      pt(x2, topFn(x2)),
      pt(x2, bottomFn(x2)),
      pt(x1, bottomFn(x1)),
    ].join(" ");
  };

  const centroidFromPoints = (points: string) => {
    const coords = points.split(" ").map((p) => p.split(",").map(Number));
    const sum = coords.reduce(
      (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / coords.length,
      y: sum.y / coords.length,
    };
  };

  const createBandPanels = ({
    xCuts,
    topFn,
    bottomFn,
    rowLabel,
    face,
  }: {
    xCuts: number[];
    topFn: (x: number) => number;
    bottomFn: (x: number) => number;
    rowLabel: string;
    face: string;
  }): FacadePanel[] => {
    const result: FacadePanel[] = [];
    for (let i = 0; i < xCuts.length - 1; i += 1) {
      const x1 = xCuts[i];
      const x2 = xCuts[i + 1];
      result.push({
        id: `${face}-${rowLabel}-C${i + 1}`,
        points: quadPoints(x1, x2, topFn, bottomFn),
      });
    }
    return result;
  };

  const panelData = useMemo<FacadePanel[]>(() => {
    const panels: FacadePanel[] = [];

    // Full upper sloped canopy band
    const r0 = (x: number) => lineY(x, 265, 58, 1005, 258);
    const r1 = (x: number) => lineY(x, 265, 182, 1005, 332);
    const r2 = (x: number) => lineY(x, 265, 292, 1005, 401);

    // Mid lower band that continues farther right but drops at the notch
    const r3 = (x: number) => {
      if (x <= 875) return lineY(x, 265, 414, 875, 448);
      return lineY(x, 875, 448, 1005, 472);
    };

    // Lower left facade only
    const r4 = (x: number) => lineY(x, 265, 530, 705, 554);
    const r5 = (x: number) => lineY(x, 265, 608, 705, 575);

    // Left return strip
    const l0 = (x: number) => lineY(x, 235, 78, 265, 58);
    const l1 = (x: number) => lineY(x, 235, 198, 265, 182);
    const l2 = (x: number) => lineY(x, 235, 311, 265, 292);
    const l3 = (x: number) => lineY(x, 235, 431, 265, 414);
    const l4 = (x: number) => lineY(x, 235, 545, 265, 530);
    const l5 = (x: number) => lineY(x, 235, 628, 265, 608);

    // Right vestibule visible side
    const v0 = (x: number) => lineY(x, 875, 292, 1000, 306);
    const v1 = (x: number) => lineY(x, 875, 332, 1000, 350);
    const v2 = (x: number) => lineY(x, 875, 402, 1000, 418);
    const v3 = (x: number) => lineY(x, 875, 448, 1000, 460);

    // Left thin return strip (ACM-1)
    const leftReturnCuts = [235, 265];
    panels.push(
      ...createBandPanels({
        xCuts: leftReturnCuts,
        topFn: l0,
        bottomFn: l1,
        rowLabel: "R1",
        face: "ACM1",
      }),
      ...createBandPanels({
        xCuts: leftReturnCuts,
        topFn: l1,
        bottomFn: l2,
        rowLabel: "R2",
        face: "ACM1",
      }),
      ...createBandPanels({
        xCuts: leftReturnCuts,
        topFn: l2,
        bottomFn: l3,
        rowLabel: "R3",
        face: "ACM1",
      }),
      ...createBandPanels({
        xCuts: leftReturnCuts,
        topFn: l3,
        bottomFn: l4,
        rowLabel: "R4",
        face: "ACM1",
      }),
      ...createBandPanels({
        xCuts: leftReturnCuts,
        topFn: l4,
        bottomFn: l5,
        rowLabel: "R5",
        face: "ACM1",
      })
    );

    // Main upper sloped facade rows
    const upperCuts = [265, 445, 590, 710, 820, 905, 960, 1005];
    panels.push(
      ...createBandPanels({
        xCuts: upperCuts,
        topFn: r0,
        bottomFn: r1,
        rowLabel: "R1",
        face: "MAIN",
      }),
      ...createBandPanels({
        xCuts: upperCuts,
        topFn: r1,
        bottomFn: r2,
        rowLabel: "R2",
        face: "MAIN",
      }),
      ...createBandPanels({
        xCuts: upperCuts,
        topFn: r2,
        bottomFn: r3,
        rowLabel: "R3",
        face: "MAIN",
      })
    );

    // Lower left facade rows under the canopy
    const lowerCuts1 = [265, 445, 590, 705];
    panels.push(
      ...createBandPanels({
        xCuts: lowerCuts1,
        topFn: r3,
        bottomFn: r4,
        rowLabel: "R4",
        face: "LOWER",
      }),
      ...createBandPanels({
        xCuts: lowerCuts1,
        topFn: r4,
        bottomFn: r5,
        rowLabel: "R5",
        face: "LOWER",
      })
    );

    // Right vestibule side panels
    const vestibuleCuts = [875, 940, 975, 1000];
    panels.push(
      ...createBandPanels({
        xCuts: vestibuleCuts,
        topFn: v0,
        bottomFn: v1,
        rowLabel: "R1",
        face: "VEST",
      }),
      ...createBandPanels({
        xCuts: vestibuleCuts,
        topFn: v1,
        bottomFn: v2,
        rowLabel: "R2",
        face: "VEST",
      }),
      ...createBandPanels({
        xCuts: vestibuleCuts,
        topFn: v2,
        bottomFn: v3,
        rowLabel: "R3",
        face: "VEST",
      })
    );

    return panels;
  }, []);

  const setPanel = (id: string) => {
    setPanelState((prev) => ({ ...prev, [id]: activeMaterial }));
  };

  const fillAllPanels = () => {
    const all: PanelStateMap = {};
    panelData.forEach((panel) => {
      all[panel.id] = activeMaterial;
    });
    setPanelState(all);
  };

  const resetPanels = () => {
    setPanelState({});
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {materialEntries.map(([key, color]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMaterial(key)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm ${
                activeMaterial === key
                  ? "border-gray-900 bg-white"
                  : "border-gray-300 bg-white"
              }`}
              title={key}
            >
              <span
                className="h-4 w-4 rounded-full border border-gray-400"
                style={{ background: color }}
              />
              <span className="text-gray-800">{key}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fillAllPanels}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
          >
            Fill all
          </button>
          <button
            type="button"
            onClick={resetPanels}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-inner">
        <svg viewBox="0 0 1150 700" className="h-auto w-full">
          {/* Background */}
          <rect x="0" y="0" width="1150" height="700" fill="#ececec" />

          {/* Left roof / metal panel system */}
          <polygon
            points="55,355 235,198 265,182 265,246 55,390"
            fill="#8b8b8b"
          />
          <g opacity="0.5">
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                x1={55}
                y1={355 + i * 2}
                x2={265}
                y2={182 + i * 4}
                stroke="#666"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Left wall and storefront */}
          <polygon points="115,390 235,311 235,628 115,566" fill="#bdbdbd" />
          <polygon points="146,420 230,365 230,610 146,566" fill="#d7d7d7" />
          <polygon points="185,440 225,414 225,585 185,612" fill="#f8fafc" />
          <polygon points="149,455 181,434 181,594 149,613" fill="#ffffff" />
          <rect x="185" y="505" width="4" height="18" fill="#8b8b8b" />

          {/* Main building mass behind panels */}
          <polygon
            points="265,58 1005,258 1005,306 875,292 875,332 705,320 705,575 265,608"
            fill="#2b2b2b"
          />

          {/* Under-canopy dark band */}
          <polygon
            points="705,320 875,332 1005,306 1005,350 875,380 705,365"
            fill="#1f2937"
          />

          {/* Glazing below canopy */}
          <polygon
            points="706,365 875,380 875,558 706,575"
            fill="#f7f7f7"
            stroke="#c7c7c7"
            strokeWidth="2"
          />
          <line
            x1="790"
            y1="372"
            x2="790"
            y2="565"
            stroke="#c7c7c7"
            strokeWidth="2"
          />
          <line
            x1="875"
            y1="380"
            x2="875"
            y2="558"
            stroke="#c7c7c7"
            strokeWidth="2"
          />

          {/* Right vestibule glazing */}
          <polygon
            points="875,380 1005,350 1005,535 875,558"
            fill="#efefef"
            stroke="#c7c7c7"
            strokeWidth="2"
          />
          <line
            x1="940"
            y1="365"
            x2="940"
            y2="546"
            stroke="#c7c7c7"
            strokeWidth="2"
          />
          <line
            x1="875"
            y1="438"
            x2="1005"
            y2="418"
            stroke="#c7c7c7"
            strokeWidth="2"
          />
          <line
            x1="875"
            y1="494"
            x2="1005"
            y2="474"
            stroke="#c7c7c7"
            strokeWidth="2"
          />

          {/* Curved feature panel */}
          <path
            d="M1000 164
               Q1070 350 1020 610
               L955 582
               Q1015 350 955 194
               Z"
            fill="#cfd4dc"
            stroke="#6b7280"
            strokeWidth="2"
          />

          {/* Monument sign / entry blade */}
          <polygon
            points="1048,150 1110,132 1138,585 1086,610"
            fill="#9b9b9b"
            stroke="#7c7c7c"
            strokeWidth="2"
          />
          <polygon
            points="1104,465 1140,462 1142,612 1107,612"
            fill="#7d7d7d"
          />

          {/* PANEL OVERLAY */}
          {panelData.map((panel) => {
            const fill = materials[panelState[panel.id]] || activeHex;
            const isHovered = hovered === panel.id;
            const centroid = centroidFromPoints(panel.points);

            return (
              <g key={panel.id}>
                <polygon
                  points={panel.points}
                  fill={fill}
                  stroke={isHovered ? "#111827" : "#6b7280"}
                  strokeWidth={isHovered ? 2.5 : 1.4}
                  opacity="0.97"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPanel(panel.id);
                  }}
                  onMouseEnter={() => setHovered(panel.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                />

                <polyline
                  points={panel.points}
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="0.8"
                  pointerEvents="none"
                />

                {isHovered && (
                  <>
                    <circle
                      cx={centroid.x}
                      cy={centroid.y}
                      r="3"
                      fill="#111827"
                      pointerEvents="none"
                    />
                    <rect
                      x={centroid.x + 8}
                      y={centroid.y - 22}
                      rx="6"
                      ry="6"
                      width={panel.id.length * 7.2 + 16}
                      height="22"
                      fill="rgba(17,24,39,0.92)"
                      pointerEvents="none"
                    />
                    <text
                      x={centroid.x + 16}
                      y={centroid.y - 7}
                      fontSize="12"
                      fill="#ffffff"
                      pointerEvents="none"
                    >
                      {panel.id}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Click area to paint all facade panels at once */}
          <polygon
            points="235,78 265,58 1005,258 1005,472 875,448 705,554 705,575 265,608 235,628"
            fill="transparent"
            onClick={fillAllPanels}
            style={{ cursor: "pointer" }}
          />

          {/* Guide labels */}
          <text x="30" y="30" fontSize="22" fill="#202020" fontWeight="600">
            ACM-1 PANELS
          </text>
          <text x="555" y="82" fontSize="22" fill="#202020" fontWeight="600">
            RAINSCREEN ACM PANEL
          </text>
          <text x="790" y="177" fontSize="20" fill="#202020" fontWeight="600">
            ACM-2 PANELS
          </text>
          <text x="20" y="230" fontSize="18" fill="#202020" fontWeight="600">
            METAL PANEL
          </text>
          <text x="20" y="252" fontSize="18" fill="#202020" fontWeight="600">
            SYSTEM
          </text>
        </svg>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Panel state output
        </p>
        <pre className="max-h-40 overflow-auto rounded-lg bg-white p-2 text-[10px] leading-snug text-gray-800">
          {JSON.stringify(panelState, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export interface PriceResult {
  areaFt2: number;
  totalSqFt: number;
  pricePerSqFt: number;
  total: number;
  panelType: PanelType;
  panelTypeLabel: string;
}

const DEBOUNCE_MS = 300;

function buildPriceBody(
  size: SizeSelection,
  thicknessId: ThicknessId,
  colorId: ColorId,
  qty: number,
  panelType: PanelType
) {
  const thicknessMm = Number(thicknessId.replace("mm", ""));
  return {
    widthIn: size.widthIn,
    lengthIn: size.lengthIn,
    thicknessMm,
    colorId,
    qty,
    panelType,
  };
}

export function Configurator() {
  const [size, setSize] = useState<SizeSelection>(defaultSize);
  const [colorId, setColorId] = useState<ColorId>("classic-white");
  const [thicknessId, setThicknessId] = useState<ThicknessId>("4mm");
  const [quantity, setQuantity] = useState(1);
  const [panelType, setPanelType] = useState<PanelType>("basic");

  const [pricing, setPricing] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelDrawingFile, setPanelDrawingFile] = useState<File | null>(null);
  const router = useRouter();
  const { addItem } = useCart();

  const fetchPrice = useCallback(
    async (
      sizeVal: SizeSelection,
      thickness: ThicknessId,
      color: ColorId,
      qty: number,
      pType: PanelType
    ) => {
      const body = buildPriceBody(sizeVal, thickness, color, qty, pType);
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to get price.");
      }
      return data as PriceResult;
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      fetchPrice(size, thicknessId, colorId, quantity, panelType)
        .then(setPricing)
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setPricing(null);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [size, thicknessId, colorId, quantity, panelType, fetchPrice]);

  const color = colors.find((c) => c.id === colorId)!;
  const selectedWidth = allWidths.find((w) => w.id === size.widthId);
  const widthLabel = `${size.widthIn}"`;
  const thicknessMmNumeric = Number(thicknessId.replace("mm", ""));
  const edgeThicknessPx = Math.min(18, Math.max(4, thicknessMmNumeric / 0.5));

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
  const widthRatio =
    (clamp(size.widthIn, MIN_WIDTH_IN, MAX_WIDTH_IN) - MIN_WIDTH_IN) / (MAX_WIDTH_IN - MIN_WIDTH_IN || 1);
  const lengthRatio =
    (clamp(size.lengthIn, MIN_LENGTH_IN, MAX_LENGTH_IN) - MIN_LENGTH_IN) / (MAX_LENGTH_IN - MIN_LENGTH_IN || 1);

  const handleAddToCart = () => {
    if (!pricing) return;
    const finish = finishes[0];
    const unitPrice = pricing.total / quantity;
    addItem({
      widthIn: size.widthIn,
      heightIn: size.lengthIn,
      standardId: size.widthId,
      colorId,
      finishId: finish.id,
      thicknessId,
      quantity,
      unitPrice,
      areaFt2: pricing.areaFt2,
      panelType: pricing.panelType,
      panelTypeLabel: pricing.panelTypeLabel,
    });
    router.push("/cart");
  };

  const handleRequestQuote = () => {
    if (!pricing) return;
    const finish = finishes[0];
    const thickness = thicknesses.find((t) => t.id === thicknessId);
    const draft: QuoteDraft = {
      widthIn: size.widthIn,
      lengthIn: size.lengthIn,
      widthId: size.widthId,
      thicknessId,
      colorId,
      finishId: finish.id,
      quantity,
      areaFt2PerPanel: pricing.areaFt2,
      totalSqFt: pricing.totalSqFt,
      estimatedTotal: pricing.total,
      panelType: pricing.panelType,
      panelTypeLabel: pricing.panelTypeLabel,
      widthLabel,
      thicknessLabel: thickness?.label ?? thicknessId,
      colorName: color.name,
      colorCode: color.code,
      finishLabel: finish.label,
      colorAvailability: color.availability,
      colorLeadTimeDaysRange: color.leadTimeDaysRange,
      widthAvailability: selectedWidth?.availability ?? "Made to Order",
      widthLeadTimeDaysRange: selectedWidth?.leadTimeDaysRange ?? [7, 14],
      productKind: "acm",
      productLabel: "ACM Panels",
      returnUrl: "/products/acm-panels",
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem(QUOTE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
    router.push("/quote");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 md:mb-16">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          ACM Panel Configurator
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">
          Configure your panels. Pricing updates automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <section className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="border-b border-gray-100 px-6 py-5 md:px-8">
              <h2 className="text-[13px] font-medium uppercase tracking-wider text-gray-500">
                Configuration
              </h2>
              <p className="mt-0.5 text-[13px] text-gray-500">
                Choose thickness, size, color, and quantity.
              </p>
            </div>
            <div className="divide-y divide-gray-100 px-6 py-6 md:px-8">
              <div id="panel-type" className="pb-6 scroll-mt-24">
                <PanelTypePicker value={panelType} onChange={setPanelType} />
                {panelType === "custom" && (
                  <div className="mt-4 rounded-xl border border-gray-200/80 bg-gray-50/50 p-4">
                    <p className="text-[13px] text-gray-700">Non-square panels will need drawings.</p>
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-gray-900 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-gray-400 focus-within:ring-offset-2">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="sr-only"
                        onChange={(e) => setPanelDrawingFile(e.target.files?.[0] ?? null)}
                      />
                      Upload panel drawing
                    </label>
                    {panelDrawingFile && (
                      <p className="mt-2 text-[12px] text-gray-600">{panelDrawingFile.name}</p>
                    )}
                  </div>
                )}
              </div>
              <div id="thickness" className="py-6 scroll-mt-24">
                <ThicknessPicker value={thicknessId} onChange={setThicknessId} />
              </div>
              <div id="size" className="py-6 scroll-mt-24">
                <SizePicker value={size} onChange={setSize} thicknessId={thicknessId} />
              </div>
              <div id="color" className="py-6 scroll-mt-24">
                <ColorSwatches value={colorId} onChange={setColorId} />
              </div>
              <div id="quantity" className="pt-6 scroll-mt-24">
                <QuantityPicker value={quantity} onChange={setQuantity} />
              </div>
            </div>
          </section>
        </div>

        <div id="estimate" className="lg:col-span-5 scroll-mt-24">
          <div className="lg:sticky lg:top-28 space-y-5">
            <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-6" aria-labelledby="panel-preview-heading">
              <h2 id="panel-preview-heading" className="text-[13px] font-medium uppercase tracking-wider text-gray-500">
                Panel Preview
              </h2>
              <div className="mt-4">
                <div
                  className="relative w-full overflow-hidden rounded-2xl"
                  style={{
                    aspectRatio: "4 / 3",
                  }}
                  role="img"
                  aria-label={`Facade preview: ${size.widthIn} by ${size.lengthIn} inch panels in ${color.name} (${color.code}), ${finishes[0].label}, ${
                    thicknesses.find((t) => t.id === thicknessId)?.label ?? thicknessId
                  }`}
                >
                  {/* Facade drawing background */}
                  <div
                    className="absolute inset-0 rounded-2xl border border-gray-300/70 bg-cover bg-center"
                    style={{
                      backgroundImage: "url('/panel-preview-facade.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  {/* Color overlay applied to panel areas */}
                  <div
                    className="absolute inset-[10%] rounded-xl"
                    style={{
                      backgroundColor: color.hex,
                      mixBlendMode: "multiply",
                      opacity: 0.82,
                    }}
                  />
                  {/* Soft vignette to keep edges subtle */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 0%, rgba(255,255,255,0.65) 0%, transparent 55%), radial-gradient(circle at 100% 120%, rgba(15,23,42,0.32) 0%, transparent 60%)",
                    }}
                  />

                  {/* Horizontal scale (width) */}
                  <div className="pointer-events-none absolute bottom-2 left-[18%] right-[14%]">
                    <div className="relative h-5">
                      <div className="absolute bottom-2 left-0 h-[1px] w-full bg-gray-400/70" />
                      <div className="absolute bottom-1 left-0 h-2 w-[1px] bg-gray-500" />
                      <div className="absolute bottom-1 right-0 h-2 w-[1px] bg-gray-500" />
                      <div
                        className="absolute bottom-2 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-gray-700"
                        style={{ width: `${35 + widthRatio * 45}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-gray-700 text-center">
                      Width: {size.widthIn.toFixed(0)} in (scaled)
                    </p>
                  </div>

                  {/* Vertical scale (length) */}
                  <div className="pointer-events-none absolute top-[18%] bottom-[20%] left-[10%] flex flex-col items-center justify-between">
                    <div className="relative h-full w-8">
                      <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-gray-400/70" />
                      <div className="absolute left-1/2 top-0 h-2 w-[1px] -translate-x-1/2 bg-gray-500" />
                      <div className="absolute left-1/2 bottom-0 h-2 w-[1px] -translate-x-1/2 bg-gray-500" />
                      <div
                        className="absolute left-1/2 top-1/2 w-[3px] -translate-x-1/2 rounded-full bg-gray-700"
                        style={{ height: `${32 + lengthRatio * 48}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-gray-700 text-center">
                      Length: {size.lengthIn.toFixed(0)} in (scaled)
                    </p>
                  </div>

                  {/* Label chip */}
                  <div className="absolute top-3 right-3 max-w-[70%] rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.18)] backdrop-blur-md">
                    <p className="leading-snug">
                      {color.name} ({color.code}) · {thicknesses.find((t) => t.id === thicknessId)?.label ?? thicknessId}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-gray-600">
                  {size.widthIn} × {size.lengthIn} in · {(pricing?.areaFt2 ?? 0).toFixed(2)} ft² per panel
                </p>
              </div>
            </section>
            <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-6">
              <h2 className="text-[13px] font-medium uppercase tracking-wider text-gray-500">
                Project Example
              </h2>
              <div className="mt-4">
                <ProjectExampleMahwahFord activeHex={color.hex} />
              </div>
            </section>
            <PriceSummary
              pricing={pricing}
              loading={loading}
              error={error}
            />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={loading || !!error || !pricing}
              className="w-full rounded-xl bg-gray-900 px-5 py-4 text-[15px] font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>

      <section className="mt-20 border-t border-gray-200/80 pt-16" aria-labelledby="material-composition-heading">
        <h2 id="material-composition-heading" className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Material Composition
        </h2>
        <p className="mt-2 text-[15px] text-gray-500">
          Fire-resistant metal composite material (FR MCM) uses a mineral-filled core in place of plastic, meeting stringent fire ratings for exterior applications. The sandwich construction—aluminum skins bonded to a non-combustible core—delivers durability, formability, and compliance with building codes.
        </p>
        <div className="mt-10 flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
          <MaterialCompositionDiagram />
        </div>
      </section>

      <section className="mt-20 border-t border-gray-200/80 pt-16" aria-labelledby="technical-resources-heading">
        <h2 id="technical-resources-heading" className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Technical Resources
        </h2>
        <p className="mt-2 text-[15px] text-gray-500">
          Specifications, finishes, and support documentation.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/resources/alfrex-fr-technical-data-sheet"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-gray-300/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-gray-800">Alfrex FR Technical Data Sheet</h3>
            <span className="mt-2 inline-block text-[13px] text-gray-500 group-hover:text-gray-700">View PDF →</span>
          </Link>
          <Link
            href="/resources/alfrex-standard-finishes-catalog"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-gray-300/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-gray-800">Alfrex Standard Finishes Catalog</h3>
            <span className="mt-2 inline-block text-[13px] text-gray-500 group-hover:text-gray-700">View PDF →</span>
          </Link>
          <Link
            href="/resources/installation-guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-gray-300/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-gray-800">Installation Guidelines</h3>
            <span className="mt-2 inline-block text-[13px] text-gray-500 group-hover:text-gray-700">View PDF →</span>
          </Link>
          <Link
            href="/resources/warranty-information"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-gray-300/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-gray-800">Warranty Information</h3>
            <span className="mt-2 inline-block text-[13px] text-gray-500 group-hover:text-gray-700">View PDF →</span>
          </Link>
        </div>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/resources/alfrex-fr-spec-sheet.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-gray-900 px-6 py-3.5 text-[15px] font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            View the official Alfrex FR spec sheet (PDF)
          </Link>
          <Link
            href="/consultation"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-[15px] font-medium text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Need help specifying? Upload plans for consultation.
          </Link>
        </div>
      </section>

      <section className="mt-20 border-t border-gray-200/80 pt-16" aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="sr-only">
          Product and service information
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-medium text-gray-900">FR Rated Panels</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
              Fire-resistant ACM panels meet building codes for exterior applications.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-medium text-gray-900">Lead Times</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
              Availability and lead times are confirmed with your final quote based on project size, finish selection, and delivery location.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-medium text-gray-900">Cut-to-Length</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
              Custom lengths from 12 in to 300 in. Specify your size when configuring.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-medium text-gray-900">Nationwide Shipping</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
              We ship across the US. Delivery options and pricing provided with your quote.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
