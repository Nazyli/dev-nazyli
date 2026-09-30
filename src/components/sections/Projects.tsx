"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { buildConstellationPath, publishedProjects } from "@/data/projects";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Projects() {
  const root = useRef<HTMLElement>(null);

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

          paths.forEach((path) => {
            if (!path) return;
            const length = path.getTotalLength();
            gsap.set(path, {
              strokeDasharray: length,
              strokeDashoffset: length,
            });
          });
          gsap.set(slides.slice(1), { autoAlpha: 0, y: 18 });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * slides.length}`,
              pin: true,
              scrub: 0.65,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          if (paths[0]) {
            timeline.to(paths[0], { strokeDashoffset: 0, duration: 0.25 });
          }

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
          });
          timeline.to({}, { duration: 1 }, slides.length - 1);

          return () => section.classList.remove("projects-pinned");
        },
      );

      mm.add(
        "(prefers-reduced-motion: no-preference) and (max-width: 1023px)",
        () => {
          gsap.utils
            .toArray<SVGPathElement>(".project-constellation-path", root.current)
            .forEach((path) => {
              const length = path.getTotalLength();
              gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length,
              });
              gsap.to(path, {
                strokeDashoffset: 0,
                duration: 1.4,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: path,
                  start: "top 78%",
                  once: true,
                },
              });
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
          </div>

          {publishedProjects.length > 0 ? (
            <div className="projects-reveal project-stage divide-y divide-indigo/40 border-y border-indigo/40">
              {publishedProjects.map((project) => (
                <article
                  key={project.id}
                  className="project-slide grid gap-5 py-7 sm:grid-cols-[112px_1fr] sm:gap-7"
                >
                  {project.constellation && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      className="h-20 w-20 self-center"
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
                          className="fill-gold"
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
