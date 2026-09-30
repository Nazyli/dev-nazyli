"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { buildConstellationPath, publishedProjects } from "@/data/projects";
import { getProjectIndexFromHash, updateProjectHash } from "@/lib/projectNavigation";
import { scrollController } from "@/lib/scrollController";
import { handleHashLinkClick } from "@/lib/sectionNavigation";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Projects() {
  const root = useRef<HTMLElement>(null);
  const projectTimeline = useRef<gsap.core.Timeline | null>(null);
  const activeProjectRef = useRef(0);
  const [activeProject, setActiveProject] = useState(0);
  const [shareStatus, setShareStatus] = useState("");
  const navigateToProject = useCallback((index: number, updateHistory = true) => {
    const project = publishedProjects[index];
    if (!project) return;

    if (updateHistory) updateProjectHash(index);
    const isPinnedDesktop = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (min-width: 1024px)",
    ).matches;
    activeProjectRef.current = index;
    setActiveProject(index);
    setShareStatus("");

    const section = root.current;
    if (!section) return;
    if (!isPinnedDesktop) {
      document.getElementById(`project-${project.id}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      return;
    }
    const label = `project-${String(index + 1).padStart(2, "0")}`;
    const timeline = projectTimeline.current;
    const trigger = timeline?.scrollTrigger;
    const labelTime = timeline?.labels[label];
    if (!timeline || !trigger || labelTime === undefined) {
      section.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const start =
      trigger.start || section.getBoundingClientRect().top + window.scrollY;
    const end = trigger.end || start + window.innerHeight * publishedProjects.length;
    const destination = start + (end - start) * (labelTime / timeline.duration());

    if (scrollController.lenis) {
      scrollController.lenis.scrollTo(destination, { duration: 0.8 });
    } else {
      window.scrollTo({ top: destination, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const navigateFromHash = () => {
      const index = getProjectIndexFromHash(window.location.hash);
      if (index >= 0) navigateToProject(index, false);
    };

    if (getProjectIndexFromHash(window.location.hash) >= 0) {
      requestAnimationFrame(() => requestAnimationFrame(navigateFromHash));
    }
    window.addEventListener("popstate", navigateFromHash);
    return () => window.removeEventListener("popstate", navigateFromHash);
  }, [navigateToProject]);

  const selectProject = (index: number) => {
    navigateToProject(index);
  };
  const shareSelectedProject = async () => {
    const project = publishedProjects[activeProject];
    if (!project) return;

    setShareStatus("");
    updateProjectHash(activeProject, true);
    const url = new URL(window.location.href);
    url.hash = `project-${project.id}`;
    const link = url.toString();
    const copyLink = () => navigator.clipboard.writeText(link);

    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: link,
        });
        setShareStatus("Project link shared.");
        return;
      }
      await copyLink();
      setShareStatus("Project link copied.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await copyLink();
        setShareStatus("Project link copied.");
      } catch {
        setShareStatus("Sharing unavailable. Project URL is in the address bar.");
      }
    }
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".projects-reveal", {
          y: 22,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 72%",
          },
        });
      });

      mm.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 1024px)",
        () => {
          const section = root.current;
          if (!section) return;

          const slides = gsap.utils.toArray<HTMLElement>(
            ".project-slide",
            section,
          );
          if (slides.length < 2) return;

          section.classList.add("projects-pinned");
          const paths = slides.map((slide) =>
            slide.querySelector<SVGPathElement>(".project-constellation-path"),
          );
          const stars = slides.map((slide) =>
            slide.querySelectorAll<SVGCircleElement>(
              ".project-constellation-star",
            ),
          );

          paths.forEach((path, index) => {
            if (path) {
              const length = path.getTotalLength();
              gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length,
              });
            }
            gsap.set(stars[index], {
              autoAlpha: 0,
              scale: 0.6,
              transformOrigin: "50% 50%",
            });
          });
          gsap.set(slides.slice(1), { autoAlpha: 0, y: 18 });

          const timeline = gsap.timeline({
            scrollTrigger: {
              id: "project-carousel",
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * slides.length}`,
              pin: true,
              scrub: 0.65,
              snap: {
                snapTo: "labelsDirectional",
                delay: 0.08,
                duration: { min: 0.2, max: 0.55 },
                ease: "power2.out",
              },
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: () => {
                let activeIndex = 0;
                let activeOpacity = -1;
                slides.forEach((slide, index) => {
                  const opacity = Number(gsap.getProperty(slide, "opacity"));
                  if (opacity > activeOpacity) {
                    activeOpacity = opacity;
                    activeIndex = index;
                  }
                });
                if (activeProjectRef.current !== activeIndex) {
                  activeProjectRef.current = activeIndex;
                  setActiveProject(activeIndex);
                  setShareStatus("");
                  if (getProjectIndexFromHash(window.location.hash) >= 0) {
                    updateProjectHash(activeIndex, true);
                  }
                }
              },
            },
          });
          projectTimeline.current = timeline;

          timeline.addLabel("project-01", 0.25);
          if (paths[0]) {
            timeline.to(paths[0], { strokeDashoffset: 0, duration: 0.25 });
          }
          timeline.to(
            stars[0],
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.12,
              stagger: 0.035,
              ease: "power2.out",
            },
            0.42,
          );

          slides.slice(1).forEach((slide, index) => {
            const transition = index + 0.7;
            timeline.to(slides[index], {
              autoAlpha: 0,
              y: -18,
              duration: 0.15,
            }, transition);
            timeline.fromTo(
              slide,
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: 0.15 },
              transition + 0.15,
            );
            const path = paths[index + 1];
            if (path) {
              timeline.to(
                path,
                { strokeDashoffset: 0, duration: 0.25 },
                transition + 0.15,
              );
            }
            timeline.to(
              stars[index + 1],
              {
                autoAlpha: 1,
                scale: 1,
                duration: 0.12,
                stagger: 0.035,
                ease: "power2.out",
              },
              transition + 0.42,
            );
            timeline.addLabel(
              `project-${String(index + 2).padStart(2, "0")}`,
              transition + 0.4,
            );
          });
          timeline.to({}, { duration: 1 }, slides.length - 1);
          timeline.addLabel("project-end", timeline.duration());

          return () => {
            projectTimeline.current = null;
            section.classList.remove("projects-pinned");
          };
        },
      );

      mm.add(
        "(prefers-reduced-motion: no-preference) and (max-width: 1023px)",
        () => {
          gsap.utils
            .toArray<SVGPathElement>(".project-constellation-path", root.current)
            .forEach((path) => {
              const length = path.getTotalLength();
              const stars = path
                .closest("svg")
                ?.querySelectorAll<SVGCircleElement>(
                  ".project-constellation-star",
                );
              gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length,
              });
              if (stars) {
                gsap.set(stars, {
                  autoAlpha: 0,
                  scale: 0.6,
                  transformOrigin: "50% 50%",
                });
              }
              const timeline = gsap.timeline({
                scrollTrigger: {
                  trigger: path,
                  start: "top 78%",
                  once: true,
                },
              });
              timeline.to(path, {
                strokeDashoffset: 0,
                duration: 1.1,
                ease: "power2.out",
              });
              if (stars) {
                timeline.to(
                  stars,
                  {
                    autoAlpha: 1,
                    scale: 1,
                    duration: 0.18,
                    stagger: 0.055,
                    ease: "power2.out",
                  },
                  "-=0.12",
                );
              }
            });
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      id="s-projects"
      ref={root}
      aria-label="Projects"
      className="relative flex min-h-screen min-h-svh items-center px-6 py-24 sm:px-16 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          index="04"
          label="Projects"
          descriptor="Selected builds"
          className="projects-reveal"
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="projects-reveal">
            <h2 className="max-w-xl font-display text-4xl font-medium leading-tight tracking-tight text-starlight sm:text-6xl">
              Built systems, made useful.
            </h2>
            {publishedProjects.length > 0 && (
              <p className="mt-6 max-w-lg text-base leading-relaxed text-starlight/70 sm:text-lg">
                A workflow studio, a predictive analytics study, and a cloud
                automation tool.
              </p>
            )}
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
              {String(publishedProjects.length).padStart(2, "0")} published
              project records
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              {publishedProjects.length > 1 && (
                <nav className="flex flex-wrap gap-2" aria-label="Project index">
                  {publishedProjects.map((project, index) => (
                    <a
                      key={project.id}
                      href={`#project-${project.id}`}
                      data-project-index={index}
                      aria-label={`Go to project ${index + 1}: ${project.title}`}
                      aria-current={activeProject === index ? "step" : undefined}
                      onClick={(event) =>
                        handleHashLinkClick(event, () => selectProject(index))
                      }
                      className="flex min-h-11 items-center border border-indigo/70 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-starlight/65 transition-colors hover:border-accent/60 hover:text-accent focus-visible:text-accent aria-[current=step]:border-gold/60 aria-[current=step]:text-gold"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </a>
                  ))}
                </nav>
              )}
              {publishedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={shareSelectedProject}
                  aria-label={`Share ${publishedProjects[activeProject].title}`}
                  className="inline-flex min-h-11 items-center gap-2 border border-accent/45 px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 motion-reduce:transition-none"
                >
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
                    <path
                      d="M6 10 10.5 5.5M6.5 4.5l1.8-1.8a3 3 0 0 1 4.2 4.2l-1.8 1.8M9.5 11.5l-1.8 1.8a3 3 0 0 1-4.2-4.2l1.8-1.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  Share selected build
                </button>
              )}
            </div>
            <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {publishedProjects[activeProject]
                ? `Project ${activeProject + 1} of ${publishedProjects.length}: ${publishedProjects[activeProject].title}.`
                : ""}
            </p>
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-2 min-h-5 font-mono text-[9px] uppercase tracking-[0.16em] text-starlight/60"
            >
              {shareStatus}
            </p>
          </div>

          {publishedProjects.length > 0 ? (
            <div className="projects-reveal project-stage divide-y divide-indigo/40 border-y border-indigo/40">
              {publishedProjects.map((project) => (
                <article
                  key={project.id}
                  id={`project-${project.id}`}
                  className="project-slide grid gap-5 py-7 sm:grid-cols-[112px_1fr] sm:gap-7"
                >
                  {project.constellation && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      className="project-constellation h-20 w-20 self-center"
                    >
                      <path
                        d={buildConstellationPath(project.constellation)}
                        className="project-constellation-path fill-none stroke-accent/70"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                      />
                      {project.constellation.stars.map(([x, y], index) => (
                        <circle
                          key={`${x}-${y}-${index}`}
                          cx={x}
                          cy={y}
                          r={index % 3 === 0 ? 2 : 1.25}
                          className="project-constellation-star fill-gold"
                        />
                      ))}
                    </svg>
                  )}
                  <div className={project.constellation ? "" : "sm:col-span-2"}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                      {project.index ? `Record ${project.index}` : "Project record"}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-starlight">
                      {project.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-starlight/70">
                      {project.description}
                    </p>
                    {(project.role || project.period || project.year !== undefined) && (
                      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-starlight/60">
                        {[project.role, project.period ?? project.year?.toString()]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Technologies">
                        {project.technologies.map((technology) => (
                          <li
                            key={technology}
                            className="font-mono text-[9px] uppercase tracking-[0.2em] text-starlight/70"
                          >
                            {technology}
                          </li>
                        ))}
                      </ul>
                    )}
                    {project.contribution && (
                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-starlight/70">
                        <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.2em] text-starlight/55">
                          Contribution
                        </span>
                        {project.contribution}
                      </p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Project tags">
                        {project.tags.map((tag) => (
                          <li
                            key={tag}
                            className="font-mono text-[9px] uppercase tracking-[0.2em] text-starlight/60"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                      {[
                        { label: "Repository", href: project.repositoryUrl },
                        { label: "Live demo", href: project.demoUrl },
                        { label: "Project link", href: project.link },
                      ]
                        .filter((link) => link.href)
                        .map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${link.label}: ${project.title} (opens in a new tab)`}
                            className="inline-flex font-mono text-[10px] uppercase tracking-[0.25em] text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-starlight"
                          >
                            {link.label}
                          </a>
                        ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="projects-reveal flex min-h-72 flex-col justify-center border-y border-indigo/40 py-10 lg:pl-10">
              <p className="max-w-lg font-display text-2xl leading-snug tracking-tight text-starlight sm:text-3xl">
                No project details have been published here yet.
              </p>
              <a
                href="https://github.com/Nazyli"
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex min-h-11 w-fit items-center border border-accent/50 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-accent transition-colors hover:bg-accent/10 hover:text-starlight focus-visible:bg-accent/10"
              >
                Browse GitHub repositories
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
