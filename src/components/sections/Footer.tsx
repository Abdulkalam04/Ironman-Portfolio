import { ArrowUpRight, ChevronRight } from "lucide-react";
import { LINKS, SITE } from "@/lib/profile";

const SECTIONS: [string, string, string][] = [
  ["About", "#about", "Profile & focus"],
  ["Skills", "#skills", "Technical stack"],
  ["Projects", "#projects", "Case studies"],
  ["Journey", "#journey", "Milestones"],
  ["Education", "#education", "Degree & certificates"],
  ["Contact", "#contact", "Say hello"],
];

export function Footer() {
  const [first, ...rest] = SITE.name.split(" ");
  return (
    <footer id="footer" className="border-t border-white/5 bg-background px-6 py-14 md:px-10 md:py-16">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(212,162,47,0.9)]"
              />
              {first} / {rest.join(" ")}
            </div>
            <p className="max-w-[38ch] font-sans text-sm leading-relaxed text-zinc-400">
              {SITE.role} based in {SITE.location}. Backend engineering, REST APIs, relational databases, and
              dependable application architecture.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent">
                GitHub
              </a>
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent">
                LinkedIn
              </a>
              <a href={`mailto:${LINKS.email}`} className="transition-colors hover:text-accent">
                Email
              </a>
              <a href={LINKS.resume} download className="transition-colors hover:text-accent">
                Resume
              </a>
            </div>
          </div>

          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-10 gap-y-3 md:grid-cols-3">
            {SECTIONS.map(([name, href, note]) => (
              <a key={name} href={href} className="group flex flex-col gap-1">
                <span className="font-sans text-[13px] font-medium text-foreground transition-colors group-hover:text-accent">
                  {name}
                  <ArrowUpRight
                    size={11}
                    strokeWidth={3}
                    className="ml-1 inline-block align-baseline opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">{note}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/5 pt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500 md:flex-row md:items-center md:justify-between">
          <span>&copy; {SITE.year} {SITE.name} &nbsp;&middot;&nbsp; Built with Next.js · React · TypeScript · Tailwind</span>
          <span>Hero visuals: Iron Man fan tribute &mdash; no commercial use</span>
          <a href="#top" className="group inline-flex items-center gap-2 text-accent">
            Back to top
            <ChevronRight size={14} className="-rotate-90 transition-transform group-hover:-translate-y-1" />
          </a>
        </div>
      </div>
    </footer>
  );
}
