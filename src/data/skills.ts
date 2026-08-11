export type Skill = {
  id: string;
  name: string;
  class: string;
  detail: string;
  radiusRatio: number;
  angleDeg: number;
  speed: number;
};

export const skills: Skill[] = [
  {
    id: "llm",
    name: "LLM",
    class: "Language models",
    detail: "Building and evaluating production LLM applications.",
    radiusRatio: 0.36,
    angleDeg: 0,
    speed: 1,
  },
  {
    id: "backend",
    name: "Backend",
    class: "Services & APIs",
    detail: "APIs and pipelines that carry intelligence into real systems.",
    radiusRatio: 0.5,
    angleDeg: 60,
    speed: 0.85,
  },
  {
    id: "cloud",
    name: "Cloud",
    class: "Infrastructure",
    detail: "Scaling intelligent services on cloud infrastructure.",
    radiusRatio: 0.58,
    angleDeg: 120,
    speed: 0.9,
  },
  {
    id: "prompt",
    name: "Prompt Engineering",
    class: "Interaction design",
    detail: "Crafting precise instructions and structured outputs.",
    radiusRatio: 0.64,
    angleDeg: 180,
    speed: 0.8,
  },
  {
    id: "rag",
    name: "RAG",
    class: "Retrieval",
    detail: "Grounding models in your data with retrieval.",
    radiusRatio: 0.5,
    angleDeg: 240,
    speed: 1.1,
  },
  {
    id: "ai-arch",
    name: "AI Architecture",
    class: "Systems architecture",
    detail: "End-to-end design where models, data and product meet.",
    radiusRatio: 0.72,
    angleDeg: 300,
    speed: 0.7,
  },
];
