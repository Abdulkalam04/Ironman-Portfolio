"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type Props = {
  src: string;
  className?: string;
  /** Start loading when the element is within this many px of the viewport. */
  rootMargin?: string;
  /** Eager mode skips the observer (used for above-the-fold media). */
  eager?: boolean;
};

/** Only mounts the <video> once it nears the viewport, and respects reduced-motion. */
export function LazyVideo({ src, className = "", rootMargin = "240px 0px", eager = false }: Props) {
  const [inView, setInView] = useState(eager);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (eager) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, rootMargin]);

  useEffect(() => {
    if (reduceMotion && videoRef.current) videoRef.current.pause();
  }, [reduceMotion, inView]);

  return (
    <div ref={containerRef} className="relative size-full">
      {inView ? (
        <video
          ref={videoRef}
          src={src}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className={className}
        />
      ) : (
        <div className="size-full animate-pulse bg-white/[.02]" aria-hidden="true" />
      )}
    </div>
  );
}
