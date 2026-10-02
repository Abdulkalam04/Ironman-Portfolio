"use client";

import { ArrowDownRight, Download } from "lucide-react";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { LINKS, OPPORTUNITY } from "@/lib/profile";

export function Opportunity() {
  return (
    <section id="opportunities" className="relative border-t border-white/5 bg-background px-6 py-24 md:px-10 md:py-32">
      <AnimatedSection className="mx-auto max-w-[1400px]">
        <AnimatedItem>
          <div className="relative overflow-hidden rounded-[20px] border border-accent/25 bg-accent/[0.05] p-7 md:p-14">
            <div className="absolute -right-14 -top-20 size-64 rounded-full border border-accent/10" />
            <div className="absolute -right-4 -top-10 size-44 rounded-full border border-secondary/10" />
            <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <EyebrowBadge className="mb-6">{OPPORTUNITY.eyebrow}</EyebrowBadge>
                <h2 className="font-sans text-3xl font-semibold leading-[1.02] tracking-tighter text-foreground md:text-6xl">
                  {OPPORTUNITY.title}
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-zinc-400">{OPPORTUNITY.copy}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={LINKS.resume}
                  download
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(212,162,47,0.25)] active:translate-y-[1px]"
                >
                  Download resume <Download size={15} />
                </a>
                <a
                  href="#contact"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur-md transition-all duration-200 hover:bg-white/[0.1] active:translate-y-[1px]"
                >
                  Contact me <ArrowDownRight size={15} />
                </a>
              </div>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </section>
  );
}
