import assert from "node:assert/strict";
import test from "node:test";
import { getPublishedExperience } from "./experience.ts";

test("omits each withheld marker and keeps the available current role", () => {
  const visible = getPublishedExperience([
    {
      id: "current",
      period: "2026",
      role: "AI Engineer",
      company: "Current position",
      description: "Designing intelligent applications.",
    },
    {
      id: "period-placeholder",
      period: "20XX",
      role: "Backend Engineer",
      company: "Public organization",
      description: "Developed reliable services.",
    },
    {
      id: "role-placeholder",
      period: "2023",
      role: "Details withheld",
      company: "Public organization",
      description: "Developed reliable services.",
    },
    {
      id: "company-placeholder",
      period: "2022",
      role: "Data Engineer",
      company: "Confidential",
      description: "Built internal data workflows.",
    },
    {
      id: "description-placeholder",
      period: "2021",
      role: "Software Engineer",
      company: "Public organization",
      description: "Entry classified - full record unavailable.",
    },
  ]);

  assert.deepEqual(
    visible.map((entry) => entry.id),
    ["current"],
  );
});
