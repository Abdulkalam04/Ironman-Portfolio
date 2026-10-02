"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Download, Github, Linkedin, Menu, X } from "lucide-react";
import { LINKS, NAV_LINKS, SITE } from "@/lib/profile";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.05, 0.2, 0.6] },
    );
    sections.forEach((s) => observer.observe(s));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const [first, ...restName] = SITE.name.split(" ");
  const close = () => setOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-300 ${
        scrolled || open
          ? "border-b border-white/10 bg-black/60 backdrop-blur-2xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-8 md:py-5">
        <a
          href="#top"
          onClick={close}
          className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground"
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(212,162,47,0.9)]"
          />
          {first} / {restName.join(" ")}
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={active === l.href ? "page" : undefined}
              className={`font-mono text-[11px] uppercase tracking-[0.24em] transition-colors hover:text-foreground ${
                active === l.href ? "text-accent" : "text-zinc-400"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            title="GitHub profile"
            className="grid size-10 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <Github size={17} />
          </a>
          <a
            href={LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            title="LinkedIn profile"
            className="grid size-10 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <Linkedin size={17} />
          </a>
          <a
            href={LINKS.resume}
            download
            className="group ml-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur-md transition-all duration-200 hover:bg-white/[0.1] active:translate-y-[1px]"
          >
            Resume
            <Download size={14} className="transition-transform duration-200 group-hover:translate-y-0.5" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-foreground backdrop-blur-md lg:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border-t border-white/10 px-6 pb-6 pt-3 lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className={`flex min-h-12 items-center justify-between border-b border-white/5 font-mono text-[12px] uppercase tracking-[0.26em] ${
                    active === l.href ? "text-accent" : "text-zinc-300"
                  }`}
                >
                  {l.label}
                  <ArrowUpRight size={14} className="text-zinc-500" />
                </a>
              ))}
            </nav>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={LINKS.resume}
                download
                onClick={close}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-background"
              >
                Download resume <Download size={14} />
              </a>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="grid size-11 place-items-center rounded-full border border-white/15 text-zinc-300"
              >
                <Github size={17} />
              </a>
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="grid size-11 place-items-center rounded-full border border-white/15 text-zinc-300"
              >
                <Linkedin size={17} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
