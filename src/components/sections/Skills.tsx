"use client";

import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { Icon } from "@/components/ui/Icon";
import { LazyVideo } from "@/components/ui/LazyVideo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SKILLS } from "@/lib/profile";

export function Skills() {
  return (
    <section
      id="skills"
      className="relative scroll-mt-20 border-t border-white/5 bg-[#0c0c0e] px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <AnimatedSection>
          <AnimatedItem>
            <SectionHeading eyebrow={SKILLS.eyebrow} title={SKILLS.title}>
              <div className="card-surface group w-full max-w-sm shrink-0 p-3.5 transition duration-300 hover:-translate-y-1 hover:border-accent/30">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <LazyVideo src="/videos/avatar-hero.mp4" className="size-full object-cover" />
                </div>
                <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-accent/90">
                  {SKILLS.avatarCaption}
                </p>
              </div>
            </SectionHeading>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SKILLS.groups.map((group, index) => (
            <AnimatedItem key={group.label} className="h-full">
              <div className="card-surface group h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-white/[0.05] text-accent transition-transform group-hover:rotate-3">
                      <Icon name={group.icon} size={19} />
                    </span>
                    <h3 className="text-lg font-medium tracking-tight text-foreground">{group.label}</h3>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1.5 font-mono text-xs text-zinc-400 transition duration-300 hover:-translate-y-0.5 hover:border-accent/45 hover:text-foreground hover:shadow-[0_8px_22px_rgba(212,162,47,0.1)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedSection>

        <AnimatedSection className="mt-12">
          <AnimatedItem>
            <div className="card-surface p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">{SKILLS.applied.eyebrow}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tighter text-foreground md:text-3xl">
                    {SKILLS.applied.title}
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  {SKILLS.applied.path}
                </span>
              </div>
              <div className="mt-7 grid gap-3 md:grid-cols-3">
                {SKILLS.applied.items.map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{item.title}</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{item.stack}</p>
                    <p className="mt-3 text-xs leading-5 text-zinc-500">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection className="mt-10">
          <AnimatedItem>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm text-zinc-400">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Engineering practices</span>
              {SKILLS.practices.map((p, i) => (
                <span key={p} className="flex items-center gap-5">
                  {i > 0 && <span className="text-white/20">/</span>}
                  {p}
                </span>
              ))}
            </div>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </section>
  );
}
