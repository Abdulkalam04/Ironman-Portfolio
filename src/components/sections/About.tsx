"use client";

import { ArrowDownRight, Download } from "lucide-react";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { Icon } from "@/components/ui/Icon";
import { LazyVideo } from "@/components/ui/LazyVideo";
import { ABOUT, FOCUS_AREAS, LINKS, STATS } from "@/lib/profile";

export function About() {
  return (
    <section
      id="about"
      className="relative scroll-mt-20 border-t border-white/5 bg-background px-6 pb-24 pt-24 md:px-10 md:pb-36 md:pt-32"
    >
      <div className="hud-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60" />

      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-16 md:grid md:grid-cols-[5fr_4fr] md:gap-20">
        <AnimatedSection className="flex flex-col gap-8">
          <AnimatedItem>
            <EyebrowBadge>{ABOUT.eyebrow}</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="max-w-[18ch] font-sans text-4xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-6xl">
              Disciplined fundamentals applied to{" "}
              <span className="text-accent">practical software systems.</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="max-w-[46ch] font-sans text-xl leading-snug tracking-tight text-foreground md:text-2xl">
              {ABOUT.lead}
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <p className="max-w-[56ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              {ABOUT.body}
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <figure className="card-surface max-w-[62ch] p-6">
              <figcaption className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em]">
                <span className="text-accent">Profile summary</span>
                <span className="text-zinc-500">/about/abdul.md</span>
              </figcaption>
              <p className="font-sans text-sm leading-relaxed text-zinc-300">{ABOUT.resumeSummary}</p>
            </figure>
          </AnimatedItem>
          <AnimatedItem>
            <ul className="flex flex-wrap gap-2">
              {ABOUT.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400"
                >
                  {t}
                </li>
              ))}
            </ul>
          </AnimatedItem>
          <AnimatedItem className="flex flex-wrap gap-3">
            <a
              href={LINKS.resume}
              download
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-background transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-[1px]"
            >
              Download resume <Download size={14} />
            </a>
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur-md transition-all duration-200 hover:bg-white/[0.08] active:translate-y-[1px]"
            >
              View projects
              <ArrowDownRight size={14} className="transition-transform group-hover:-rotate-45" />
            </a>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection className="flex flex-col gap-10 md:mt-3">
          <AnimatedItem className="relative mx-auto aspect-square w-full max-w-[380px]">
            <div className="hero-orbit absolute left-1/2 top-1/2 size-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-accent/25" />
            <div className="absolute left-1/2 top-1/2 size-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-secondary/25 bg-[#101a1e] shadow-[0_0_80px_rgba(111,208,230,0.15)]">
              <LazyVideo src="/videos/avatar-skills.mp4" className="size-full object-contain mix-blend-screen" />
            </div>
            <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-md">
              <span className="pulse-dot size-1.5 rounded-full bg-accent" />
              {ABOUT.status}
            </div>
          </AnimatedItem>

          <div className="flex flex-col divide-y divide-white/8 border-t border-white/8 font-mono">
            {STATS.map((row) => (
              <AnimatedItem key={row.label}>
                <div className="flex items-baseline justify-between gap-6 py-5" data-testid={`stat-${row.label}`}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">{row.label}</span>
                    <span className="font-sans text-[13px] text-zinc-400">{row.note}</span>
                  </div>
                  <span className="text-right text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {row.value}
                  </span>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection className="relative mx-auto mt-20 max-w-[1400px] md:mt-28">
        <AnimatedItem className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
          <span className="h-px w-8 bg-accent/60" />
          Core focus
        </AnimatedItem>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FOCUS_AREAS.map((f) => (
            <AnimatedItem key={f.title} className="h-full">
              <div className="card-surface group h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/30">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon name={f.icon} size={20} />
                </div>
                <h3 className="text-lg font-medium tracking-tight text-foreground">{f.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{f.copy}</p>
                {f.highlight && (
                  <p className="mt-4 border-t border-white/8 pt-4 font-mono text-[10px] uppercase leading-5 tracking-[0.18em] text-secondary">
                    {f.highlight}
                  </p>
                )}
              </div>
            </AnimatedItem>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
