"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Search } from "lucide-react";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { Icon } from "@/components/ui/Icon";
import { LazyVideo } from "@/components/ui/LazyVideo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectModal, StatusBadge } from "@/components/sections/ProjectModal";
import { PROJECT_FILTERS, PROJECTS, PROJECTS_COPY, type Project, type ProjectFilter } from "@/lib/profile";

function ProjectVisual({ project }: { project: Project }) {
  const image = project.screenshots[0];
  return (
    <div className="group/visual relative aspect-[4/3] overflow-hidden bg-[#10161a] md:aspect-auto md:min-h-[380px]">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {project.video ? (
        <div className="absolute inset-0 opacity-70 transition duration-500 group-hover/visual:scale-[1.03]">
          <LazyVideo src={project.video} className="size-full object-cover" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.src} alt={image.alt} loading="lazy" className="absolute inset-0 size-full object-cover opacity-60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090a]/90 via-[#07090a]/30 to-transparent" />
      <div className="relative flex h-full min-h-0 flex-col justify-between p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-xs text-white/65">PROJECT {project.number}</span>
          <StatusBadge status={project.status} />
        </div>
        <div>
          <div className="mb-3 flex items-center gap-3 text-accent">
            <Icon name={project.icon} size={25} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
              {project.categories[0]}
            </span>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/75">Project demo video</p>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, index, onSelect }: { project: Project; index: number; onSelect: (p: Project) => void }) {
  const reverse = index % 2 === 1;
  return (
    <article
      className={`card-surface group grid overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 md:grid-cols-2 ${
        reverse ? "md:[&>div:first-child]:order-2" : ""
      }`}
    >
      <ProjectVisual project={project} />
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`font-mono text-xs ${project.tone === "gold" ? "text-accent" : "text-secondary"}`}>
            {project.year}
          </span>
          <span className="font-mono text-[10px] text-zinc-500">{project.categories.join(" · ")}</span>
        </div>
        <h3 className="mt-5 max-w-xl font-sans text-3xl font-semibold leading-[1.02] tracking-tighter text-foreground md:text-4xl">
          {project.title}
        </h3>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">{project.summary}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-secondary transition-colors hover:border-accent/30 hover:text-accent"
            >
              #{tag}
            </li>
          ))}
        </ul>
        <ul className="mt-7 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
          {project.features.slice(0, 4).map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-zinc-400">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent" />
              {feature}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onSelect(project)}
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(212,162,47,0.25)] active:translate-y-[1px]"
        >
          View case study <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}

export function Projects() {
  const [selected, setSelected] = useState<Project | null>(null);
  const [filter, setFilter] = useState<ProjectFilter>("All");
  const filtered = useMemo(
    () => (filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.categories.includes(filter as Exclude<ProjectFilter, "All">))),
    [filter],
  );

  return (
    <section id="projects" className="relative scroll-mt-20 border-t border-white/5 bg-background px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <AnimatedSection>
          <AnimatedItem>
            <SectionHeading eyebrow={PROJECTS_COPY.eyebrow} title={PROJECTS_COPY.title}>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{PROJECTS_COPY.path}</span>
            </SectionHeading>
          </AnimatedItem>
          <AnimatedItem>
            <div className="mb-8 flex flex-wrap items-center gap-2 border-y border-white/10 py-4 sm:mb-10" role="group" aria-label="Filter projects">
              <Search size={15} className="mr-2 text-accent" aria-hidden />
              {PROJECT_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                  className={`min-h-11 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    filter === item
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </AnimatedItem>
        </AnimatedSection>

        <div className="space-y-6">
          {filtered.length === 0 && (
            <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              No projects in this category yet.
            </p>
          )}
          {filtered.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} onSelect={setSelected} />
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <span className="size-2 rounded-full bg-accent" />
          {PROJECTS_COPY.footnote}
        </div>
      </div>

      {/* Modal sits at the section root so no transformed ancestor can break `position: fixed`. */}
      <AnimatePresence>{selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </section>
  );
}
