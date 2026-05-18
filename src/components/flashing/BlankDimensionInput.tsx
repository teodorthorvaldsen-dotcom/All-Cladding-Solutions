"use client";

import { useState } from "react";
import { parseInchInput } from "@/geometry/bendMath";

type BlankDimensionInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  decimals?: number;
  className?: string;
};

export default function BlankDimensionInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = "any",
  decimals,
  className,
}: BlankDimensionInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue =
    draft !== null
      ? draft
      : decimals !== undefined
        ? String(Math.round(value * 10 ** decimals) / 10 ** decimals)
        : String(value);

  return (
    <label className="block text-sm font-medium text-gray-800">
      {label}
      <input
        type="text"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onFocus={() => setDraft(displayValue)}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          onChange(parseInchInput(raw));
        }}
        onBlur={() => setDraft(null)}
        className={className}
      />
    </label>
  );
}
