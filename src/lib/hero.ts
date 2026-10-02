export const FRAME_COUNT = 169;

export const framePath = (n: number) =>
  `/frames/frame_${String(n).padStart(4, "0")}.jpg`;

/** Cards that fade in while the Mark LXXXV sequence scrolls. */
export type HeroBeat = {
  id: string;
  show: number;
  hide: number;
  label: string;
  /** Main line, shown large inside the card. */
  text: string;
  /** Small caption on the left of the footer. */
  caption: string;
  /** Mono tag on the right of the footer. */
  tag: string;
};

export const HERO_BEATS: HeroBeat[] = [
  {
    id: "h1",
    show: 0.1,
    hide: 0.3,
    label: "01 — Profile",
    text: "I build software that is dependable, structured, and grounded in real-world engineering constraints.",
    caption: "Abdul Kalam",
    tag: "Software Developer",
  },
  {
    id: "h2",
    show: 0.35,
    hide: 0.55,
    label: "02 — Core Focus",
    text: "Backend systems, database engineering, and software quality — REST APIs, relational data, and defensive debugging.",
    caption: "Java · APIs · SQL",
    tag: "Backend & Data",
  },
  {
    id: "h3",
    show: 0.6,
    hide: 0.8,
    label: "03 — Status",
    text: "Open to software development and QA roles where backend reliability, solid fundamentals, and attention to detail matter.",
    caption: "Mumbai, India",
    tag: "Open to opportunities",
  },
];

export const HERO_TEXT_FADE_END = 0.08;
