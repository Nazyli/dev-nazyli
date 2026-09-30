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

export default function Home() {
  return (
    <EntranceProvider>
      <ScrollProvider>
        <SpaceSceneDynamic />
        <WarpOverlay />
        <div aria-hidden className="obs-vignette pointer-events-none fixed inset-0 z-[5]" />
        <main id="main" tabIndex={-1} className="relative z-10">
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
