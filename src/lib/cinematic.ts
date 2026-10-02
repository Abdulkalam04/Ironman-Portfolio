import { JOURNEY } from "@/lib/profile";

export const CINE_FRAME_COUNT = 169;

export const cineFramePath = (n: number) =>
  `/frames2/frame_${String(n).padStart(4, "0")}.jpg`;

export type Beat = {
  id: string;
  show: number;
  hide: number;
  label: string;
  title: string;
  copy: string;
  index: string;
};

/**
 * One beat per journey milestone. Windows are spread evenly across the scroll
 * so only one card is on screen at a time and the last one is clear of the outro.
 */
const START = 0.07;
const STEP = 0.165;
const SPAN = 0.15;

export const BEATS: Beat[] = JOURNEY.items.map((item, i) => ({
  id: `b${i + 1}`,
  show: START + i * STEP,
  hide: START + i * STEP + SPAN,
  label: item.date,
  title: item.title,
  copy: item.copy,
  index: `${String(i + 1).padStart(2, "0")} / ${String(JOURNEY.items.length).padStart(2, "0")}`,
}));

export const CINE_INTRO_FADE_END = 0.08;
