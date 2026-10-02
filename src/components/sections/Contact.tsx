"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Check, Github, Linkedin, Mail, Phone, Send } from "lucide-react";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CONTACT, LINKS } from "@/lib/profile";

const field =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground placeholder:text-zinc-600 transition-colors focus:border-accent/60 focus:outline-none";
const label = "mb-2 block font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500";

export function Contact() {
  const [sent, setSent] = useState(false);
  const timer = useRef<number | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Portfolio enquiry from ${String(values.get("name") ?? "a visitor")}`);
    const body = encodeURIComponent(
      `${String(values.get("message") ?? "")}\n\nReply to: ${String(values.get("email") ?? "")}`,
    );
    setSent(true);
    window.location.href = `mailto:${LINKS.email}?subject=${subject}&body=${body}`;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSent(false), 5000);
  };

  const contactRow = "flex items-center gap-3 text-sm transition-colors hover:text-accent";

  return (
    <section id="contact" className="relative scroll-mt-20 border-t border-white/5 bg-[#0c0c0e] px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-14 md:grid-cols-[0.85fr_1.15fr] md:gap-24">
        <AnimatedSection>
          <AnimatedItem>
            <SectionHeading eyebrow={CONTACT.eyebrow} title={CONTACT.title} className="mb-8!" />
          </AnimatedItem>
          <AnimatedItem>
            <p className="max-w-md leading-7 text-zinc-400">{CONTACT.copy}</p>
          </AnimatedItem>
          <AnimatedItem>
            <div className="mt-9 space-y-4">
              <a href={`mailto:${LINKS.email}`} className={`${contactRow} text-foreground`}>
                <Mail size={17} className="text-accent" />
                {LINKS.email}
              </a>
              <a href={LINKS.phoneHref} className={`${contactRow} text-zinc-400`}>
                <Phone size={17} />
                {LINKS.phone}
              </a>
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className={`${contactRow} text-zinc-400`}>
                <Github size={17} />
                {LINKS.githubLabel}
              </a>
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className={`${contactRow} text-zinc-400`}>
                <Linkedin size={17} />
                LinkedIn Profile
              </a>
            </div>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection>
          <AnimatedItem>
            <div className="card-surface p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5" aria-label="Contact Abdul">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>Your name</span>
                    <input required name="name" type="text" autoComplete="name" placeholder="What should I call you?" className={field} />
                  </label>
                  <label className="block">
                    <span className={label}>Email</span>
                    <input required name="email" type="email" autoComplete="email" placeholder="you@company.com" className={field} />
                  </label>
                </div>
                <label className="block">
                  <span className={label}>Message</span>
                  <textarea required name="message" rows={6} placeholder="Tell me what you're working on..." className={`${field} resize-none leading-6`} />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(212,162,47,0.25)] active:translate-y-[1px]"
                  >
                    {sent ? (
                      <>
                        Message prepared <Check size={16} />
                      </>
                    ) : (
                      <>
                        Open email app <Send size={16} />
                      </>
                    )}
                  </button>
                  {sent && (
                    <motion.p
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      role="status"
                      className="font-mono text-xs text-accent"
                    >
                      Your email draft is ready.
                    </motion.p>
                  )}
                </div>
              </form>
            </div>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </section>
  );
}
