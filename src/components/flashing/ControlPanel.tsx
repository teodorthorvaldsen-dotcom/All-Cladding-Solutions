"use client";

import type { HemType } from "@/types/profile";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import BlankDimensionInput from "./BlankDimensionInput";

const HEM_OPTIONS: { value: HemType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "flattened", label: "Flattened" },
  { value: "open", label: "Open" },
  { value: "teardrop", label: "Teardrop" },
];

type ControlPanelProps = {
  compact?: boolean;
};

export default function ControlPanel({ compact = false }: ControlPanelProps) {
  const profile = useConfiguratorStore((s) => s.profile);
  const updateSegment = useConfiguratorStore((s) => s.updateSegment);
  const addSegment = useConfiguratorStore((s) => s.addSegment);
  const removeSegment = useConfiguratorStore((s) => s.removeSegment);
  const updateHem = useConfiguratorStore((s) => s.updateHem);
  const setThickness = useConfiguratorStore((s) => s.setThickness);
  const setBaseWidth = useConfiguratorStore((s) => s.setBaseWidth);
  const setPieceLength = useConfiguratorStore((s) => s.setPieceLength);

  const leafIndex = Math.max(0, profile.segments.length - 1);
  const leafHem = profile.hems[leafIndex];

  const sectionGap = compact ? "space-y-4" : "space-y-6";
  const inputClass = compact
    ? "mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
    : "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
  const foldCardClass = compact
    ? "mb-2 rounded-lg border border-gray-200 p-3"
    : "mb-3 rounded-xl border border-gray-200 p-4";

  return (
    <div className={sectionGap}>
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Blank</h2>
        <div className={compact ? "grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3" : "space-y-3"}>
          <BlankDimensionInput
            label="Flat width (in)"
            value={profile.baseWidth}
            onChange={setBaseWidth}
            min={0}
            max={48}
            step={0.25}
            className={inputClass}
          />
          <BlankDimensionInput
            label="Piece length (in)"
            value={profile.pieceLength}
            onChange={setPieceLength}
            min={0}
            max={10}
            step={0.25}
            className={inputClass}
          />
          <BlankDimensionInput
            label="Material thickness (in)"
            value={profile.thickness}
            onChange={setThickness}
            min={0}
            max={0.25}
            step={0.001}
            decimals={3}
            className={inputClass}
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Folds</h2>
          <button
            type="button"
            onClick={addSegment}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            + Fold
          </button>
        </div>
        {profile.segments.map((segment, index) => (
          <div key={segment.id} className={foldCardClass}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">F{index + 1}</span>
              {profile.segments.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeSegment(index)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-800">
                Return length (in)
                <input
                  type="number"
                  min={0.25}
                  max={120}
                  step={0.25}
                  value={segment.length}
                  onChange={(e) => updateSegment(index, { length: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-gray-800">
                Bend angle (°)
                <input
                  type="number"
                  min={-180}
                  max={180}
                  step={1}
                  value={segment.angle}
                  onChange={(e) => updateSegment(index, { angle: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Hem — F{leafIndex + 1}
        </h2>
        <div className={compact ? "space-y-2 rounded-lg border border-gray-200 p-3" : "space-y-3 rounded-xl border border-gray-200 p-4"}>
          <label className="block text-sm font-medium text-gray-800">
            Type
            <select
              value={leafHem?.type ?? "none"}
              onChange={(e) =>
                updateHem(leafIndex, {
                  type: e.target.value as HemType,
                  enabled: e.target.value !== "none",
                })
              }
              className={inputClass}
            >
              {HEM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {leafHem?.enabled && leafHem.type !== "none" ? (
            <>
              <label className="block text-sm font-medium text-gray-800">
                Hem leg (in)
                <input
                  type="number"
                  min={0.25}
                  max={2}
                  step={0.25}
                  value={leafHem.length}
                  onChange={(e) => updateHem(leafIndex, { length: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-gray-800">
                Gap (in)
                <input
                  type="number"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={leafHem.gap}
                  onChange={(e) => updateHem(leafIndex, { gap: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}


