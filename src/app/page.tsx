import { EntranceProvider } from "@/components/providers/EntranceProvider";
import { ScrollProvider } from "@/components/providers/ScrollProvider";
import { SpaceSceneDynamic } from "@/components/space/SpaceSceneDynamic";
import { CursorReticle } from "@/components/ui/CursorReticle";
import { SurveyProbe } from "@/components/ui/SurveyProbe";
import { ObservatoryChrome } from "@/components/ui/ObservatoryChrome";
import { WarpOverlay } from "@/components/ui/WarpOverlay";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Expertise } from "@/components/sections/Expertise";
import { Projects } from "@/components/sections/Projects";
import { Certificates } from "@/components/sections/Certificates";
import { Experience } from "@/components/sections/Experience";
import { Contact } from "@/components/sections/Contact";
import { publishedProjects } from "@/data/projects";
import { SITE_URL } from "@/lib/site";

export default function Home() {
  const projectStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#projects`,
    name: "Selected software projects",
    numberOfItems: publishedProjects.length,
    itemListElement: publishedProjects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareSourceCode",
        "@id": `${SITE_URL}/#project-${project.id}`,
        name: project.title,
        description: project.description,
        url: `${SITE_URL}/#project-${project.id}`,
        ...(project.repositoryUrl
          ? { codeRepository: project.repositoryUrl }
          : {}),
        ...(project.technologies?.length
          ? { keywords: project.technologies }
          : {}),
        creator: { "@id": `${SITE_URL}/#person` },
      },
    })),
  };

  return (
    <EntranceProvider>
      <ScrollProvider>
        <SpaceSceneDynamic />
        <WarpOverlay />
        <div aria-hidden className="obs-vignette pointer-events-none fixed inset-0 z-[5]" />
        <main id="main" tabIndex={-1} className="relative z-10">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(projectStructuredData).replace(/</g, "\\u003c"),
            }}
          />
          <Hero />
          <About />
          <Expertise />
          <Projects />
          <Certificates />
          <Experience />
          <Contact />
        </main>
        <ObservatoryChrome />
        <SurveyProbe />
        <CursorReticle />
      </ScrollProvider>
    </EntranceProvider>
  );
}
