"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, ExternalLink, GitBranch, Image as ImageIcon, Layers3, Sparkles, Workflow, X } from "lucide-react";
import { PROJECTS_COPY, type Project, type ProjectImage, type ProjectStatus } from "@/lib/profile";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const active = status === "IN PROGRESS";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${
        active
          ? "border-accent/35 bg-accent/10 text-accent"
          : "border-secondary/30 bg-secondary/[0.08] text-secondary"
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? "bg-accent" : "bg-secondary"}`} />
      {status}
    </span>
  );
}

const panel = "rounded-xl border border-white/10 bg-black/25 p-5";
const panelLabel = "font-mono text-[10px] uppercase tracking-[0.18em] text-accent";

export function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null);
  const lightboxOpen = useRef(false);
  useEffect(() => {
    lightboxOpen.current = selectedImage !== null;
  }, [selectedImage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Close the lightbox first, then the dialog.
      if (lightboxOpen.current) setSelectedImage(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-lenis-prevent
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#050506]/90 p-4 backdrop-blur-md md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-dialog-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14 }}
        className="card-surface mx-auto my-6 max-w-4xl bg-[#0d0d0f]/95 p-6 md:my-12 md:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="eyebrow">Project {project.number}</p>
              <StatusBadge status={project.status} />
            </div>
            <h3
              id="project-dialog-title"
              className="max-w-3xl font-sans text-3xl font-semibold leading-[1.02] tracking-tighter text-foreground md:text-5xl"
            >
              {project.title}
            </h3>
            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">{project.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Close project case study"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            ["Overview", project.summary],
            ["Problem", project.problem],
            ["Solution", project.solution],
            ["Architecture", project.architecture],
          ].map(([label, copy]) => (
            <div key={label} className={panel}>
              <p className={panelLabel}>{label}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <div className={panel}>
            <div className="flex items-center gap-2">
              <Workflow size={16} className="text-accent" />
              <p className={panelLabel}>How it works</p>
            </div>
            <ol className="mt-5 space-y-2">
              {project.flow.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10 font-mono text-[10px] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-zinc-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={panel}>
            <div className="flex items-center gap-2">
              <Layers3 size={16} className="text-accent" />
              <p className={panelLabel}>Technology stack</p>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.technology.map((item) => (
                <li key={item} className="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[11px] text-secondary">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-zinc-400">{project.highlights[0]}</p>
          </div>
        </div>

        <div className={`mt-5 ${panel}`}>
          <div className="flex items-center gap-2">
            <Check size={16} className="text-accent" />
            <p className={panelLabel}>Key features</p>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {project.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-zinc-300">
                <Check size={15} className="mt-1 shrink-0 text-accent" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className={panel}>
            <p className={panelLabel}>Technical highlights</p>
            <ul className="mt-4 space-y-3">
              {project.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm leading-6 text-zinc-400">
                  <GitBranch size={14} className="mt-1 shrink-0 text-secondary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className={panel}>
            <p className={panelLabel}>What I learned</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{project.learned}</p>
          </div>
        </div>

        {project.resumeNotes && (
          <div className={`mt-5 ${panel}`}>
            <p className={panelLabel}>My contribution</p>
            <ul className="mt-4 space-y-3">
              {project.resumeNotes.map((note) => (
                <li key={note} className="flex items-start gap-2 text-sm leading-6 text-zinc-400">
                  <CheckCircle2 size={14} className="mt-1 shrink-0 text-accent" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.current && (
          <div className="mt-5 rounded-xl border border-accent/25 bg-accent/[0.04] p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <p className={panelLabel}>Currently building</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {(
                [
                  ["Existing", project.current.completed, CheckCircle2],
                  ["In progress", project.current.inProgress, Workflow],
                  ["Next", project.current.planned, Sparkles],
                ] as const
              ).map(([label, items, IconCmp]) => (
                <div key={label}>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <ul className="mt-2 space-y-2">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs leading-5 text-zinc-400">
                        <IconCmp size={13} className="mt-1 shrink-0 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`mt-5 ${panel}`}>
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-accent" />
            <p className={panelLabel}>Project visuals</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {project.screenshots.map((image) => (
              <button
                type="button"
                key={image.src}
                onClick={() => setSelectedImage(image)}
                className="group overflow-hidden rounded-lg border border-white/10 bg-black/30 text-left"
                aria-label={`View ${image.label}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                />
                <span className="block px-2 py-2 font-mono text-[9px] text-zinc-500">{image.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-zinc-400">
            <ExternalLink size={15} />
            {PROJECTS_COPY.noDemo}
          </span>
          <span className="font-mono text-[10px] text-zinc-500">{PROJECTS_COPY.noRepo}</span>
        </div>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-5 backdrop-blur-sm"
              role="dialog"
              aria-label={selectedImage.label}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage.src} alt={selectedImage.alt} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
