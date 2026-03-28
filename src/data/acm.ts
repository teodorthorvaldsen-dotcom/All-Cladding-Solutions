export const basePricePerFt2 = 8.5;

/** Minimum order value (USD). */
export const MIN_ORDER_VALUE = 400;

export type Availability = "In Stock" | "Made to Order";

export function formatLeadTimeDays(range: [number, number]): string {
  return `${range[0]}–${range[1]} business days`;
}

/** Alfrex FR standard widths (in). */
export const standardWidths = [
  { id: "50", label: '50"', widthIn: 50, availability: "In Stock" as Availability, leadTimeDaysRange: [2, 5] as [number, number] },
  { id: "62", label: '62"', widthIn: 62, availability: "In Stock" as Availability, leadTimeDaysRange: [2, 5] as [number, number] },
] as const;

export const allWidths = standardWidths;

/** Custom width range (in). */
export const CUSTOM_WIDTH_MIN_IN = 12;
export const CUSTOM_WIDTH_MAX_IN = 62;

/** Max length (in) by thickness for Alfrex FR. 4 mm: 15 ft 10 in. */
export const maxLengthByThicknessMm: Record<number, number> = {
  4: 190,
};

export const MIN_LENGTH_IN = 12;

/** Alfrex FR: 4 mm only. */
export const thicknesses = [
  { id: "4mm", label: "4 mm", multiplier: 1.12 },
] as const;

/** Single standard finish (70% Kynar PVDF); multiplier 1.0 for pricing. */
export const finishes = [
  { id: "standard", label: "Standard", multiplier: 1.0 },
] as const;

/**
 * Finish families per Alfrex F-01 Standard Product Finishes (FR MCM & Alfrex Plate).
 * Series names align with the catalog sections and stocking table.
 */
export type FinishSeries =
  | "twoCoatSolids"
  | "vividSolids"
  | "twoCoatMicas"
  | "threeCoatMetallics"
  | "woodSeries"
  | "metalSeries"
  | "naturalZincSeries"
  | "specialtySeries"
  | "customMatch";

export const finishSeriesOrder: FinishSeries[] = [
  "twoCoatSolids",
  "vividSolids",
  "twoCoatMicas",
  "threeCoatMetallics",
  "woodSeries",
  "metalSeries",
  "naturalZincSeries",
  "specialtySeries",
  "customMatch",
];

export const finishSeriesLabels: Record<FinishSeries, string> = {
  twoCoatSolids: "2 Coat Solids",
  vividSolids: "Vivid Solids",
  twoCoatMicas: "2 Coat Micas",
  threeCoatMetallics: "3 Coat Metallics",
  woodSeries: "Wood Series",
  metalSeries: "Metal Series",
  naturalZincSeries: "Natural Zinc Series",
  specialtySeries: "Specialty Series",
  customMatch: "Custom colors",
};

/** Short catalog notes for configurator section headers. */
export const finishSeriesCatalogNotes: Record<FinishSeries, string> = {
  twoCoatSolids:
    "AAMA 2605 · 70% Kynar 500® / Hylar 5000® PVDF · 30-year finish warranty · Non-directional",
  vividSolids:
    "PVDF / FEVE / HDP systems per color · 20-year limited finish warranty · Contact Alfrex for warranty details · Non-directional solids; vivid reds/blues as listed",
  twoCoatMicas:
    "AAMA 2605 · 30-year finish warranty · Directional — install with arrows aligned; order one batch per façade",
  threeCoatMetallics:
    "AAMA 2605 · 30-year finish warranty · Directional — install with arrows aligned",
  woodSeries:
    "AAMA 2605 · 20-year finish warranty · Directional wood-grain appearance",
  metalSeries: "AAMA 2605 · 20-year finish warranty · Directional",
  naturalZincSeries:
    "Non-stocking · MOQ · Bond integrity / product warranty per Alfrex · Directional / specialty appearance",
  specialtySeries:
    "Non-stocking · MOQ · Bond integrity / product warranty per Alfrex",
  customMatch:
    "Send a physical sample, coating manufacturer code, or Pantone reference; MOQ applies. Matching flat sheet can be coated with coil per Alfrex.",
};

