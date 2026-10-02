"use client";

import { Check, FileText, GraduationCap } from "lucide-react";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { EDUCATION } from "@/lib/profile";

export function Education() {
  return (
    <section
      id="education"
      className="relative scroll-mt-20 border-t border-white/5 bg-[#0c0c0e] px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <AnimatedSection className="mb-12 flex flex-col gap-6 md:mb-16">
          <AnimatedItem>
            <EyebrowBadge>{EDUCATION.eyebrow}</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="max-w-[20ch] font-sans text-3xl font-semibold leading-[1.02] tracking-tighter text-foreground sm:text-4xl md:text-6xl">
              Academic <span className="text-accent">foundations</span> &amp; credentials.
            </h2>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
          <AnimatedItem>
            <div className="h-full rounded-[20px] border border-accent/25 bg-accent/[0.04] p-7 md:p-9">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Education</p>
                <GraduationCap size={21} className="text-accent" />
              </div>
              <h3 className="mt-8 font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {EDUCATION.degree}
              </h3>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                {EDUCATION.college}
                <br />
                {EDUCATION.collegePlace}
              </p>

              <div className="mt-8 flex items-end justify-between gap-6 border-t border-white/10 pt-5">
                <ul className="space-y-4 font-mono text-xs leading-6 text-zinc-400">
                  {EDUCATION.school.map((s) => (
                    <li key={s.title}>
                      {s.title}
                      <br />
                      <span className="text-zinc-200">{s.detail}</span>
                      <br />
                      <span className="font-sans text-[11px] text-zinc-500">{s.note}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-right">
                  <strong className="block font-mono text-5xl tracking-[-0.08em] text-accent md:text-6xl">
                    {EDUCATION.cgpi}
                  </strong>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                    {EDUCATION.cgpiLabel}
                  </span>
                </div>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem>
            <div className="card-surface h-full p-7 md:p-9">
              <p className="eyebrow mb-8">Certifications &amp; learning</p>
              <ul className="space-y-4 text-sm text-zinc-400">
                {EDUCATION.certifications.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                    {c}
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-white/10 pt-6">
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {EDUCATION.certificates.map((cert) => (
                    <li key={cert.pdf}>
                      <a
                        href={cert.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${cert.label} certificate PDF`}
                        className="group block overflow-hidden"
                      >
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition duration-300 group-hover:border-accent/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cert.src}
                            alt={cert.alt}
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-50"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 transition duration-300 group-hover:opacity-100">
                            <FileText size={22} className="text-white drop-shadow" />
                            <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-white drop-shadow">
                              Open PDF
                            </span>
                          </div>
                          <div className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-accent backdrop-blur-sm">
                            PDF
                          </div>
                        </div>
                        <p
                          className="mt-2 truncate font-mono text-[10px] text-zinc-500 transition duration-300 group-hover:text-accent/80"
                          title={cert.label}
                        >
                          {cert.label}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </section>
  );
}
