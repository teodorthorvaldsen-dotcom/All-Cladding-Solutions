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

export type ProfileState = {
  /** Sheet metal thickness (in). */
  thickness: number;
  /** Flat center width (in) — pricing blank width. */
  baseWidth: number;
  /** Piece length along the flat (in) — pricing blank length. */
  pieceLength: number;
  segments: Segment[];
  hems: Record<number, Hem>;
};
