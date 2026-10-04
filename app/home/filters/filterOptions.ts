export const LOOKING_FOR_OPTIONS = [
  { value: "collaborator", label: "Collaborator", icon: "people" },
  { value: "talent", label: "Talent", icon: "person" },
  { value: "co-founder", label: "Co-founder", icon: "rocket" },
  { value: "client", label: "Client", icon: "briefcase" },
  { value: "mentor", label: "Mentor", icon: "graduation" },
  { value: "investor", label: "Investor", icon: "chart" },
  { value: "networking", label: "Just networking", icon: "network" },
] as const;

export const DISTANCE_OPTIONS = [
  { value: null, label: "Any", description: "Any distance" },
  { value: 5, label: "5 km", description: "Within 5 km" },
  { value: 25, label: "25 km", description: "Within 25 km" },
  { value: 50, label: "50 km", description: "Within 50 km" },
  { value: 100, label: "100+ km", description: "100+ km" },
] as const;

export const WORK_ARRANGEMENTS = ["Any", "On-site", "Hybrid", "Remote"] as const;
export const EXPERIENCE_LEVELS = ["Any", "0–2 yrs", "3–5 yrs", "5–10 yrs", "10+ yrs"] as const;
export const OPEN_TO_OPTIONS = ["Any", "New opportunities", "Side projects", "Mentorship"] as const;
export const MAX_SKILLS = 5;

export type Filters = {
  lookingFor: (typeof LOOKING_FOR_OPTIONS)[number]["value"];
  location: (typeof DISTANCE_OPTIONS)[number]["value"];
  workArrangement: (typeof WORK_ARRANGEMENTS)[number];
  industries: string[];
  profession: string | null;
  experienceLevel: (typeof EXPERIENCE_LEVELS)[number];
  skills: string[];
  openTo: (typeof OPEN_TO_OPTIONS)[number];
};

export const DEFAULT_FILTERS: Filters = {
  lookingFor: "collaborator",
  location: 50,
  workArrangement: "Any",
  industries: [],
  profession: null,
  experienceLevel: "Any",
  skills: [],
  openTo: "Any",
};

export function createDefaultFilters(): Filters {
  return { ...DEFAULT_FILTERS, industries: [], skills: [] };
}

export const INDUSTRIES = [
  "Technology & Software",
  "Artificial Intelligence & Machine Learning",
  "Finance & FinTech",
  "Healthcare & MedTech",
  "Education & EdTech",
  "E-commerce & Retail",
  "Marketing & Advertising",
  "Media & Entertainment",
  "Manufacturing & Engineering",
  "Energy & Sustainability",
  "Real Estate & PropTech",
  "Travel & Hospitality",
  "Logistics & Supply Chain",
  "Food & Beverage",
  "Professional Services & Consulting",
] as const;

export const PROFESSIONS = [
  "Founder", "Co-Founder", "Chief Executive Officer (CEO)",
  "Chief Operating Officer (COO)", "Chief Technology Officer (CTO)",
  "Chief Financial Officer (CFO)", "Product Manager", "Project Manager",
  "Program Manager", "Business Analyst", "Business Development Manager",
  "Partnership Manager", "Sales Manager", "Account Executive",
  "Customer Success Manager", "Marketing Manager", "Growth Manager",
  "Digital Marketing Specialist", "Content Strategist", "Brand Manager",
  "UX Designer", "UI Designer", "Product Designer", "Graphic Designer",
  "Frontend Developer", "Backend Developer", "Full-Stack Developer",
  "Mobile App Developer", "Software Engineer", "DevOps Engineer",
  "Cloud Engineer", "Data Engineer", "Data Analyst", "Data Scientist",
  "Machine Learning Engineer", "AI Engineer", "Cybersecurity Engineer",
  "Solutions Architect", "Research Scientist", "Operations Manager",
] as const;

export const SKILLS = [
  "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust",
  "SQL", "HTML", "CSS", "React", "Next.js", "Node.js", "Express.js",
  "Django", "FastAPI", "Flask", "REST APIs", "GraphQL", "PostgreSQL",
  "MySQL", "MongoDB", "Redis", "Supabase", "Firebase", "Docker",
  "Kubernetes", "Git", "GitHub Actions", "CI/CD", "AWS", "Microsoft Azure",
  "Google Cloud Platform", "Terraform", "Linux", "Pandas", "NumPy",
  "scikit-learn", "TensorFlow", "PyTorch", "LangChain",
  "Retrieval-Augmented Generation (RAG)", "Natural Language Processing (NLP)",
  "Computer Vision", "Apache Spark", "Databricks", "Power BI", "Tableau", "Figma",
] as const;
