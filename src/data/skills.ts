export type Skill = {
  id: string;
  name: string;
  class: string;
  tech: string[];
  tone: "gold" | "cyan" | "star";
  ringed?: boolean;
  radiusRatio: number;
  angleDeg: number;
  speed: number;
};

export const skills: Skill[] = [
  {
    id: "languages",
    name: "Languages",
    class: "Programming languages",
    tech: ["Go", "Java", "PHP", "Python", "JavaScript"],
    tone: "gold",
    radiusRatio: 0.72,
    angleDeg: 157.5,
    speed: 1.1,
  },
  {
    id: "voice-ai",
    name: "Voice AI",
    class: "Conversational & voice",
    tech: ["LiveKit", "Speech-to-Text", "Text-to-Speech"],
    tone: "cyan",
    ringed: true,
    radiusRatio: 0.58,
    angleDeg: 112.5,
    speed: 0.9,
  },
  {
    id: "ai-ml",
    name: "AI & ML",
    class: "Machine learning & AI",
    tech: [
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Model Training",
      "Model Evaluation",
    ],
    tone: "star",
    radiusRatio: 0.5,
    angleDeg: 22.5,
    speed: 1.0,
  },
  {
    id: "databases",
    name: "Databases",
    class: "Data stores",
    tech: ["MySQL", "PostgreSQL", "SQL Server", "Redis", "Elasticsearch", "MongoDB"],
    tone: "gold",
    ringed: true,
    radiusRatio: 0.59,
    angleDeg: 247.5,
    speed: 1.0,
  },
  {
    id: "gen-ai",
    name: "Gen AI",
    class: "Generative AI",
    tech: [
      "LLM",
      "Prompt Engineering",
      "RAG",
      "AI Agents",
      "Agentic Workflow",
      "Embeddings",
      "Semantic Search",
    ],
    tone: "cyan",
    radiusRatio: 0.68,
    angleDeg: 67.5,
    speed: 1.05,
  },
  {
    id: "frameworks",
    name: "Frameworks",
    class: "Development frameworks",
    tech: [
      "Spring Boot",
      "FastAPI",
      "Go Echo",
      "Gorilla Mux",
      "Laravel",
      "CodeIgniter",
      "Node.js",
      "Express",
      "React",
    ],
    tone: "star",
    ringed: true,
    radiusRatio: 0.77,
    angleDeg: 202.5,
    speed: 0.85,
  },
  {
    id: "tools-os",
    name: "Tools & OS",
    class: "Tooling & environments",
    tech: [
      "VS Code",
      "GoLand",
      "IntelliJ IDEA",
      "DBeaver",
      "Jaspersoft Studio",
      "AWS",
      "macOS",
      "Windows",
      "Linux",
    ],
    tone: "gold",
    radiusRatio: 0.85,
    angleDeg: 337.5,
    speed: 0.8,
  },
  {
    id: "ai-platforms",
    name: "AI Platforms",
    class: "AI services",
    tech: ["Amazon Bedrock", "OpenAI API", "Google Gemini API"],
    tone: "cyan",
    ringed: true,
    radiusRatio: 0.93,
    angleDeg: 292.5,
    speed: 0.7,
  },
];
