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
