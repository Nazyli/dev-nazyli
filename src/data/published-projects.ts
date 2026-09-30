export type ProjectRecord = {
  id: string;
  title: string;
  description: string;
};

export function getPublishedProjects<T extends ProjectRecord>(
  projects: readonly T[],
): T[] {
  return projects.filter((project) => {
    const title = project.title.trim();
    const description = project.description.trim();

    return (
      !title.startsWith("[TODO]") &&
      !/^dummy entry(?:\.|\b)/i.test(description)
    );
  });
}
