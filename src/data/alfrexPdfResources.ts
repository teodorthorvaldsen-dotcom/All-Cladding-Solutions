/** Official Alfrex PDFs from https://alfrexusa.com/downloads/ — Technical Resources, Certifications, and standard finishes. */

export type AlfrexPdfItem = {
  title: string;
  href: string;
};

export type AlfrexPdfSubgroup = {
  label: string;
  items: readonly AlfrexPdfItem[];
};

/** Brochures → Alfrex Standard Product Finishes */
export const alfrexStandardProductFinishes: AlfrexPdfItem = {
  title: "Alfrex Standard Product Finishes",
  href: "https://alfrexusa.com/storage/F-01-Alfrex-Standard-Product-Finishes.pdf",
};

/** Section 2 — Technical Resources */
export const alfrexTechnicalResourceSubgroups: readonly AlfrexPdfSubgroup[] = [
  {
    label: "General",
    items: [
      {
        title: "Cleaning Recommendations",
        href: "https://alfrexusa.com/storage/D-07-Cleaning-and-Maintenance-Recommendations.pdf",
      },
      {
        title: "Maintenance & Long Term Care",
        href: "https://alfrexusa.com/storage/D-31-Alfrex-Storage-Handling-Maintenance-Long-Term-Care.pdf",
      },
    ],
  },
  {
    label: "Alfrex FR MCM",
    items: [
      {
        title: "Technical Data Sheet — Alfrex FR 4mm",
        href: "https://alfrexusa.com/storage/D-01-Alfrex-FR-4mm-Tech-Data-1.pdf",
      },
      {
        title: "Structural Performance Testing Summary — Alfrex FR",
        href: "https://alfrexusa.com/storage/D-12-Alfrex-FR-Structural-Performance-Testing-Summary-Data.pdf",
      },
      {
        title: "FR MCM Generic Rainscreen System Details",
        href: "https://alfrexusa.com/storage/D-14-Alfrex-FR-General-Rainscreen-Panel-Application.pdf",
      },
      {
        title: "MSDS Rev 2 2020 — Alfrex FR",
        href: "https://alfrexusa.com/storage/D-18-Alfrex-FR-MSDS.pdf",
      },
    ],
  },
  {
    label: "Alfrex FR Zinc | ZCM",
    items: [
      {
        title: "Technical Data Sheet — Alfrex FR Zinc | ZCM",
        href: "https://alfrexusa.com/storage/D-03-Alfrex-FR-ZCM-Tech-Data.pdf",
      },
      {
        title: "Special Considerations — Alfrex FR Zinc | ZCM",
        href: "https://alfrexusa.com/storage/D-16-Alfrex-FR-ZCM-Special-Considerations.pdf",
      },
    ],
  },
  {
    label: "Alfrex Plate",
    items: [
      {
        title: "Technical Data Sheet — Alfrex Plate 3mm",
        href: "https://alfrexusa.com/storage/D-05-Alfrex-Plate-3mm-Tech-Data.pdf",
      },
      {
        title: "Technical Data Sheet — Alfrex Plate 2mm",
        href: "https://alfrexusa.com/storage/D-04-Alfrex-Plate-2mm-Tech-Data.pdf",
      },
      {
        title: "Technical Data Sheet — Alfrex Flat Sheet 1mm",
        href: "https://alfrexusa.com/storage/D-06-Alfrex-Flat-Sheet-0.040inch-1mm-Tech-Data.pdf",
      },
      {
        title: "Alfrex Plate Fabrication and Technical Guidelines",
        href: "https://alfrexusa.com/storage/D-25-Alfrex-Plate-Fabrication-and-Technical-Recommendations.pdf",
      },
      {
        title: "Plate Generic Rainscreen System Details",
        href: "https://alfrexusa.com/storage/D-15-Alfrex-Plate-General-Rainscreen-Panel-Application.pdf",
      },
      {
        title: "MSDS Rev 2 2020 — Alfrex Plate",
        href: "https://alfrexusa.com/storage/D-19-Alfrex-Plate-MSDS.pdf",
      },
    ],
  },
] as const;

