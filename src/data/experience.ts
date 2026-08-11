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
    description:
      "Designing and shipping intelligent applications on top of LLMs.",
  },
  {
    id: "software-engineer",
    period: "20XX",
    role: "Details withheld",
    company: "Confidential",
    description: "Entry classified - full record unavailable.",
  },
  {
    id: "early-role",
    period: "20XX",
    role: "Details withheld",
    company: "Confidential",
    description: "Entry classified - full record unavailable.",
  },
];
