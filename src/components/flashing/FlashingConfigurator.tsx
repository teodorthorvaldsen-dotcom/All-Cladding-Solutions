"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { colors, finishes, type ColorId, type ThicknessId } from "@/data/acm";
import type { PanelType } from "@/lib/pricing";
import { formatBoxTrayReproductionSpec, normalizeBoxTraySides } from "@/lib/boxTray";
import { profileToBoxTraySides } from "@/lib/profileCartBridge";
import { useCart } from "@/context/CartContext";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import { ColorSwatches } from "../ColorSwatches";
import { PriceSummary } from "../PriceSummary";
import { QuantityPicker } from "../QuantityPicker";
import ControlPanel from "./ControlPanel";
import ProfileCanvas, { type ProfileCanvasHandle } from "./ProfileCanvas";

const ThreePreview = dynamic(() => import("./ThreePreview"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[min(280px,40vh)] min-h-[220px] w-full items-center justify-center rounded-lg bg-[#fafafa] text-sm text-gray-400"
      aria-hidden
    >
      Loading 3D preview…
    </div>
  ),
});

const DEBOUNCE_MS = 300;

type PriceResult = {
  areaFt2: number;
  totalSqFt: number;
  pricePerSqFt: number;
  total: number;
  panelType: PanelType;
  panelTypeLabel: string;
};

export type FlashingConfiguratorProps = {
  title?: string;
  subtitle?: string;
};

export default function FlashingConfigurator({
  title = "Flashing Configurator",
  subtitle = "Configure one return, optional hem, and blank size (default 120 in length). Pricing updates automatically.",
}: FlashingConfiguratorProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const profile = useConfiguratorStore((s) => s.profile);

  const [colorId, setColorId] = useState<ColorId>("classic-white");
  const [customColorReference, setCustomColorReference] = useState("");
  const [customColorSpecFile, setCustomColorSpecFile] = useState<File | null>(null);
  const [thicknessId] = useState<ThicknessId>("4mm");
  const [quantity, setQuantity] = useState(1);
  const panelType: PanelType = "basic";
  const [pricing, setPricing] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  const previewRef = useRef<ProfileCanvasHandle | null>(null);

  const fetchPrice = useCallback(async () => {
    setLoading(true);
    setPriceError(null);
    const thicknessMm = Number(thicknessId.replace("mm", ""));
    try {
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widthIn: profile.baseWidth,
          lengthIn: profile.pieceLength,
          thicknessMm,
          colorId,
          qty: quantity,
          panelType,
          productKind: "flashing",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPriceError(data.error ?? "Could not calculate price.");
        setPricing(null);
        return;
      }
      setPricing(data);
    } catch {
      setPriceError("Network error. Try again.");
      setPricing(null);
    } finally {
      setLoading(false);
    }
  }, [profile.baseWidth, profile.pieceLength, thicknessId, colorId, quantity, panelType]);

  useEffect(() => {
    const t = setTimeout(fetchPrice, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fetchPrice]);

  const handleAddToCart = () => {
    if (!pricing) return;
    const finish = finishes[0];
    const unitPrice = pricing.total / quantity;
    const boxTraySides = normalizeBoxTraySides(profileToBoxTraySides(profile));
    const trayBuildSpec =
      boxTraySides.length > 0 ? formatBoxTrayReproductionSpec(boxTraySides) : undefined;
    const previewImageDataUrl = previewRef.current?.toSvgDataUrl();

    addItem({
      productKind: "flashing",
      productLabel: "Flashing",
      widthIn: profile.baseWidth,
      heightIn: profile.pieceLength,
      standardId: "custom",
      colorId,
      finishId: finish.id,
      thicknessId,
      quantity,
      unitPrice,
      areaFt2: pricing.areaFt2,
      panelType: pricing.panelType,
      panelTypeLabel: pricing.panelTypeLabel,
      ...(boxTraySides.length > 0 ? { boxTraySides } : {}),
      ...(trayBuildSpec ? { trayBuildSpec } : {}),
      ...(previewImageDataUrl ? { previewImageDataUrl } : {}),
      ...(colorId === "custom-color-match"
        ? {
            customColorReference: customColorReference.trim() || undefined,
            customColorSpecFileName: customColorSpecFile?.name,
          }
        : {}),
    });
    router.push("/cart");
  };

  const color = colors.find((c) => c.id === colorId)!;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-[15px] text-gray-500">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8 lg:gap-12">
        <div className="md:col-span-7 min-w-0">
          <section className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="border-b border-gray-100 px-5 py-4 md:px-6">
              <h2 className="text-[15px] font-medium uppercase tracking-wider text-gray-500">
                Configuration
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Blank size, one return, optional hem, and color.
              </p>
            </div>
            <div className="divide-y divide-gray-100 px-5 py-5 md:px-6">
              <div className="pb-5">
                <ControlPanel compact />
              </div>
              <div className="py-5">
                <QuantityPicker value={quantity} onChange={setQuantity} unitLabel="pieces" />
              </div>
              <div className="pt-5">
                <ColorSwatches
                  value={colorId}
                  onChange={setColorId}
                  customColorReference={customColorReference}
                  onCustomColorReferenceChange={setCustomColorReference}
                  customColorSpecFile={customColorSpecFile}
                  onCustomColorSpecFileChange={setCustomColorSpecFile}
                />
              </div>
            </div>
          </section>
        </div>

        <div
          id="estimate"
          className="md:col-span-5 md:self-start md:sticky md:top-6 lg:top-8"
        >
          <div className="flex flex-col gap-3 lg:gap-4">
            <section className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                Section view — {color.name}
              </p>
              <ProfileCanvas canvasRef={previewRef} large />
            </section>

            <section className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                3D preview — {color.name}
              </p>
              <p className="mb-2 px-1 text-xs text-gray-500">
                Drag to rotate. Updates with blank size, return, and piece length.
              </p>
              <ThreePreview colorHex={color.swatchHex} colorName={color.name} />
            </section>

            <PriceSummary pricing={pricing} loading={loading} error={priceError} compact />
            <button
              type="button"
              disabled={!pricing || loading}
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
