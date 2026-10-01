"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { certificates } from "@/data/certificates";
import { publishedProjects } from "@/data/projects";
import { skills } from "@/data/skills";
import { CONTACT_LINKS } from "@/data/contact";
import {
  handleHashLinkClick,
  navigateToSection,
} from "@/lib/sectionNavigation";
import { navigateToCertificate } from "@/lib/certificateNavigation";
import { navigateToSkill } from "@/lib/skillNavigation";

const SECTIONS = [
  {
    id: "s-hero",
    label: "Deep Field",
    detail: "Opening view",
    searchText: "home intro start",
  },
  {
    id: "s-about",
    label: "Observer",
    detail: "About Evry",
    searchText: "profile background biography",
  },
  {
    id: "s-expertise",
    label: "Star System",
    detail: "Expertise",
    searchText: "skills technologies tech stack",
  },
  {
    id: "s-projects",
    label: "Projects",
    detail: "Selected work",
    searchText: "portfolio builds code repositories",
  },
  {
    id: "s-certificates",
    label: "Certificates",
    detail: "Learning archive",
    searchText: "credentials courses certification",
  },
  {
    id: "s-experience",
    label: "Mission Log",
    detail: "Experience",
    searchText: "career history employment roles",
  },
  {
    id: "s-contact",
    label: "Downlink",
    detail: "Contact",
    searchText: "email mail github linkedin social connect info@nazyli.com",
  },
] as const;

type NavigatorItem = {
  id: string;
  label: string;
  detail: string;
  searchText: string;
  kind: string;
  href: string;
} & (
  | { target: "section"; sectionId: string }
  | { target: "skill"; skillId: string }
  | { target: "project"; projectIndex: number }
  | { target: "credential"; certificateNo: number }
  | { target: "external"; openInNewTab: boolean }
);

const ITEMS = [
  ...SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    detail: section.detail,
    searchText: section.searchText,
    kind: "Section",
    href: `#${section.id}`,
    target: "section" as const,
    sectionId: section.id,
  })),
  ...CONTACT_LINKS.map((link) => ({
    id: `contact-${link.id}`,
    label: link.label,
    detail: link.detail,
    searchText: link.searchText,
    kind: "Contact",
    href: link.href,
    target: "external" as const,
    openInNewTab: link.openInNewTab,
  })),
  ...skills.map((skill) => ({
    id: `skill-${skill.id}`,
    label: skill.name,
    detail: skill.tech.join(" · "),
    searchText: skill.class,
    kind: "Expertise",
    href: `#skill-${skill.id}`,
    target: "skill" as const,
    skillId: skill.id,
  })),
  ...publishedProjects.map((project, index) => ({
    id: `project-${project.id}`,
    label: project.title,
    detail: `Project ${String(index + 1).padStart(2, "0")} · ${String(project.period ?? project.year ?? "")}`,
    searchText: [
      project.description,
      project.period,
      project.year,
      project.role,
      project.contribution,
      ...(project.tags ?? []),
      ...(project.technologies ?? []),
    ]
      .filter(Boolean)
      .join(" "),
    kind: "Project",
    href: `#project-${project.id}`,
    target: "project" as const,
    projectIndex: index,
  })),
  ...certificates.map((certificate) => ({
    id: `credential-${certificate.no}`,
    label: certificate.title,
    detail: certificate.provider,
    searchText: [certificate.from, certificate.to, ...certificate.skills]
      .filter(Boolean)
      .join(" "),
    kind: "Credential",
    href: `#credential-${certificate.no}`,
    target: "credential" as const,
    certificateNo: certificate.no,
  })),
];