/** Section 3 — Certifications and Test Reports */
export const alfrexCertificationSubgroups: readonly AlfrexPdfSubgroup[] = [
  {
    label: "Alfrex FR MCM",
    items: [
      {
        title: "ICC ESR Evaluation Report — Alfrex FR",
        href: "https://alfrexusa.com/storage/E-19-Alfrex-FR-ESR-4566.pdf",
      },
      {
        title: "Alfrex FR — Intertek Product Listing",
        href: "https://alfrexusa.com/storage/E-20-Alfrex-FR-ICC-AC25.pdf",
      },
      {
        title: "NFPA 285 — 4mm FR w/ Mineral Wool",
        href: "https://alfrexusa.com/storage/E-16-Alfrex-FR-NFPA-285.pdf",
      },
      {
        title: "NFPA 285 — 4mm FR w/ Polyiso",
        href: "https://alfrexusa.com/storage/E-49-NFPA-285-4mm-FR-Polyiso.pdf",
      },
      {
        title: "NFPA 285 — 6mm FR w/ Mineral Wool",
        href: "https://alfrexusa.com/storage/E-50-NFPA-285-6mm-FR-Mineral-Wool.pdf",
      },
      {
        title: "Florida Product Approval Compliance Summary — Alfrex FR",
        href: "https://alfrexusa.com/storage/E-03-Alfrex-FR-MCM-Florida-Product-Approval-Compliance-Summary.pdf",
      },
      {
        title: "CAN/ULC S134 — Alfrex FR",
        href: "https://alfrexusa.com/storage/ALFREX_CANULC_S134.pdf",
      },
      {
        title: "CAN/ULC S102 — Alfrex FR",
        href: "https://alfrexusa.com/storage/ALFREX_CANULC_S102.pdf",
      },
      {
        title: "LEED Certification — Alfrex FR",
        href: "https://alfrexusa.com/storage/E-01-Alfrex-FR-LEED-Certification.pdf",
      },
    ],
  },
  {
    label: "Alfrex FR Zinc | ZCM",
    items: [
      {
        title: "NFPA 285 — Alfrex FR Zinc ZCM",
        href: "https://alfrexusa.com/storage/Alfrex-FR-Zinc-ZCM-NFPA-285-Test-Report-Summary.pdf",
      },
    ],
  },
  {
    label: "Alfrex Plate",
    items: [
      {
        title: "LEED Certification — Alfrex Plate",
        href: "https://alfrexusa.com/storage/E-02-Alfrex-Plate-LEED-Certification.pdf",
      },
      {
        title: "Aluminum Plate 3003 — Combustibility Report",
        href: "https://alfrexusa.com/storage/Aluminum-Plate-3003-Combustibility-Report.pdf",
      },
      {
        title: "Aluminum Plate 5052 — Combustibility Report",
        href: "https://alfrexusa.com/storage/Aluminum-Plate-5052-Combustibility-Report.pdf",
      },
      {
        title: "CAN/ULC S135 Summary Report — Alfrex Plate",
        href: "https://alfrexusa.com/storage/Alfrex-Plate-Letter-Report-CAN-ULC-S135.pdf",
      },
      {
        title: "CAN/ULC S114 Summary Report — Alfrex Plate",
        href: "https://alfrexusa.com/storage/Alfrex-Plate-Letter-Report-ULC-S114.pdf",
      },
      {
        title: "Florida Product Approval Compliance Summary — Alfrex Plate",
        href: "https://alfrexusa.com/storage/E-04-Alfrex-Plate-Florida-Product-Approval-Compliance-Summary.pdf",
      },
    ],
  },
] as const;

/** Alfrex FR MCM specification (07 42 13) — primary spec CTA */
export const alfrexFrAcmSpecificationPdf =
  "https://alfrexusa.com/storage/C-01-Alfrex-FR-ACM-Specification-07-42-13_Web.pdf";
