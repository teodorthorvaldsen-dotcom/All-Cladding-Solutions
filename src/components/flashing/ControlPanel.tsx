"use client";

import type { BlankEdgeSide, HemType } from "@/types/profile";
import { MAX_FLASHING_FOLDS, useConfiguratorStore } from "@/store/useConfiguratorStore";
import BlankDimensionInput from "./BlankDimensionInput";

type ControlPanelProps = {
  compact?: boolean;
};

function hemSelectValue(hem: { type?: HemType } | undefined): string {
  if (hem?.type === "closed" || hem?.type === "open") return hem.type;
  return "none";
}

function HemSelect({
  label,
  value,
  onChange,
  inputClass,
}: {
  label: string;
  value: string;
  onChange: (type: HemType | "none") => void;
  inputClass: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-800">{label}</label>
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "none" || v === "closed" || v === "open") onChange(v);
        }}
        className={`${inputClass} mt-1`}
      >
        <option value="none">None</option>
        <option value="closed">Closed hem</option>
        <option value="open">Open hem</option>
      </select>
    </div>
  );
}

export default function ControlPanel({ compact = false }: ControlPanelProps) {
  const profile = useConfiguratorStore((s) => s.profile);
  const updateSegment = useConfiguratorStore((s) => s.updateSegment);
  const addSegment = useConfiguratorStore((s) => s.addSegment);
  const removeSegment = useConfiguratorStore((s) => s.removeSegment);
  const updateHem = useConfiguratorStore((s) => s.updateHem);
  const updateEdgeHem = useConfiguratorStore((s) => s.updateEdgeHem);
  const setBaseWidth = useConfiguratorStore((s) => s.setBaseWidth);
  const setPieceLength = useConfiguratorStore((s) => s.setPieceLength);

  const sectionGap = compact ? "space-y-4" : "space-y-6";
  const inputClass = compact
    ? "mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
    : "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
  const foldCardClass = compact
    ? "mb-2 rounded-lg border border-gray-200 p-3"
    : "mb-3 rounded-xl border border-gray-200 p-4";

  const canAddFold = profile.segments.length < MAX_FLASHING_FOLDS;

  const setEdgeHemType = (side: BlankEdgeSide, type: HemType | "none") => {
    if (type === "none") {
      updateEdgeHem(side, { enabled: false, type: "none" });
      return;
    }
    updateEdgeHem(side, { enabled: true, type });
  };

  const setFoldHemType = (index: number, type: HemType | "none") => {
    if (type === "none") {
      updateHem(index, { enabled: false, type: "none" });
      return;
    }
    updateHem(index, { enabled: true, type });
  };

  return (
    <div className={sectionGap}>
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Flat sheet
        </h2>
        <div className={compact ? "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3" : "space-y-3"}>
          <BlankDimensionInput
            label="Width (in)"
            value={profile.baseWidth}
            onChange={setBaseWidth}
            min={0}
            max={48}
            step={0.25}
            className={inputClass}
          />
          <BlankDimensionInput
            label="Length (in)"
            value={profile.pieceLength}
            onChange={setPieceLength}
            min={0}
            max={10}
            step={0.25}
            className={inputClass}
          />
        </div>
        <div className="mt-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
          <p className="text-xs font-medium text-gray-600">Edge hems (flat sheet)</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <HemSelect
              label="Left edge"
              value={hemSelectValue(profile.edgeHems.start)}
              onChange={(type) => setEdgeHemType("start", type)}
              inputClass={inputClass}
            />
            <HemSelect
              label="Right edge"
              value={hemSelectValue(profile.edgeHems.end)}
              onChange={(type) => setEdgeHemType("end", type)}
              inputClass={inputClass}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Folds</h2>
          <button
            type="button"
            onClick={addSegment}
            disabled={!canAddFold}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add fold
          </button>
        </div>

        {profile.segments.length === 0 ? (
          <p className="text-sm text-gray-500">
            Optional. Add a fold to bend the sheet from the right edge of the flat blank.
          </p>
        ) : null}

        {profile.segments.map((segment, index) => {
          const foldHem = profile.hems[index];

          return (
            <div key={segment.id} className={foldCardClass}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">F{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSegment(index)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
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
                  <HemSelect
                    label="Return hem"
                    value={hemSelectValue(foldHem)}
                    onChange={(type) => setFoldHemType(index, type)}
                    inputClass={inputClass}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
