"use client";

import Image from "next/image";
import {
  colors,
  finishSeriesCatalogNotes,
  finishSeriesLabels,
  finishSeriesOrder,
  type AcmColor,
  type ColorId,
} from "@/data/acm";

interface ColorSwatchesProps {
  value: ColorId;
  onChange: (id: ColorId) => void;
}

function SwatchButton({
  c,
  isSelected,
  onSelect,
}: {
  c: AcmColor;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hex = c.swatchHex ?? "#ccc";
  const swatchImage = (c as AcmColor & { swatchImage?: string }).swatchImage;

  return (
    <div className="group relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={`${c.name} (${c.code})`}
        title={`${c.name} (${c.code})`}
        className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:h-14 sm:w-14 ${
          isSelected
            ? "ring-2 ring-gray-900 ring-offset-2"
            : "ring-1 ring-gray-200/80 ring-inset hover:ring-gray-300"
        }`}
      >
        <span className="absolute inset-0" style={{ backgroundColor: hex }} />
        {typeof swatchImage === "string" && (
          <Image
            src={swatchImage}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            draggable={false}
            aria-hidden
          />
        )}
        {isSelected && (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/15"
            aria-hidden
          >
            <svg
              className="h-5 w-5 text-white drop-shadow-sm sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </button>
      <span
        className={`hidden max-w-[4.5rem] truncate text-center text-[9px] font-medium leading-tight sm:block ${
          c.standardStocking ? "text-emerald-700" : "text-amber-800"
        }`}
        title={c.standardStocking ? "Standard stocking" : "Non-stocking / special order"}
      >
        {c.standardStocking ? "Stock" : "MOQ"}
      </span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-[220px] -translate-x-1/2 rounded-lg bg-gray-800/90 px-2.5 py-1.5 text-left text-[11px] font-medium text-white opacity-0 shadow-sm backdrop-blur-sm transition group-hover:opacity-100 group-focus-within:opacity-100"
        role="tooltip"
      >
        <span className="block">{c.name}</span>
        <span className="block text-[10px] font-normal text-white/85">{c.code}</span>
        <span className="mt-0.5 block text-[10px] font-normal text-white/75">
          {c.standardStocking
            ? "Standard stocking (4 mm FR MCM / matching sheet)"
            : "Non-stocking — minimum quantities (Alfrex F-01)"}
        </span>
      </span>
    </div>
  );
}

export function ColorSwatches({ value, onChange }: ColorSwatchesProps) {
  const selectedColor = colors.find((c) => c.id === value);

  const catalogColors = colors.filter((c) => !c.isCustomMatch);
  const custom = colors.find((c) => c.isCustomMatch);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">Color &amp; finish series</label>
      <p className="mt-0.5 text-[13px] text-gray-500">
        Alfrex FR MCM standard finishes per{" "}
        <span className="whitespace-nowrap">F-01 Standard Product Finishes</span>.{" "}
        <span className="font-medium text-gray-700">Green “Stock”</span> indicates standard stocking;{" "}
        <span className="font-medium text-amber-900">“MOQ”</span> is non-stocking / special order.
      </p>

      <div role="group" aria-label="Panel color" className="mt-6 space-y-8">
        {finishSeriesOrder.map((series) => {
          if (series === "customMatch") return null;
          const inSeries = catalogColors.filter((c) => c.finishSeries === series);
          if (inSeries.length === 0) return null;

          return (
            <div key={series}>
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-800">
                  {finishSeriesLabels[series]}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                  {finishSeriesCatalogNotes[series]}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-6 gap-3 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-9">
                {inSeries.map((c) => (
                  <SwatchButton
                    key={c.id}
                    c={c}
                    isSelected={value === c.id}
                    onSelect={() => onChange(c.id as ColorId)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {custom && (
          <div>
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-800">
                {finishSeriesLabels.customMatch}
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                {finishSeriesCatalogNotes.customMatch}
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onChange(custom.id as ColorId)}
                aria-pressed={value === custom.id}
                className={`flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                  value === custom.id
                    ? "border-gray-900 bg-gray-50 ring-2 ring-gray-900 ring-offset-2"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span
                  className="h-12 w-12 flex-shrink-0 rounded-lg ring-1 ring-inset ring-gray-200"
                  style={{ background: "linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 50%, #6B7280 100%)" }}
                  aria-hidden
                />
                <span>
                  {custom.name}
                  <span className="mt-0.5 block text-[12px] font-normal text-gray-500">
                    Physical sample, paint code, or Pantone reference · MOQ
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-gray-400">
        Round swatches use Alfrex published RGB approximations (same table as F-01). Metallic, mica, wood,
        and metal-series prints are directional — align installation arrows per manufacturer. Request physical
        samples from{" "}
        <a
          href="https://www.alfrexusa.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700"
        >
          alfrexusa.com
        </a>
        .
      </p>

      {selectedColor && (
        <p className="mt-3 text-[13px] text-gray-500">
          <span className="font-medium text-gray-700">{selectedColor.name}</span> ({selectedColor.code}) ·{" "}
          <span className="text-gray-600">{finishSeriesLabels[selectedColor.finishSeries]}</span>
        </p>
      )}
    </div>
  );
}
