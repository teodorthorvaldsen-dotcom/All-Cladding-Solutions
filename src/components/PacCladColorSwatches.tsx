"use client";

import { useMemo } from "react";
import {
  pacCladColors,
  type PacCladColor,
  type PacCladColorId,
} from "@/data/pacCladColors";

interface PacCladColorSwatchesProps {
  value: PacCladColorId;
  onChange: (id: PacCladColorId) => void;
}

export function PacCladColorSwatches({ value, onChange }: PacCladColorSwatchesProps) {
  const filteredColors = useMemo(() => pacCladColors, []);

  const selectedColor = pacCladColors.find((c) => c.id === value);

  type SwatchStyleInput = Pick<PacCladColor, "swatchHex" | "swatchImage">;

  function getSwatchStyle(c: SwatchStyleInput) {
    const hex = c.swatchHex ?? "#CCCCCC";
    if (typeof c.swatchImage === "string") {
      return {
        backgroundImage: `url(${c.swatchImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: hex,
      };
    }
    return { backgroundColor: hex };
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">
        Color &amp; finish (PAC-CLAD)
      </label>
      <p className="mt-0.5 text-[13px] text-gray-500">
        Choose a PAC-CLAD color and finish family for this system.
      </p>

      <div className="mt-5">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filteredColors.map((c) => {
            const isSelected = c.id === value;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={isSelected}
                className={`group flex flex-col items-stretch rounded-xl border bg-white p-1.5 text-left text-[11px] transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                  isSelected
                    ? "border-gray-900 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`mb-1 h-10 w-full rounded-lg border border-gray-200/70 ${isSelected ? "ring-1 ring-gray-900" : ""}`}
                  style={getSwatchStyle(c)}
                  aria-hidden
                />
                <span className="line-clamp-2 font-medium text-gray-900">
                  {c.name}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[10px] text-gray-500">
                  {c.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
        Colors shown are representative. Final color/availability confirmed with your final quote.
      </p>

      {selectedColor && (
        <p className="mt-2 text-[13px] text-gray-600">
          <span className="font-medium text-gray-800">{selectedColor.name}</span>{" "}
          ({selectedColor.code})
        </p>
      )}
    </div>
  );
}