export function SurveyNavigator() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const resultLinks = useRef<HTMLAnchorElement[]>([]);

  const results = useMemo(() => {
    const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return ITEMS;

    return ITEMS.filter((item) =>
      searchTerms.every((term) =>
        `${item.label} ${item.detail} ${item.searchText} ${item.kind}`
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [query]);

  function openNavigator() {
    if (dialog.current?.open) {
      search.current?.focus();
      return;
    }

    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const currentDialog = dialog.current;
    if (!currentDialog || currentDialog.open) return;

    currentDialog.showModal();
    search.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      const usesCommandKey = event.metaKey || event.ctrlKey;

      if (usesCommandKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openNavigator();
        return;
      }

      if (!isEditing && !usesCommandKey && event.key === "/") {
        event.preventDefault();
        openNavigator();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function closeNavigator() {
    if (dialog.current?.open) {
      dialog.current.close();
    } else {
      setOpen(false);
    }
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Enter" && event.target === search.current) {
      event.preventDefault();
      resultLinks.current[0]?.click();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = resultLinks.current.filter((link) => link?.isConnected);
    if (links.length === 0) return;

    event.preventDefault();
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);
    const nextIndex =
      event.key === "ArrowDown"
        ? currentIndex < 0 || currentIndex === links.length - 1
          ? 0
          : currentIndex + 1
        : currentIndex <= 0
          ? links.length - 1
          : currentIndex - 1;
    links[nextIndex]?.focus();
  }

  function handleResultClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    item: NavigatorItem,
  ) {
    if (item.target === "external") {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      closeNavigator();
      return;
    }

    if (item.target === "section") {
      handleHashLinkClick(event, () => {
        closeNavigator();
        navigateToSection(item.sectionId);
      });
      return;
    }

    if (item.target === "skill") {
      handleHashLinkClick(event, () => {
        closeNavigator();
        navigateToSkill(item.skillId);
      });
      return;
    }

    if (item.target === "project") {
      handleHashLinkClick(event, () => {
        closeNavigator();
        document
          .querySelector<HTMLAnchorElement>(
            `[data-project-index="${item.projectIndex}"]`,
          )
          ?.click();
      });
      return;
    }

    if (item.target === "credential") {
      handleHashLinkClick(event, () => {
        closeNavigator();
        navigateToCertificate(item.certificateNo);
      });
      return;
    }

  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="/ Control+K Meta+K"
        aria-label="Search destinations"
        title="Search destinations (/ or Ctrl or Command + K)"
        onClick={openNavigator}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border-l border-indigo/30 pl-3 text-starlight/70 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:pl-4"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
          <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" />
          <path d="m10.2 10.2 3 3" fill="none" stroke="currentColor" />
        </svg>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] sm:inline">
          Search
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="survey-navigator-title"
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        onKeyDown={handleDialogKeyDown}
        className="fixed inset-0 m-auto max-h-[min(80vh,42rem)] w-[calc(100%-2rem)] max-w-2xl border border-indigo/70 bg-abyss p-0 text-starlight shadow-2xl backdrop:bg-void/85 backdrop:backdrop-blur-sm"
      >
        <div className="border-b border-indigo/50 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-gold">
                Observatory index
              </p>
              <h2
                id="survey-navigator-title"
                className="mt-2 font-display text-2xl tracking-tight sm:text-3xl"
              >
                Where to next?
              </h2>
            </div>
            <button
              type="button"
              onClick={closeNavigator}
              aria-label="Close search destinations"
              className="flex min-h-11 min-w-11 items-center justify-center border border-indigo/60 font-mono text-sm text-starlight/70 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <label htmlFor="survey-navigator-search" className="sr-only">
            Search sections, expertise, projects, credentials, and contact channels
          </label>
          <input
            ref={search}
            id="survey-navigator-search"
            type="search"
            autoComplete="off"
            placeholder="Search the observatory…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-5 min-h-12 w-full border border-indigo/60 bg-void px-4 font-mono text-sm text-starlight placeholder:text-starlight/55 focus:border-accent/70 focus:outline-none"
          />
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-starlight/60">
            {results.length} destinations · arrows to move · enter to open · esc to close
          </p>
          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {query.trim()
              ? results.length === 0
                ? `No destinations found for ${query}.`
                : `${results.length} ${results.length === 1 ? "destination" : "destinations"} found.`
              : ""}
          </p>
        </div>

        <ul
          aria-label="Navigation results"
          data-lenis-prevent
          className="max-h-[min(48vh,25rem)] overflow-y-auto overscroll-contain p-2 sm:p-3"
        >
          {results.map((item, index) => (
            <li key={item.id}>
              <a
                ref={(element) => {
                  resultLinks.current[index] = element as HTMLAnchorElement;
                }}
                href={item.href}
                target={
                  item.target === "external" && item.openInNewTab
                    ? "_blank"
                    : undefined
                }
                rel={
                  item.target === "external" && item.openInNewTab
                    ? "noreferrer"
                    : undefined
                }
                aria-label={
                  item.target === "external" && item.openInNewTab
                    ? `${item.label} (opens in a new tab)`
                    : undefined
                }
                onClick={(event) => handleResultClick(event, item)}
                className="group flex min-h-14 items-center justify-between gap-4 border-b border-indigo/25 px-3 py-2 transition-colors last:border-b-0 hover:bg-indigo/15 focus-visible:bg-indigo/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-starlight transition-colors group-hover:text-accent">
                    {item.label}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-[0.1em] text-starlight/60">
                    {item.detail}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-gold/75">
                  {item.kind}
                </span>
              </a>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-10 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-starlight/55">
              No destinations found
            </li>
          )}
        </ul>
      </dialog>
    </>
  );
}
