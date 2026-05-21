"use client";

import type { HemType } from "@/types/profile";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import BlankDimensionInput from "./BlankDimensionInput";

type ControlPanelProps = {
  compact?: boolean;
};

function hemSelectValue(hem: { enabled?: boolean; type?: HemType } | undefined): string {
  if (hem?.enabled && hem.type && hem.type !== "none") return hem.type;
  return "none";
}

export default function ControlPanel({ compact = false }: ControlPanelProps) {
  const profile = useConfiguratorStore((s) => s.profile);
  const updateSegment = useConfiguratorStore((s) => s.updateSegment);
  const updateHem = useConfiguratorStore((s) => s.updateHem);
  const setBaseWidth = useConfiguratorStore((s) => s.setBaseWidth);
  const setPieceLength = useConfiguratorStore((s) => s.setPieceLength);

  const sectionGap = compact ? "space-y-4" : "space-y-6";
  const inputClass = compact
    ? "mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
    : "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
  const foldCardClass = compact
    ? "rounded-lg border border-gray-200 p-3"
    : "rounded-xl border border-gray-200 p-4";

  const segment = profile.segments[0];
  const foldHem = profile.hems[0];
  const hemActive = hemSelectValue(foldHem) !== "none";

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
            max={120}
            step={0.25}
            className={inputClass}
          />
        </div>
      </section>

      {segment ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Return (one side)
          </h2>
          <div className={foldCardClass}>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-800">
                Return length (in)
                <input
                  type="number"
                  min={0.25}
                  max={120}
                  step={0.25}
                  value={segment.length}
                  onChange={(e) => updateSegment(0, { length: Number(e.target.value) })}
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
                  onChange={(e) => updateSegment(0, { angle: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>

              <div className="border-t border-gray-100 pt-3">
                <label className="text-sm font-medium text-gray-800">Hem</label>
                <select
                  value={hemSelectValue(foldHem)}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "none") {
                      updateHem(0, { enabled: false, type: "none" });
                      return;
                    }
                    updateHem(0, {
                      enabled: true,
                      type: value as HemType,
                      length: foldHem?.length ?? 0.5,
                    });
                  }}
                  className={`${inputClass} mt-1`}
                >
                  <option value="none">None</option>
                  <option value="closed">Closed hem</option>
                  <option value="open">Open hem</option>
                </select>

                {hemActive ? (
                  <div className="mt-3">
                    <BlankDimensionInput
                      label="Hem leg (in)"
                      value={foldHem?.length ?? 0.5}
                      onChange={(length) =>
                        updateHem(0, {
                          length,
                          enabled: true,
                          type: (foldHem?.type === "closed" || foldHem?.type === "open"
                            ? foldHem.type
                            : "open") as HemType,
                        })
                      }
                      min={0}
                      max={2}
                      step={0.125}
                      className={inputClass}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
