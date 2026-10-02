import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  className?: string;
};

/** Consistent heading block for the content sections: mono eyebrow + big tracking-tight title. */
export function SectionHeading({ eyebrow, title, children, className = "" }: Props) {
  const [index, ...rest] = eyebrow.split("//");
  const label = rest.join("//").trim();
  return (
    <div className={`mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end ${className}`}>
      <div>
        <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
          <span className="text-accent">{index.trim()}</span>
          {label && (
            <>
              <span className="h-px w-8 bg-white/20" />
              {label}
            </>
          )}
        </div>
        <h2 className="max-w-[22ch] font-sans text-3xl font-semibold leading-[1.02] tracking-tighter text-foreground sm:text-4xl md:text-6xl">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
