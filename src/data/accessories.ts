export type AccessoryCatalogEntry = {
  id: string;
  title: string;
  description: string;
  /** Estimated list price per piece (USD); confirmed on quote. */
  unitPrice: number;
};

export const accessoryCatalog: AccessoryCatalogEntry[] = [
  {
    id: "panel-clips",
    title: "Panel installation clips",
    description:
      "ACM panel clips for concealed fixings. Specify your system if known; we will confirm compatibility on your quote.",
    unitPrice: 0.85,
  },
  {
    id: "self-drilling-fasteners",
    title: "Self-drilling fasteners",
    description:
      "Weather-resistant fasteners suitable for typical ACM and trim applications. Final count and finish confirmed on quote.",
    unitPrice: 0.35,
  },
];
