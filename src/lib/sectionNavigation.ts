import type { MouseEvent } from "react";
import { scrollController } from "@/lib/scrollController";
import { universeState } from "@/lib/universeState";

export function handleSectionLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  id: string,
) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  navigateToSection(id);
}

export function navigateToSection(id: string, updateHistory = true) {
  const target = document.getElementById(id);
  if (!target) return;
  const scrollTarget =
    (target.closest(".pin-spacer") as HTMLElement | null) ?? target;

  if (updateHistory && window.location.hash !== `#${id}`) {
    window.history.pushState(
      typeof window.history.state === "object" && window.history.state !== null
        ? { ...window.history.state, section: id }
        : { section: id },
      "",
      `#${id}`,
    );
  }

  if (!scrollController.lenis) {
    scrollTarget.scrollIntoView({ behavior: "auto" });
    return;
  }

  scrollController.lenis.scrollTo(scrollTarget, {
    offset: 0,
    duration: universeState.reducedMotion ? 0 : 1.4,
  });
}
