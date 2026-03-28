export interface Project {
  slug: string;
  title: string;
  location: string;
  description: string;
  tags: string[];
  year: number;
  scope: string;
  materials: string[];
  galleryCount: number;
}

export const projects: Project[] = [
  {
    slug: "commercial-facade-austin",
    title: "Commercial Facade",
    location: "Austin, TX",
    description: "Three-story commercial building with fire-rated ACM rain screen system.",
    tags: ["FR", "Commercial", "Exterior"],
    year: 2024,
    scope: "22,000 sq ft exterior facade",
    materials: ["Alfrex FR 4mm", "Classic White (JY-5195)", "Castle Gray (JY-6160)"],
    galleryCount: 4,
  },
  {
    slug: "office-building-denver",
    title: "Office Building",
    location: "Denver, CO",
    description: "Corporate headquarters featuring a high-performance ACM envelope.",
    tags: ["FR", "Office", "Exterior"],
    year: 2024,
    scope: "45,000 sq ft building envelope",
    materials: ["Alfrex FR 4mm", "Alfrex FR 6mm", "Bone White (JY-5165)", "Charcoal (JY-6150)"],
    galleryCount: 5,
  },
  {
    slug: "retail-center-phoenix",
    title: "Retail Center",
    location: "Phoenix, AZ",
    description: "Shopping center renovation with updated ACM panel cladding.",
    tags: ["FR", "Retail", "Exterior"],
    year: 2023,
    scope: "18,000 sq ft retail facades",
    materials: ["Alfrex FR 4mm", "Alabaster (JY-6165)", "Black (JY-6220)"],
    galleryCount: 6,
  },
  {
    slug: "mixed-use-seattle",
    title: "Mixed-Use Development",
    location: "Seattle, WA",
    description: "Six-story mixed-use building with integrated ACM and glass facade.",
    tags: ["FR", "Mixed-Use", "Exterior"],
    year: 2024,
    scope: "65,000 sq ft mixed commercial and residential",
    materials: ["Alfrex FR 4mm", "Alfrex FR 6mm", "Classic White (JY-5195)", "Castle Gray (JY-6160)", "Charcoal (JY-6150)"],
    galleryCount: 5,
  },
  {
    slug: "healthcare-facility-chicago",
    title: "Healthcare Facility",
    location: "Chicago, IL",
    description: "Medical office building with fire-rated ACM cladding for code compliance.",
    tags: ["FR", "Healthcare", "Exterior"],
    year: 2023,
    scope: "28,000 sq ft medical campus",
    materials: ["Alfrex FR 4mm", "Classic White (JY-5195)", "Bone White (JY-5165)"],
    galleryCount: 4,
  },
  {
    slug: "education-campus-boston",
    title: "Education Campus",
    location: "Boston, MA",
    description: "University science building with durable ACM rain screen system.",
    tags: ["FR", "Education", "Exterior"],
    year: 2024,
    scope: "35,000 sq ft academic building",
    materials: ["Alfrex FR 4mm", "Alfrex FR 6mm", "Classic White (JY-5195)", "Castle Gray (JY-6160)"],
    galleryCount: 6,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
