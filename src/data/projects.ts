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

export const projects: Project[] = [
  {
    id: "simulation-platform",
    index: "01",
    title: "AI Simulation Platform",
    description:
      "Workflow-based AI simulation with autonomous AI actors.",
    tags: ["LLM", "Agents", "Simulation"],
    constellation: {
      stars: [
        [50, 15],
        [85, 50],
        [50, 85],
        [15, 50],
        [50, 50],
      ],
      lines: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [0, 4],
        [1, 4],
        [2, 4],
        [3, 4],
      ],
    },
  },
  {
    id: "project-02",
    index: "02",
    title: "[TODO] Project 02",
    description: "Coming soon — placeholder.",
    tags: ["TBD"],
    constellation: {
      stars: [
        [25, 25],
        [50, 25],
        [75, 25],
        [25, 50],
        [50, 50],
        [75, 50],
        [25, 75],
        [50, 75],
        [75, 75],
      ],
      lines: [
        [0, 1],
        [1, 2],
        [3, 4],
        [4, 5],
        [6, 7],
        [7, 8],
        [0, 3],
        [3, 6],
        [1, 4],
        [4, 7],
        [2, 5],
        [5, 8],
      ],
    },
  },
  {
    id: "project-03",
    index: "03",
    title: "[TODO] Project 03",
    description: "Coming soon — placeholder.",
    tags: ["TBD"],
    constellation: {
      stars: [
        [20, 70],
        [40, 35],
        [60, 60],
        [80, 25],
        [90, 70],
      ],
      lines: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [0, 4],
      ],
    },
  },
];
