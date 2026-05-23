import { create } from "zustand";
import type { BlankEdgeSide, Hem, ProfileState, Segment } from "@/types/profile";

const DEFAULT_THICKNESS_IN = 4 / 25.4;
export const MAX_FLASHING_FOLDS = 16;

function newSegmentId(): string {
  return `seg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function defaultHem(thickness: number): Hem {
  return {
    enabled: false,
    type: "none",
    length: 0.5,
    radius: thickness,
    gap: thickness,
  };
}

function defaultEdgeHems(thickness: number): ProfileState["edgeHems"] {
  return {
    start: defaultHem(thickness),
    end: defaultHem(thickness),
  };
}

interface ConfiguratorStore {
  profile: ProfileState;

  updateSegment: (index: number, data: Partial<Segment>) => void;
  addSegment: () => void;
  removeSegment: (index: number) => void;
  updateHem: (index: number, data: Partial<Hem>) => void;
  updateEdgeHem: (side: BlankEdgeSide, data: Partial<Hem>) => void;
  setThickness: (value: number) => void;
  setBaseWidth: (value: number) => void;
  setPieceLength: (value: number) => void;
}

export const useConfiguratorStore = create<ConfiguratorStore>((set) => ({
  profile: {
    thickness: DEFAULT_THICKNESS_IN,
    baseWidth: 10,
    pieceLength: 10,
    edgeHems: defaultEdgeHems(DEFAULT_THICKNESS_IN),
    segments: [],
    hems: {},
  },

  updateSegment: (index, data) =>
    set((state) => {
      const segments = [...state.profile.segments];
      if (!segments[index]) return state;
      const next = { ...segments[index]!, ...data };
      if (data.length !== undefined) {
        next.length = Math.max(0, Number.isFinite(data.length) ? data.length : 0);
      }
      if (data.angle !== undefined) {
        next.angle = Number.isFinite(data.angle) ? data.angle : 0;
      }
      segments[index] = next;
      return { profile: { ...state.profile, segments } };
    }),

  addSegment: () =>
    set((state) => {
      if (state.profile.segments.length >= MAX_FLASHING_FOLDS) return state;
      const segments = [
        ...state.profile.segments,
        { id: newSegmentId(), length: 0.5, angle: 90, radius: state.profile.thickness },
      ];
      return { profile: { ...state.profile, segments } };
    }),

  removeSegment: (index) =>
    set((state) => {
      if (!state.profile.segments[index]) return state;
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
      const existing = state.profile.hems[index] ?? defaultHem(state.profile.thickness);
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

  updateEdgeHem: (side, data) =>
    set((state) => ({
      profile: {
        ...state.profile,
        edgeHems: {
          ...state.profile.edgeHems,
          [side]: { ...state.profile.edgeHems[side], ...data },
        },
      },
    })),

  setThickness: (value) =>
    set((state) => ({
      profile: { ...state.profile, thickness: Math.max(0, Number.isFinite(value) ? value : 0) },
    })),

  setBaseWidth: (value) =>
    set((state) => ({
      profile: { ...state.profile, baseWidth: Math.max(0, Number.isFinite(value) ? value : 0) },
    })),

  setPieceLength: (value) =>
    set((state) => ({
      profile: {
        ...state.profile,
        pieceLength: Math.min(10, Math.max(0, Number.isFinite(value) ? value : 0)),
      },
    })),
}));
