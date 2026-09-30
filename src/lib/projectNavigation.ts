import { publishedProjects } from "@/data/projects";

export function getProjectIndexFromHash(hash: string) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return publishedProjects.findIndex((project) => `project-${project.id}` === id);
}

export function updateProjectHash(index: number, replace = false) {
  const project = publishedProjects[index];
  if (!project) return;

  const hash = `#project-${project.id}`;
  if (window.location.hash === hash) return;

  const state =
    typeof window.history.state === "object" && window.history.state !== null
      ? { ...window.history.state, section: "s-projects" }
      : { section: "s-projects" };
  const updateHistory = replace ? window.history.replaceState : window.history.pushState;
  updateHistory.call(window.history, state, "", hash);
}
