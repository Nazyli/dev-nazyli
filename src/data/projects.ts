import rawProjects from "./projects.json";

export type Constellation = {
  stars: [number, number][];
  lines: [number, number][];
};

export type Project = {
  id: string;
  index: string;
  title: string;
  description: string;
  tags: string[];
  link?: string;
  constellation: Constellation;
};

export function buildConstellationPath(project: Project): string {
  return project.constellation.lines
    .map(([from, to]) => {
      const [ax, ay] = project.constellation.stars[from];
      const [bx, by] = project.constellation.stars[to];
      return `M ${ax} ${ay} L ${bx} ${by}`;
    })
    .join(" ");
}

export const projects: Project[] = rawProjects as Project[];
