import type { BoxTraySideRow, HemType } from "@/types/boxTray";
import type { ProfileState } from "@/types/profile";

function mapHemType(type: ProfileState["hems"][number]["type"]): HemType {
  switch (type) {
    case "closed":
      return "closed";
    case "open":
      return "open_hem";
    default:
      return "none";
  }
}

/** Convert new profile model → legacy `boxTraySides` for cart / quote emails. */
export function profileToBoxTraySides(profile: ProfileState): BoxTraySideRow[] {
  return profile.segments.map((seg, index) => {
    const hem = profile.hems[index];
    const hemEnabled = hem?.enabled && hem.type !== "none";
    return {
      id: seg.id,
      edge: "east",
      flangeHeightIn: seg.length,
      angleDeg: seg.angle,
      parentId: index === 0 ? null : profile.segments[index - 1]!.id,
      ...(hemEnabled
        ? {
            hemType: mapHemType(hem.type),
            hemSizeIn: hem.length,
          }
        : {}),
    };
  });
}
