"use client";

import type { HemType } from "@/types/profile";
import { MAX_FLASHING_FOLDS, useConfiguratorStore } from "@/store/useConfiguratorStore";
import BlankDimensionInput from "./BlankDimensionInput";

type ControlPanelProps = {
  compact?: boolean;
};

function hemSelectValue(hem: { type?: HemType } | undefined): string {
  if (hem?.type === "closed" || hem?.type === "open") return hem.type;
  return "none";
}

export default function ControlPanel({ compact = false }: ControlPanelProps) {
  const profile = useConfiguratorStore((s) => s.profile);
  const updateSegment = useConfiguratorStore((s) => s.updateSegment);
  const addSegment = useConfiguratorStore((s) => s.addSegment);
  const removeSegment = useConfiguratorStore((s) => s.removeSegment);
  const updateHem = useConfiguratorStore((s) => s.updateHem);
  const setBaseWidth = useConfiguratorStore((s) => s.setBaseWidth);
  const setPieceLength = useConfiguratorStore((s) => s.setPieceLength);

  const sectionGap = compact ? "space-y-4" : "space-y-6";
  const inputClass = compact
    ? "mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
    : "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
  const foldCardClass = compact
    ? "mb-2 rounded-lg border border-gray-200 p-3"
    : "mb-3 rounded-xl border border-gray-200 p-4";

  const canAddToF1 = profile.segments.length < MAX_FLASHING_FOLDS;

  return (
    <div className={sectionGap}>
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Blank</h2>
        <div className={compact ? "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3" : "space-y-3"}>
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
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Folds</h2>
        {profile.segments.map((segment, index) => {
          const foldHem = profile.hems[index];
          const isF1 = index === 0;

          return (
            <div key={segment.id} className={foldCardClass}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">F{index + 1}</span>
                <div className="flex items-center gap-2">
                  {isF1 ? (
                    <button
                      type="button"
                      onClick={addSegment}
                      disabled={!canAddToF1}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      + Fold
                    </button>
                  ) : null}
                  {!isF1 ? (
                    <button
                      type="button"
                      onClick={() => removeSegment(index)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              {isF1 ? (
                <p className="mb-2 text-xs text-gray-500">
                  Add folds continue from F1 (F2, F3, …).
                </p>
              ) : null}
              <div className="space-y-3">
                <BlankDimensionInput
                  label="Return length (in)"
                  value={segment.length}
                  onChange={(length) => updateSegment(index, { length })}
                  min={0}
                  max={120}
                  step={0.25}
                  className={inputClass}
                />
                <BlankDimensionInput
                  label="Bend angle (°)"
                  value={segment.angle}
                  onChange={(angle) => updateSegment(index, { angle })}
                  min={-180}
                  max={180}
                  step={1}
                  className={inputClass}
                />

                <div className="border-t border-gray-100 pt-3">
                  <label className="text-sm font-medium text-gray-800">Hem</label>
                  <select
                    value={hemSelectValue(foldHem)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "none") {
                        updateHem(index, { enabled: false, type: "none" });
                        return;
                      }
                      updateHem(index, {
                        enabled: true,
                        type: value as HemType,
                      });
                    }}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="none">None</option>
                    <option value="closed">Closed hem</option>
                    <option value="open">Open hem</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
