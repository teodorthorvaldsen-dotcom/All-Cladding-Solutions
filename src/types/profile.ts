export type HemType = "none" | "closed" | "open";

export type Segment = {
  id: string;
  length: number;
  angle: number;
  radius?: number;
};

export type Hem = {
  enabled: boolean;
  type: HemType;
  length: number;
  radius: number;
  gap: number;
};

/** Left / right end of the flat blank (profile start / end). */
export type BlankEdgeSide = "start" | "end";

export type ProfileState = {
  /** Sheet metal thickness (in). */
  thickness: number;
  /** Flat blank width (in) — pricing blank width. */
  baseWidth: number;
  /** Flat blank length (in) — pricing blank length. */
  pieceLength: number;
  /** Hems on the left or right edge of the flat sheet. */
  edgeHems: Record<BlankEdgeSide, Hem>;
  segments: Segment[];
  /** Hems on fold return free edges (by fold index). */
  hems: Record<number, Hem>;
};