/** Premium adder per ft² by series (USD). Used if pricing is extended to finishes. */
export const seriesAdderPerFt2: Record<FinishSeries, number> = {
  twoCoatSolids: 0,
  vividSolids: 0.25,
  twoCoatMicas: 0,
  threeCoatMetallics: 1,
  woodSeries: 1.5,
  metalSeries: 0.5,
  naturalZincSeries: 1.75,
  specialtySeries: 1.75,
  customMatch: 0,
};

export type MetricValue = number | "N/A";

export interface AcmColor {
  id: string;
  name: string;
  code: string;
  finishSeries: FinishSeries;
  /** True when in Alfrex standard stocking (4 mm FR MCM + matching 0.040″ flat sheet). */
  standardStocking: boolean;
  warrantyYears: 10 | 20 | 30 | null;
  /** Supplemental warranty wording from F-01. */
  warrantyNote?: string;
  sri: MetricValue;
  lrv: MetricValue;
  /** Daylight reflectivity (%), from Alfrex stocking table. */
  daylightReflectivity: MetricValue;
  swatchHex: string;
  rgbApprox?: string;
  adderPerFt2: number;
  availability: Availability;
  leadTimeDaysRange: [number, number];
  isCustomMatch?: boolean;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

const stock: Availability = "In Stock";
const mto: Availability = "Made to Order";

/** Row order and metrics match Alfrex F-01 stocking inventory table (Version 8). */
const catalogColorsRaw = [
  {
    id: "alabaster",
    name: "Alabaster",
    code: "JY-6165",
    finishSeries: "twoCoatSolids" as const,
    standardStocking: true,
    warrantyYears: 30 as const,
    rgb: [218, 221, 212] as const,
    sri: 77,
    lrv: 1.4,
    dr: 72,
  },
  {
    id: "ascot-white",
    name: "Ascot White",
    code: "JY-5110",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [205, 212, 202] as const,
    sri: 73,
    lrv: 69.3,
    dr: 70,
  },
  {
    id: "black",
    name: "Black",
    code: "JY-6220",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [75, 76, 78] as const,
    sri: 0,
    lrv: 4.2,
    dr: 4.8,
  },
  {
    id: "bone-white",
    name: "Bone White",
    code: "JY-5165",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [224, 225, 225] as const,
    sri: 73,
    lrv: 69.1,
    dr: 70,
  },
  {
    id: "bronze",
    name: "Bronze",
    code: "JY-6180",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [87, 82, 77] as const,
    sri: 0,
    lrv: 6.1,
    dr: 6.6,
  },
  {
    id: "castle-gray",
    name: "Castle Gray",
    code: "JY-6160",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [179, 175, 166] as const,
    sri: 34,
    lrv: 38.4,
    dr: 39.4,
  },
  {
    id: "charcoal",
    name: "Charcoal",
    code: "JY-6150",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [84, 85, 86] as const,
    sri: 0,
    lrv: 6.4,
    dr: 7,
  },
  {
    id: "classic-white",
    name: "Classic White",
    code: "JY-5195",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [237, 238, 239] as const,
    sri: 89,
    lrv: 80.9,
    dr: 81.3,
  },
  {
    id: "dark-gray",
    name: "Dark Gray",
    code: "JY-6140",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [102, 107, 110] as const,
    sri: 7,
    lrv: 10.2,
    dr: 11,
  },
  {
    id: "dove-gray",
    name: "Dove Gray",
    code: "JY-6120",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [169, 170, 169] as const,
    sri: 22,
    lrv: 32,
    dr: 33.3,
  },
  {
    id: "fashion-gray",
    name: "Fashion Gray",
    code: "JY-6130",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [131, 133, 134] as const,
    sri: 9,
    lrv: 18.2,
    dr: 19.3,
  },
  {
    id: "greyhound",
    name: "Greyhound",
    code: "JY-6155",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [82, 85, 88] as const,
    sri: 0,
    lrv: 0.48,
    dr: 8.8,
  },
  {
    id: "midnight-black",
    name: "Midnight Black",
    code: "JY-6230",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [68, 69, 68] as const,
    sri: 0,
    lrv: 3.9,
    dr: 4.2,
  },
  {
    id: "oyster",
    name: "Oyster",
    code: "JY-5125",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [226, 220, 201] as const,
    sri: 69,
    lrv: 65,
    dr: 65.3,
  },
  {
    id: "sea-wolf",
    name: "Sea Wolf",
    code: "JY-6175",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [177, 169, 160] as const,
    sri: 26,
    lrv: 33,
    dr: 34,
  },
  {
    id: "slate-gray",
    name: "Slate Gray",
    code: "JY-6145",
    finishSeries: "twoCoatSolids",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [137, 135, 130] as const,
    sri: 12,
    lrv: 19.9,
    dr: 20.9,
  },
  {
    id: "harmony-blue",
    name: "Harmony Blue",
    code: "JY-7115",
    finishSeries: "vividSolids",
    standardStocking: true,
    warrantyYears: 20,
    warrantyNote: "Limited finish warranty — contact Alfrex for details.",
    rgb: [75, 91, 149] as const,
    sri: 22,
    lrv: 8,
    dr: 10,
  },
  {
    id: "patriot-red",
    name: "Patriot Red",
    code: "JY-7140",
    finishSeries: "vividSolids",
    standardStocking: true,
    warrantyYears: 20,
    warrantyNote: "3 coat solid · Limited finish warranty per Alfrex.",
    rgb: [164, 31, 25] as const,
    sri: 40,
    lrv: 11,
    dr: 10.7,
  },
  {
    id: "ron-red",
    name: "RON Red",
    code: "JY-7150",
    finishSeries: "vividSolids",
    standardStocking: true,
    warrantyYears: 20,
    warrantyNote: "3 coat solid · Limited finish warranty per Alfrex.",
    rgb: [171, 4, 0] as const,
    sri: 34,
    lrv: 50,
    dr: 9.21,
  },
  {
    id: "signal-blue",
    name: "Signal Blue",
    code: "JY-7110",
    finishSeries: "vividSolids",
    standardStocking: true,
    warrantyYears: 20,
    warrantyNote: "2 coat solid · Limited finish warranty per Alfrex.",
    rgb: [68, 96, 142] as const,
    sri: 17,
    lrv: 8.1,
    dr: 9.7,
  },
  {
    id: "vibrant-red",
    name: "Vibrant Red",
    code: "JY-7120",
    finishSeries: "vividSolids",
    standardStocking: true,
    warrantyYears: 20,
    warrantyNote: "3 coat solid · Limited finish warranty per Alfrex.",
    rgb: [138, 36, 41] as const,
    sri: 17,
    lrv: 9.8,
    dr: 9.05,
  },
  {
    id: "anodic-clear-mica",
    name: "Anodic Clear Mica",
    code: "JY-2510",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [209, 210, 212] as const,
    sri: 57,
    lrv: 58.8,
    dr: 56.9,
  },
  {
    id: "champagne-mica",
    name: "Champagne Mica",
    code: "JY-2550",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [201, 197, 191] as const,
    sri: 51,
    lrv: 50.6,
    dr: 49.8,
  },
  {
    id: "copper-penny-mica",
    name: "Copper Penny Mica",
    code: "JY-2570",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [192, 146, 108] as const,
    sri: 40,
    lrv: 31,
    dr: 28.4,
  },
  {
    id: "driftwood-mica",
    name: "Driftwood Mica",
    code: "JY-2555",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [138, 134, 127] as const,
    sri: 12,
    lrv: 18.2,
    dr: 18.1,
  },
  {
    id: "exotic-silver-mica",
    name: "Exotic Silver Mica",
    code: "JY-2520",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [211, 205, 216] as const,
    sri: 34,
    lrv: 58,
    dr: 56.6,
  },
  {
    id: "gray-silver-mica",
    name: "Gray Silver Mica",
    code: "JY-2530",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [139, 141, 139] as const,
    sri: 9,
    lrv: 22.5,
    dr: 22,
  },
  {
    id: "hazelnut-mica",
    name: "Hazelnut Mica",
    code: "JY-2575",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [142, 117, 92] as const,
    sri: 15,
    lrv: 3.7,
    dr: 19.45,
  },
  {
    id: "medium-bronze-mica",
    name: "Medium Bronze Mica",
    code: "JY-2560",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [177, 163, 146] as const,
    sri: 27,
    lrv: 31.3,
    dr: 30,
  },
  {
    id: "mzg-gray-mica",
    name: "MZG Gray Mica",
    code: "JY-2535",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [128, 130, 130] as const,
    sri: 8,
    lrv: 16.9,
    dr: 16.7,
  },
  {
    id: "new-age-dark-bronze-mica",
    name: "New Age Dark Bronze Mica",
    code: "JY-2580",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [98, 97, 91] as const,
    sri: 6,
    lrv: 1.4,
    dr: 11.5,
  },
  {
    id: "pewter-mica",
    name: "Pewter Mica",
    code: "JY-2540",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [122, 126, 130] as const,
    sri: 8,
    lrv: 16.2,
    dr: 16.4,
  },
  {
    id: "silversmith",
    name: "Silversmith",
    code: "JY-2515",
    finishSeries: "twoCoatMicas",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [203, 205, 204] as const,
    sri: 53,
    lrv: 55,
    dr: 52.8,
  },
  {
    id: "anthracite-silver-metallic",
    name: "Anthracite Silver Metallic",
    code: "JY-3560",
    finishSeries: "threeCoatMetallics",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [83, 88, 91] as const,
    sri: 2,
    lrv: 3.97,
    dr: 9.9,
  },
  {
    id: "bright-silver-metallic",
    name: "Bright Silver Metallic",
    code: "JY-3510",
    finishSeries: "threeCoatMetallics",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [215, 215, 216] as const,
    sri: 66,
    lrv: 63.6,
    dr: 60.9,
  },
  {
    id: "champagne-metallic",
    name: "Champagne Metallic",
    code: "JY-3520",
    finishSeries: "threeCoatMetallics",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [191, 192, 192] as const,
    sri: 71,
    lrv: 63.8,
    dr: 59.8,
  },
  {
    id: "graphite-metallic",
    name: "Graphite Metallic",
    code: "JY-3530",
    finishSeries: "threeCoatMetallics",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [86, 87, 88] as const,
    sri: 0,
    lrv: 6.4,
    dr: 7.2,
  },
  {
    id: "jlr-gray-metallic",
    name: "JLR Gray Metallic",
    code: "JY-3550",
    finishSeries: "threeCoatMetallics",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [135, 133, 131] as const,
    sri: 14,
    lrv: 18.4,
    dr: 18.2,
  },
  {
    id: "pex-pewter-metallic",
    name: "PEX Pewter Metallic",
    code: "JY-3540",
    finishSeries: "threeCoatMetallics",
    standardStocking: true,
    warrantyYears: 30,
    rgb: [173, 172, 170] as const,
    sri: 34,
    lrv: 35.7,
    dr: 34.3,
  },
  {
    id: "dark-walnut",
    name: "Dark Walnut",
    code: "JY-W150",
    finishSeries: "woodSeries",
    standardStocking: true,
    warrantyYears: 20,
    swatchHex: "#4A3728",
    rgbApprox: "approx. wood print",
    sri: 4,
    lrv: 10,
    dr: 9.4,
  },
  {
    id: "golden-oak",
    name: "Golden Oak",
    code: "JY-W140",
    finishSeries: "woodSeries",
    standardStocking: true,
    warrantyYears: 20,
    swatchHex: "#8D734A",
    rgbApprox: "approx. wood print",
    sri: 0,
    lrv: 12.3,
    dr: 12.4,
  },
  {
    id: "teak",
    name: "Teak",
    code: "JY-W120",
    finishSeries: "woodSeries",
    standardStocking: true,
    warrantyYears: 20,
    swatchHex: "#6B4E3D",
    rgbApprox: "approx. wood print",
    sri: 18,
    lrv: 22,
    dr: 20.3,
  },
  {
    id: "faux-zinc",
    name: "Faux Zinc",
    code: "JY-M120",
    finishSeries: "metalSeries",
    standardStocking: true,
    warrantyYears: 20,
    swatchHex: "#8A8D8F",
    rgbApprox: "approx. metal print",
    sri: 10,
    lrv: 12.2,
    dr: 12.5,
  },
  {
    id: "faux-zinc-graphite",
    name: "Faux Zinc Graphite",
    code: "JY-M110",
    finishSeries: "metalSeries",
    standardStocking: true,
    warrantyYears: 20,
    swatchHex: "#4F5254",
    rgbApprox: "approx. metal print",
    sri: 35,
    lrv: 8.5,
    dr: 9,
  },
  {
    id: "faux-zinc-lite",
    name: "Faux Zinc Lite",
    code: "JY-M130",
    finishSeries: "metalSeries",
    standardStocking: true,
    warrantyYears: 20,
    swatchHex: "#B8BCBE",
    rgbApprox: "approx. metal print",
    sri: 4,
    lrv: 25.5,
    dr: 26.5,
  },
  {
    id: "tile-corten",
    name: "Tile Corten",
    code: "JY-M140",
    finishSeries: "metalSeries",
    standardStocking: true,
    warrantyYears: 20,
    swatchHex: "#965A3C",
    rgbApprox: "approx. corten print",
    sri: 0,
    lrv: 12.7,
    dr: 12,
  },
  {
    id: "hairline-clear",
    name: "Hairline Clear",
    code: "JY-H100",
    finishSeries: "specialtySeries",
    standardStocking: false,
    warrantyYears: 10,
    warrantyNote: "Non-stocking · MOQ · Product / bond warranty per Alfrex F-01.",
    swatchHex: "#B8B8B8",
    rgbApprox: "N/A (specialty)",
    sri: 52,
    lrv: 42.2,
    dr: 41.7,
  },
  {
    id: "mirror",
    name: "Mirror",
    code: "JY-A160",
    finishSeries: "specialtySeries",
    standardStocking: false,
    warrantyYears: 10,
    warrantyNote: "Non-stocking · MOQ · Product / bond warranty per Alfrex F-01.",
    swatchHex: "#D0D0D0",
    rgbApprox: "N/A (mirror)",
    sri: 106,
    lrv: 61.8,
    dr: 81.3,
  },
  {
    id: "blue-grey",
    name: "Blue Grey",
    code: "JY-Z110",
    finishSeries: "naturalZincSeries",
    standardStocking: false,
    warrantyYears: 10,
    warrantyNote: "Non-stocking · MOQ · Natural zinc series per Alfrex.",
    swatchHex: "#5C6B74",
    rgbApprox: "N/A",
    sri: "N/A",
    lrv: "N/A",
    dr: "N/A",
  },
  {
    id: "graphite-grey",
    name: "Graphite Grey",
    code: "JY-Z100",
    finishSeries: "naturalZincSeries",
    standardStocking: false,
    warrantyYears: 10,
    warrantyNote: "Non-stocking · MOQ · Natural zinc series per Alfrex.",
    swatchHex: "#4B5054",
    rgbApprox: "N/A",
    sri: "N/A",
    lrv: "N/A",
    dr: "N/A",
  },
] as const;

function expandRaw(
  row: (typeof catalogColorsRaw)[number] & {
    rgb?: readonly [number, number, number];
    swatchHex?: string;
  }
): AcmColor {
  const hex =
    "swatchHex" in row && row.swatchHex
      ? row.swatchHex
      : rgbToHex(row.rgb![0], row.rgb![1], row.rgb![2]);
  const rgbApprox =
    row.rgbApprox ??
    ("rgb" in row && row.rgb ? `${row.rgb[0]}, ${row.rgb[1]}, ${row.rgb[2]}` : undefined);
  const adder = seriesAdderPerFt2[row.finishSeries];
  const availability: Availability =
    row.standardStocking && row.finishSeries !== "naturalZincSeries" && row.finishSeries !== "specialtySeries"
      ? stock
      : mto;
  const lead: [number, number] = row.standardStocking ? [2, 5] : [10, 21];

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    finishSeries: row.finishSeries,
    standardStocking: row.standardStocking,
    warrantyYears: row.warrantyYears,
    warrantyNote: row.warrantyNote,
    sri: row.sri as MetricValue,
    lrv: row.lrv as MetricValue,
    daylightReflectivity: row.dr as MetricValue,
    swatchHex: hex,
    rgbApprox,
    adderPerFt2: adder,
    availability,
    leadTimeDaysRange: lead,
  };
}

const customColorMatch: AcmColor = {
  id: "custom-color-match",
  name: "Custom color match",
  code: "Custom (MOQ)",
  finishSeries: "customMatch",
  standardStocking: false,
  warrantyYears: null,
  warrantyNote: "Warranty and lead time per matched system — confirm on submittal.",
  sri: "N/A",
  lrv: "N/A",
  daylightReflectivity: "N/A",
  swatchHex: "#9CA3AF",
  rgbApprox: "Per submitted sample or color reference",
  adderPerFt2: 0,
  availability: mto,
  leadTimeDaysRange: [14, 28],
  isCustomMatch: true,
};

export const colors = [...catalogColorsRaw.map((r) => expandRaw(r)), customColorMatch] as const;

export type ColorId = (typeof colors)[number]["id"];

export type WidthId = (typeof allWidths)[number]["id"];
export type ThicknessId = (typeof thicknesses)[number]["id"];
export type FinishId = (typeof finishes)[number]["id"];
