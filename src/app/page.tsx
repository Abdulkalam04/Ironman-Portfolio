import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { CinematicReveal } from "@/components/sections/CinematicReveal";
import { Education } from "@/components/sections/Education";
import { Games } from "@/components/sections/Games";
import { Opportunity } from "@/components/sections/Opportunity";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <CinematicReveal />
        <Education />
        <Games />
        <Opportunity />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
