import assert from "node:assert/strict";
import test from "node:test";
import { getPublishedProjects } from "./published-projects.ts";

test("filters each placeholder marker and keeps real project metadata", () => {
  const published = getPublishedProjects([
    {
      id: "todo-title",
      title: "[TODO] Placeholder Project",
      description: "A draft project description.",
    },
    {
      id: "dummy-description",
      title: "Placeholder Project",
      description: "Dummy entry. This record is illustrative.",
    },
    {
      id: "real-project",
      title: "Voice support platform",
      description: "A production voice support platform.",
      role: "AI Engineer",
      technologies: ["TypeScript", "LLMs"],
      repositoryUrl: "https://github.com/example/voice-platform",
    },
  ]);

  assert.deepEqual(published, [
    {
      id: "real-project",
      title: "Voice support platform",
      description: "A production voice support platform.",
      role: "AI Engineer",
      technologies: ["TypeScript", "LLMs"],
      repositoryUrl: "https://github.com/example/voice-platform",
    },
  ]);
});
