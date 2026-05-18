"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { colors, finishes, type ColorId, type ThicknessId } from "@/data/acm";
import type { PanelType } from "@/lib/pricing";
import { formatBoxTrayReproductionSpec, normalizeBoxTraySides } from "@/lib/boxTray";
import { profileToBoxTraySides } from "@/lib/profileCartBridge";
import { useCart } from "@/context/CartContext";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import { ColorSwatches } from "../ColorSwatches";
import { PanelTypePicker } from "../PanelTypePicker";
import { PriceSummary } from "../PriceSummary";
import { QuantityPicker } from "../QuantityPicker";
import ControlPanel from "./ControlPanel";
import ProfileCanvas, { type ProfileCanvasHandle } from "./ProfileCanvas";
import ThreePreview from "./ThreePreview";

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
  subtitle = "Professional fold & hem editor. Pricing updates automatically.",
}: FlashingConfiguratorProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const profile = useConfiguratorStore((s) => s.profile);

  const [colorId, setColorId] = useState<ColorId>("classic-white");
  const [thicknessId] = useState<ThicknessId>("4mm");
  const [quantity, setQuantity] = useState(1);
  const [panelType, setPanelType] = useState<PanelType>("basic");
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
    });
    router.push("/cart");
  };

  const color = colors.find((c) => c.id === colorId)!;

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </header>

        <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <aside className="lg:col-span-3 flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm overflow-auto max-h-[50vh] lg:max-h-none lg:flex-1">
              <ControlPanel />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <PanelTypePicker value={panelType} onChange={setPanelType} variant="flashing" />
              <div>
                <p className="mb-2 text-sm font-medium text-gray-800">Color</p>
                <ColorSwatches value={colorId} onChange={setColorId} />
              </div>
              <QuantityPicker value={quantity} onChange={setQuantity} unitLabel="pieces" />
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
          </aside>

          <main className="lg:col-span-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm min-h-[420px]">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              Section view — {color.name}
            </p>
            <ProfileCanvas canvasRef={previewRef} />
          </main>

          <aside className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm min-h-[280px]">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">3D preview</p>
            <ThreePreview />
          </aside>
        </div>
      </div>
    </div>
  );
}
