import { ScrollProvider } from "@/components/providers/ScrollProvider";
import { SpaceSceneDynamic } from "@/components/space/SpaceSceneDynamic";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Expertise } from "@/components/sections/Expertise";
import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <ScrollProvider>
      <SpaceSceneDynamic />
      <main id="main" className="relative z-10">
        <Hero />
        <About />
        <Expertise />
        <Projects />
        <Experience />
        <Contact />
      </main>
    </ScrollProvider>
  );
}
