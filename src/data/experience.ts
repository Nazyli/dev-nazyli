export type ExperienceEntry = {
  id: string;
  period: string;
  role: string;
  company: string;
  description: string;
};

export const experience: ExperienceEntry[] = [
  {
    id: "ai-engineer",
    period: "2026",
    role: "AI Engineer",
    company: "Current position",
    description: "Designing and shipping intelligent applications on top of LLMs.",
  },
  {
    id: "software-engineer",
    period: "2025",
    role: "Software Engineer",
    company: "[TODO] Company",
    description: "Built and scaled backend systems that put products into production.",
  },
  {
    id: "early-role",
    period: "2024",
    role: "[TODO] Early role",
    company: "[TODO] Company",
    description: "Foundation in software engineering — placeholder until real data arrives.",
  },
];
