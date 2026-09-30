import { skills, type Skill } from "@/data/skills";
import { navigateToSection } from "@/lib/sectionNavigation";

export function getSkillIdFromHash(hash: string): Skill["id"] | null {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  const skillId = id.startsWith("skill-") ? id.slice("skill-".length) : "";

  return skills.some((skill) => skill.id === skillId) ? skillId : null;
}

export function navigateToSkill(skillId: Skill["id"], updateHistory = true) {
  if (!skills.some((skill) => skill.id === skillId)) return;

  const hash = `#skill-${skillId}`;
  if (updateHistory && window.location.hash !== hash) {
    window.history.pushState(
      typeof window.history.state === "object" && window.history.state !== null
        ? { ...window.history.state, section: "s-expertise" }
        : { section: "s-expertise" },
      "",
      hash,
    );
  }

  navigateToSection("s-expertise", false);
  requestAnimationFrame(() => {
    document.getElementById(hash.slice(1))?.focus({ preventScroll: true });
  });
}
