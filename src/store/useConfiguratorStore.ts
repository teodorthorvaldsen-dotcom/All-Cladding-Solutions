import { create } from "zustand";
import type { Hem, ProfileState, Segment } from "@/types/profile";

const DEFAULT_THICKNESS_IN = 4 / 25.4;

function newSegmentId(): string {
  return `seg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

interface ConfiguratorStore {
  profile: ProfileState;

  updateSegment: (index: number, data: Partial<Segment>) => void;
  addSegment: () => void;
  removeSegment: (index: number) => void;
  updateHem: (index: number, data: Partial<Hem>) => void;
  setThickness: (value: number) => void;
  setBaseWidth: (value: number) => void;
  setPieceLength: (value: number) => void;
}

export const useConfiguratorStore = create<ConfiguratorStore>((set) => ({
  profile: {
    thickness: DEFAULT_THICKNESS_IN,
    baseWidth: 10,
    pieceLength: 10,
    segments: [
      { id: "a", length: 4, angle: 90, radius: 0.08 },
      { id: "b", length: 5.25, angle: -45, radius: 0.08 },
      { id: "c", length: 1, angle: 0, radius: 0.08 },
    ],
    hems: {
      2: {
        enabled: true,
        type: "open",
        length: 0.75,
        radius: DEFAULT_THICKNESS_IN,
        gap: DEFAULT_THICKNESS_IN * 1.2,
      },
    },
  },

  updateSegment: (index, data) =>
    set((state) => {
      const segments = [...state.profile.segments];
      if (!segments[index]) return state;
      segments[index] = { ...segments[index]!, ...data };
      return { profile: { ...state.profile, segments } };
    }),

  addSegment: () =>
    set((state) => {
      const segments = [
        ...state.profile.segments,
        { id: newSegmentId(), length: 1, angle: 90, radius: state.profile.thickness },
      ];
      return { profile: { ...state.profile, segments } };
    }),

  removeSegment: (index) =>
    set((state) => {
      const segments = state.profile.segments.filter((_, i) => i !== index);
      const hems = { ...state.profile.hems };
      delete hems[index];
      const reindexed: Record<number, Hem> = {};
      for (const [k, v] of Object.entries(hems)) {
        const i = Number(k);
        if (i > index) reindexed[i - 1] = v;
        else if (i < index) reindexed[i] = v;
      }
      return { profile: { ...state.profile, segments, hems: reindexed } };
    }),

  updateHem: (index, data) =>
    set((state) => {
      const existing = state.profile.hems[index] ?? {
        enabled: false,
        type: "none" as const,
        length: 0.5,
        radius: state.profile.thickness,
        gap: state.profile.thickness,
      };
      return {
        profile: {
          ...state.profile,
          hems: {
            ...state.profile.hems,
            [index]: { ...existing, ...data },
          },
        },
      };
    }),

  setThickness: (value) =>
    set((state) => ({
      profile: { ...state.profile, thickness: Math.max(0.008, value) },
    })),

  setBaseWidth: (value) =>
    set((state) => ({
      profile: { ...state.profile, baseWidth: Math.max(0.25, value) },
    })),

  setPieceLength: (value) =>
    set((state) => ({
      profile: { ...state.profile, pieceLength: Math.max(0.25, value) },
    })),
}));
