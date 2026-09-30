import rawProjects from "./projects.json";
import { getPublishedProjects } from "./published-projects";

export { getPublishedProjects } from "./published-projects";

export type Constellation = {
  stars: [number, number][];
  lines: [number, number][];
};

export type Project = {
  id: string;
  index?: string;
  title: string;
  description: string;
  tags?: string[];
  technologies?: string[];
  role?: string;
  contribution?: string;
  period?: string;
  year?: string | number;
  repositoryUrl?: string;
  demoUrl?: string;
  link?: string;
  constellation?: Constellation;
};

export function getProjectPeriodDateTime(period: string): string | null {
  const value = period.trim();
  const year = /^(\d{4})$/.exec(value);
  if (year) return year[1];

  const updated = /^Updated\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i.exec(
    value,
  );
  if (!updated) return null;

  const month = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ].indexOf(updated[1].toLowerCase());
  if (month < 0) return null;

  return `${updated[2]}-${String(month + 1).padStart(2, "0")}`;
}

export function buildConstellationPath(constellation: Constellation): string {
  return constellation.lines
    .map(([from, to]) => {
      const [ax, ay] = constellation.stars[from];
      const [bx, by] = constellation.stars[to];
      return `M ${ax} ${ay} L ${bx} ${by}`;
    })
    .join(" ");
}

export const projects: Project[] = rawProjects as Project[];
export const publishedProjects = getPublishedProjects(projects);
