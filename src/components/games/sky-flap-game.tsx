"use client";

/**
 * Sky Flap — a small flappy-style arcade game for the portfolio.
 *
 * Self-contained: uses only react, framer-motion, lucide-react and the
 * existing Tailwind theme tokens. No new dependencies, no CSS changes.
 * The sky follows the site theme: light mode = day, dark mode = night
 * (and it fades smoothly if you flip the theme switch mid-flight).
 *
 * Usage (src/App.tsx):
 *   import { SkyFlapGame } from '@/components/sky-flap-game';
 *   ...
 *   <Education /><SkyFlapGame /><ResumeCta />
 */
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Keyboard,
  MousePointerClick,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

/* ────────────────────────────────────────────────────────────────────────── *
 * World constants (logical pixels — the canvas is scaled to fit)
 * ────────────────────────────────────────────────────────────────────────── */

export const W = 400;
export const H = 560;
export const GROUND = 72;
const BIRD_X = 112;
const BIRD_R = 15; // drawn radius
const HIT_R = 12; // forgiving collision radius
const READY_Y = 250;
const GRAVITY = 1450;
const FLAP_V = -420;
const MAX_FALL = 640;
export const PILLAR_W = 66;
export const SPACING = 205;
const GAP_START = 176;
const GAP_MIN = 140;
const MAX_GAP_SHIFT = 125;
const SPEED_START = 135;
const SPEED_STEP = 1.45;
const SPEED_MAX_SCORE = 60;
const STAR_POINTS = 3;
const STORAGE_KEY = 'ak-sky-flap-best';
const TAU = Math.PI * 2;

const MILESTONES: ReadonlyArray<readonly [number, string]> = [
  [5, 'Cleared for takeoff'],
  [10, 'Zero bugs in flight'],
  [20, 'Cloud runner'],
  [30, 'Ship it!'],
  [45, 'Sky captain'],
  [60, 'Legendary flight'],
];

/* ────────────────────────────────────────────────────────────────────────── *
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

export type FlapPhase = 'ready' | 'playing' | 'paused' | 'dying' | 'over';

export type Pillar = {
  id: number;
  x: number;
  gapY: number;
  gap: number;
  passed: boolean;
  star: { dx: number; y: number; taken: boolean } | null;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 'puff' | 'feather' | 'spark';
  rot: number;
  vr: number;
};

type Floater = { x: number; y: number; text: string; age: number };

export type World = {
  phase: FlapPhase;
  time: number;
  scroll: number;
  speed: number;
  bird: { y: number; vy: number; rot: number; flapT: number };
  pillars: Pillar[];
  nextId: number;
  score: number;
  stars: number;
  particles: Particle[];
  floaters: Floater[];
  banner: { text: string; age: number } | null;
  milestone: number;
  shake: number;
  flash: number;
  night: number;
  nightTarget: number;
  overTimer: number;
  rng: () => number;
  bg: {
    stars: { x: number; y: number; r: number; p: number }[];
    clouds: { x: number; y: number; s: number; v: number }[];
  };
};

export type Events = {
  flap: () => void;
  score: () => void;
  star: () => void;
  die: () => void;
  over: () => void;
  scoreChanged: (score: number, stars: number) => void;
};

/* ────────────────────────────────────────────────────────────────────────── *
 * Small helpers
 * ────────────────────────────────────────────────────────────────────────── */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = (i: number) => Math.round(A[i] + (B[i] - A[i]) * t);
  return `#${[c(0), c(1), c(2)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
}

const DAY = {
  skyTop: '#5fbcf2',
  skyBot: '#e9f7ff',
  hillFar: '#b5e6d2',
  hillNear: '#86d3b2',
  cloud: '#ffffff',
  towerA: '#f7fcff',
  towerB: '#bcd5ea',
  towerEdge: '#86b1d1',
  groundTop: '#52c792',
  groundA: '#3db07f',
  groundB: '#35a174',
  dirt: '#2b8a64',
  ink: '#0f2b3a',
} as const;

const NIGHT = {
  skyTop: '#040b13',
  skyBot: '#153650',
  hillFar: '#0d2836',
  hillNear: '#0a1f2b',
  cloud: '#2b4d66',
  towerA: '#2b4a62',
  towerB: '#16293a',
  towerEdge: '#6fd6ab',
  groundTop: '#2f8a6c',
  groundA: '#12362f',
  groundB: '#0f2d29',
  dirt: '#0a211e',
  ink: '#04101a',
} as const;

type PaletteKey = keyof typeof DAY;

function palette(night: number): Record<PaletteKey, string> {
  const out = {} as Record<PaletteKey, string>;
  (Object.keys(DAY) as PaletteKey[]).forEach((k) => {
    out[k] = mixHex(DAY[k], NIGHT[k], night);
  });
  return out;
}

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function rankFor(score: number): { title: string; note: string } {
  if (score >= 45) return { title: 'Sky Captain', note: 'Legendary flying. Pure focus.' };
  if (score >= 25) return { title: 'Cloud Runner', note: 'Smooth. The clouds never saw you coming.' };
  if (score >= 12) return { title: 'Sky Cadet', note: 'Nice control. Now go for the golden stars.' };
  if (score >= 4) return { title: 'Fledgling', note: 'Wings are working. Keep flapping.' };
  return { title: 'Fresh Egg', note: 'Everyone starts on the ground. Try again!' };
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Game engine (pure functions on a World object — no React, no DOM)
 * ────────────────────────────────────────────────────────────────────────── */

export function createWorld(rng: () => number = Math.random): World {
  const stars = Array.from({ length: 46 }, () => ({
    x: rng() * W,
    y: rng() * (H - GROUND) * 0.62,
    r: 0.6 + rng() * 1.4,
    p: rng() * TAU,
  }));
  const clouds = Array.from({ length: 6 }, (_, i) => ({
    x: (i / 6) * (W + 200) - 60 + rng() * 40,
    y: 50 + rng() * 170,
    s: 0.7 + rng() * 0.8,
    v: 8 + rng() * 10,
  }));
  return {
    phase: 'ready',
    time: 0,
    scroll: 0,
    speed: SPEED_START,
    bird: { y: READY_Y, vy: 0, rot: 0, flapT: 1 },
    pillars: [],
    nextId: 0,
    score: 0,
    stars: 0,
    particles: [],
    floaters: [],
    banner: null,
    milestone: 0,
    shake: 0,
    flash: 0,
    night: 0,
    nightTarget: 0,
    overTimer: 0,
    rng,
    bg: { stars, clouds },
  };
}

export function resetWorld(w: World): void {
  w.phase = 'ready';
  w.scroll = 0;
  w.speed = SPEED_START;
  w.bird = { y: READY_Y, vy: 0, rot: 0, flapT: 1 };
  w.pillars = [];
  w.nextId = 0;
  w.score = 0;
  w.stars = 0;
  w.particles = [];
  w.floaters = [];
  w.banner = null;
  w.milestone = 0;
  w.shake = 0;
  w.flash = 0;
  w.overTimer = 0;
}

export function gapFor(score: number): number {
  return Math.max(GAP_MIN, GAP_START - score * 1.1);
}

function spawnPillar(w: World): void {
  const prev = w.pillars[w.pillars.length - 1];
  const gap = gapFor(w.score + 2);
  const lo = 56 + gap / 2;
  const hi = H - GROUND - 56 - gap / 2;
  const gapY = prev
    ? clamp(prev.gapY + (w.rng() * 2 - 1) * MAX_GAP_SHIFT, lo, hi)
    : lo + w.rng() * (hi - lo) * 0.6 + (hi - lo) * 0.2;
  const id = w.nextId;
  w.nextId += 1;
  w.pillars.push({
    id,
    x: prev ? prev.x + SPACING : W + 150,
    gapY,
    gap,
    passed: false,
    star: id % 3 === 2 ? { dx: PILLAR_W / 2, y: gapY + (w.rng() - 0.5) * gap * 0.3, taken: false } : null,
  });
}

function startRun(w: World, fx: Events): void {
  w.pillars = [];
  w.nextId = 0;
  w.score = 0;
  w.stars = 0;
  w.speed = SPEED_START;
  w.milestone = 0;
  w.particles = [];
  w.floaters = [];
  w.banner = null;
  w.bird = { y: READY_Y, vy: 0, rot: 0, flapT: 1 };
  w.phase = 'playing';
  while (w.pillars.length === 0 || w.pillars[w.pillars.length - 1].x < W + SPACING * 2) spawnPillar(w);
  fx.scoreChanged(0, 0);
}

function emit(w: World, p: Omit<Particle, 'rot' | 'vr'> & Partial<Pick<Particle, 'rot' | 'vr'>>): void {
  w.particles.push({ rot: 0, vr: 0, ...p });
}

/** Core input action: starts a run from 'ready', resumes from 'paused', or
 * flaps while 'playing'. Called by beginFlight (Start/Resume buttons) and by
 * handleFlap (in-game input), which gates it to the 'playing' phase only. */
export function flapWorld(w: World, fx: Events, reduce: boolean): boolean {
  if (w.phase === 'ready') startRun(w, fx);
  else if (w.phase === 'paused') w.phase = 'playing';
  if (w.phase !== 'playing') return false;
  w.bird.vy = FLAP_V;
  w.bird.flapT = 0;
  if (!reduce) {
    for (let i = 0; i < 3; i += 1) {
      emit(w, {
        x: BIRD_X - 14,
        y: w.bird.y + 6 + w.rng() * 6,
        vx: -30 - w.rng() * 40,
        vy: 20 + w.rng() * 40,
        life: 0.45,
        max: 0.45,
        size: 3 + w.rng() * 3,
        color: '#ffffff',
        kind: 'puff',
      });
    }
  }
  fx.flap();
  return true;
}

export function pauseWorld(w: World): boolean {
  if (w.phase !== 'playing') return false;
  w.phase = 'paused';
  return true;
}

function circleHitsRect(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function killBird(w: World, fx: Events, reduce: boolean): void {
  w.phase = 'dying';
  w.overTimer = 0;
  w.bird.vy = -220;
  if (!reduce) {
    w.shake = 0.55;
    w.flash = 0.35;
    const colors = ['#42d4a0', '#1f9d72', '#167a58', '#e8fff4', '#f5a93a'];
    for (let i = 0; i < 18; i += 1) {
      const a = w.rng() * TAU;
      const sp = 80 + w.rng() * 180;
      emit(w, {
        x: BIRD_X,
        y: w.bird.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0.9 + w.rng() * 0.5,
        max: 1.3,
        size: 3 + w.rng() * 3,
        color: colors[i % colors.length],
        kind: 'feather',
        rot: w.rng() * TAU,
        vr: (w.rng() - 0.5) * 12,
      });
    }
  }
  fx.die();
}

function checkMilestones(w: World): void {
  while (w.milestone < MILESTONES.length && w.score >= MILESTONES[w.milestone][0]) {
    w.banner = { text: MILESTONES[w.milestone][1], age: 0 };
    w.milestone += 1;
  }
}

export function stepWorld(w: World, dt: number, fx: Events, reduce: boolean): void {
  w.night += (w.nightTarget - w.night) * Math.min(1, dt * 3);
  if (w.phase === 'paused') return;

  w.time += dt;
  w.bird.flapT += dt;
  const ambient = reduce ? 0 : 1;

  // slow drifting background clouds
  for (const c of w.bg.clouds) {
    const v = w.phase === 'playing' ? c.v * 2.2 : c.v * ambient;
    c.x -= v * dt;
    if (c.x < -130) {
      c.x = W + 40 + w.rng() * 60;
      c.y = 50 + w.rng() * 170;
    }
  }

  const b = w.bird;

  if (w.phase === 'ready') {
    w.scroll += 60 * dt * ambient;
    b.y = READY_Y + Math.sin(w.time * 3.2) * 8 * ambient;
    b.rot = 0;
  } else if (w.phase === 'playing') {
    b.vy = Math.min(MAX_FALL, b.vy + GRAVITY * dt);
    b.y += b.vy * dt;
    b.rot = clamp(b.vy / 520, -0.45, 1.05);
    if (b.y < BIRD_R) {
      b.y = BIRD_R;
      if (b.vy < 0) b.vy = 0;
    }
    w.scroll += w.speed * dt;
    for (const p of w.pillars) p.x -= w.speed * dt;

    let dead = false;
    for (const p of w.pillars) {
      // scoring
      if (!p.passed && p.x + PILLAR_W < BIRD_X - BIRD_R) {
        p.passed = true;
        w.score += 1;
        w.speed = SPEED_START + Math.min(w.score, SPEED_MAX_SCORE) * SPEED_STEP;
        checkMilestones(w);
        fx.score();
        fx.scoreChanged(w.score, w.stars);
      }
      // collision with the two towers of this pair
      if (p.x < BIRD_X + HIT_R && p.x + PILLAR_W > BIRD_X - HIT_R) {
        const top = circleHitsRect(BIRD_X, b.y, HIT_R, p.x, -200, PILLAR_W, p.gapY - p.gap / 2 + 200);
        const bottom = circleHitsRect(BIRD_X, b.y, HIT_R, p.x, p.gapY + p.gap / 2, PILLAR_W, H);
        if (top || bottom) dead = true;
      }
      // golden star
      if (p.star && !p.star.taken) {
        const sx = p.x + p.star.dx;
        const dx = sx - BIRD_X;
        const dy = p.star.y - b.y;
        if (dx * dx + dy * dy < 27 * 27) {
          p.star.taken = true;
          w.stars += 1;
          w.score += STAR_POINTS;
          checkMilestones(w);
          w.floaters.push({ x: sx, y: p.star.y, text: `+${STAR_POINTS}`, age: 0 });
          if (!reduce) {
            for (let i = 0; i < 10; i += 1) {
              const a = (i / 10) * TAU;
              emit(w, {
                x: sx,
                y: p.star.y,
                vx: Math.cos(a) * 90,
                vy: Math.sin(a) * 90,
                life: 0.5,
                max: 0.5,
                size: 2.5,
                color: '#ffd166',
                kind: 'spark',
              });
            }
          }
          fx.star();
          fx.scoreChanged(w.score, w.stars);
        }
      }
    }
    if (b.y + HIT_R >= H - GROUND) {
      b.y = H - GROUND - HIT_R;
      dead = true;
    }
    if (dead) killBird(w, fx, reduce);

    while (w.pillars.length > 0 && w.pillars[0].x + PILLAR_W < -60) w.pillars.shift();
    while (w.pillars.length === 0 || w.pillars[w.pillars.length - 1].x < W + SPACING) spawnPillar(w);
  } else if (w.phase === 'dying') {
    b.vy = Math.min(MAX_FALL + 200, b.vy + GRAVITY * dt);
    b.y += b.vy * dt;
    b.rot = Math.min(1.6, b.rot + 5 * dt);
    if (b.y + BIRD_R >= H - GROUND) {
      b.y = H - GROUND - BIRD_R;
      b.vy = 0;
      w.overTimer += dt;
      if (w.overTimer > 0.45) {
        w.phase = 'over';
        fx.over();
      }
    }
  }

  // particles, floaters, banner, shake, flash
  for (const p of w.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.kind === 'feather') p.vy += 420 * dt;
    if (p.kind === 'puff') p.vy -= 20 * dt;
  }
  w.particles = w.particles.filter((p) => p.life > 0);
  for (const f of w.floaters) {
    f.age += dt;
    f.y -= 34 * dt;
  }
  w.floaters = w.floaters.filter((f) => f.age < 0.9);
  if (w.banner) {
    w.banner.age += dt;
    if (w.banner.age > 1.8) w.banner = null;
  }
  w.shake = Math.max(0, w.shake - dt * 1.8);
  w.flash = Math.max(0, w.flash - dt * 1.4);
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Rendering (Canvas 2D, logical coordinates)
 * ────────────────────────────────────────────────────────────────────────── */

type Ctx = CanvasRenderingContext2D;
const FONT = "'Manrope', ui-sans-serif, system-ui, sans-serif";

function drawSky(ctx: Ctx, w: World, p: Record<PaletteKey, string>): void {
  const n = w.night;
  const g = ctx.createLinearGradient(0, 0, 0, H - GROUND);
  g.addColorStop(0, p.skyTop);
  g.addColorStop(1, p.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // stars (fade in at night)
  if (n > 0.03) {
    for (const s of w.bg.stars) {
      const a = n * (0.45 + 0.55 * Math.sin(w.time * 2 + s.p));
      if (a < 0.03) continue;
      ctx.fillStyle = `rgba(255,255,255,${clamp(a, 0, 1)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
  }

  // sun -> moon
  const cx = 312;
  const cy = 112;
  if (n < 0.97) {
    const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 130);
    glow.addColorStop(0, `rgba(255,236,170,${0.6 * (1 - n)})`);
    glow.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 140, cy - 140, 280, 280);
    ctx.fillStyle = `rgba(255,243,196,${1 - n})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,224,138,${0.85 * (1 - n)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, TAU);
    ctx.fill();
  }
  if (n > 0.03) {
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 110);
    glow.addColorStop(0, `rgba(170,215,255,${0.3 * n})`);
    glow.addColorStop(1, 'rgba(170,215,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 120, cy - 120, 240, 240);
    ctx.fillStyle = `rgba(243,240,220,${n})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(206,206,186,${0.6 * n})`;
    [[-8, -6, 5], [7, 5, 4], [-3, 10, 3]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, r, 0, TAU);
      ctx.fill();
    });
  }
}

function drawFarClouds(ctx: Ctx, w: World, p: Record<PaletteKey, string>): void {
  ctx.save();
  ctx.globalAlpha = 0.92 - 0.5 * w.night;
  ctx.fillStyle = p.cloud;
  for (const c of w.bg.clouds) {
    ctx.beginPath();
    (
      [
        [0, 4, 20],
        [22, -6, 26],
        [50, 0, 22],
        [26, 10, 22],
      ] as const
    ).forEach(([dx, dy, r]) => {
      ctx.moveTo(c.x + (dx + r) * c.s, c.y + dy * c.s);
      ctx.arc(c.x + dx * c.s, c.y + dy * c.s, r * c.s, 0, TAU);
    });
    ctx.fill();
  }
  ctx.restore();
}

function drawHills(ctx: Ctx, w: World, base: number, amp: number, par: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H - GROUND);
  for (let x = 0; x <= W; x += 8) {
    const t = x + w.scroll * par;
    ctx.lineTo(x, base + Math.sin(t * 0.012) * amp + Math.sin(t * 0.031 + 1.7) * amp * 0.45);
  }
  ctx.lineTo(W, H - GROUND);
  ctx.closePath();
  ctx.fill();
}

function drawTower(ctx: Ctx, x: number, top: number, bottom: number, capAtTop: boolean, p: Record<PaletteKey, string>): void {
  const h = bottom - top;
  if (h <= 0) return;
  const grad = ctx.createLinearGradient(x, 0, x + PILLAR_W, 0);
  grad.addColorStop(0, p.towerA);
  grad.addColorStop(0.55, p.towerA);
  grad.addColorStop(1, p.towerB);

  const shape = (grow: number) => {
    ctx.beginPath();
    ctx.rect(x - grow, top, PILLAR_W + grow * 2, h);
    // fluffy side edges
    for (let yy = top; yy <= bottom; yy += 26) {
      const r = 11 + grow;
      ctx.moveTo(x + r, yy);
      ctx.arc(x, yy, r, 0, TAU);
      if (yy + 13 <= bottom) {
        ctx.moveTo(x + PILLAR_W + r, yy + 13);
        ctx.arc(x + PILLAR_W, yy + 13, r, 0, TAU);
      }
    }
    // big cloud cap facing the gap
    const cy = capAtTop ? top : bottom;
    const cr = 15 + grow;
    for (let i = 0; i < 3; i += 1) {
      const cx = x + 8 + (i * (PILLAR_W - 16)) / 2;
      ctx.moveTo(cx + cr, cy);
      ctx.arc(cx, cy, cr, 0, TAU);
    }
  };

  ctx.fillStyle = p.towerEdge;
  shape(2.2);
  ctx.fill();
  ctx.fillStyle = grad;
  shape(0);
  ctx.fill();
}

function drawGround(ctx: Ctx, w: World, p: Record<PaletteKey, string>): void {
  const y0 = H - GROUND;
  ctx.fillStyle = p.groundA;
  ctx.fillRect(0, y0, W, GROUND);
  ctx.fillStyle = p.groundB;
  const off = -(w.scroll % 40);
  for (let x = off - 40; x < W + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, y0 + 12);
    ctx.lineTo(x + 20, y0 + 12);
    ctx.lineTo(x + 8, y0 + GROUND);
    ctx.lineTo(x - 12, y0 + GROUND);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = p.groundTop;
  ctx.fillRect(0, y0, W, 12);
  ctx.fillStyle = p.dirt;
  ctx.fillRect(0, y0 + 12, W, 3);
}

function drawStarPickup(ctx: Ctx, x: number, y: number, t: number): void {
  const pulse = 1 + Math.sin(t * 6) * 0.08;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 28);
  glow.addColorStop(0, 'rgba(255,214,102,0.55)');
  glow.addColorStop(1, 'rgba(255,214,102,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 30, y - 30, 60, 60);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 1.4);
  ctx.scale(pulse, pulse);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? 12 : 5;
    const a = (i / 10) * TAU - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -12, 0, 12);
  g.addColorStop(0, '#fff0a8');
  g.addColorStop(1, '#f5b942');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#c98a1b';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawBird(ctx: Ctx, w: World): void {
  const { y, rot, flapT } = w.bird;
  const dead = w.phase === 'dying' || w.phase === 'over';
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(rot);

  if (w.night > 0.05) {
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 44);
    g.addColorStop(0, withAlpha('#7edcb4', 0.3 * w.night));
    g.addColorStop(1, withAlpha('#7edcb4', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();
  }

  // tail
  ctx.fillStyle = '#167a58';
  ctx.beginPath();
  ctx.moveTo(-14, -1);
  ctx.lineTo(-28, -8);
  ctx.lineTo(-24, 1);
  ctx.lineTo(-28, 9);
  ctx.lineTo(-14, 5);
  ctx.closePath();
  ctx.fill();

  // body
  const bg = ctx.createLinearGradient(0, -15, 0, 15);
  bg.addColorStop(0, '#42d4a0');
  bg.addColorStop(1, '#1f9d72');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 15, 0, 0, TAU);
  ctx.fill();

  // belly
  ctx.fillStyle = '#e8fff4';
  ctx.beginPath();
  ctx.ellipse(4, 6, 11, 7, 0.15, 0, TAU);
  ctx.fill();

  // crest
  ctx.fillStyle = '#167a58';
  ctx.beginPath();
  ctx.moveTo(-3, -13);
  ctx.quadraticCurveTo(-5, -23, 5, -20);
  ctx.quadraticCurveTo(0, -16, 3, -12);
  ctx.closePath();
  ctx.fill();

  // wing
  const wingAngle = flapT < 0.4 ? Math.sin(flapT * 26) * 0.95 : Math.sin(w.time * 7) * 0.22;
  ctx.save();
  ctx.translate(-6, 1);
  ctx.rotate(-wingAngle * 0.9);
  ctx.fillStyle = '#167a58';
  ctx.beginPath();
  ctx.ellipse(-4, 0, 12, 6.5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // beak
  ctx.fillStyle = '#f5a93a';
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(26, 2);
  ctx.lineTo(14, 6);
  ctx.closePath();
  ctx.fill();

  // eye
  if (dead) {
    ctx.strokeStyle = '#0f2b3a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.lineTo(12, -2);
    ctx.moveTo(12, -8);
    ctx.lineTo(6, -2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, -5, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0f2b3a';
    ctx.beginPath();
    ctx.arc(9.6, -4.6, 2.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10.4, -5.5, 0.9, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(ctx: Ctx, w: World): void {
  for (const p of w.particles) {
    const a = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = p.kind === 'puff' ? a * 0.7 : a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    if (p.kind === 'feather') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.arc(p.x, p.y, p.size * (p.kind === 'puff' ? 1.4 - a * 0.4 : a + 0.4), 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx: Ctx, w: World, p: Record<PaletteKey, string>): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';

  if (w.phase !== 'ready') {
    ctx.font = `800 56px ${FONT}`;
    ctx.lineWidth = 7;
    ctx.strokeStyle = withAlpha(p.ink, 0.4);
    ctx.strokeText(String(w.score), W / 2, 92);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(w.score), W / 2, 92);
  }

  for (const f of w.floaters) {
    ctx.font = `800 20px ${FONT}`;
    ctx.globalAlpha = clamp(1 - f.age / 0.9, 0, 1);
    ctx.lineWidth = 4;
    ctx.strokeStyle = withAlpha(p.ink, 0.5);
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  if (w.banner) {
    const a = clamp(Math.min(w.banner.age * 5, (1.8 - w.banner.age) * 5, 1), 0, 1);
    ctx.font = `700 13px ${FONT}`;
    const tw = ctx.measureText(w.banner.text).width + 34;
    const bx = W / 2 - tw / 2;
    const by = 118;
    ctx.globalAlpha = a;
    ctx.fillStyle = withAlpha(p.ink, 0.55);
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(w.banner.text, W / 2, by + 20);
    ctx.globalAlpha = 1;
  }
}

/** Draws one full frame. `ctx` must already be scaled to the W x H logical space. */
export function drawWorld(ctx: Ctx, w: World): void {
  const p = palette(clamp(w.night, 0, 1));
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  if (w.shake > 0) {
    const m = w.shake * 9;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  drawSky(ctx, w, p);
  drawFarClouds(ctx, w, p);
  drawHills(ctx, w, H - GROUND - 92, 26, 0.12, p.hillFar);
  drawHills(ctx, w, H - GROUND - 46, 16, 0.28, p.hillNear);

  for (const pl of w.pillars) {
    drawTower(ctx, pl.x, -30, pl.gapY - pl.gap / 2, false, p);
    drawTower(ctx, pl.x, pl.gapY + pl.gap / 2, H - GROUND + 20, true, p);
    if (pl.star && !pl.star.taken) drawStarPickup(ctx, pl.x + pl.star.dx, pl.star.y, w.time);
  }

  drawGround(ctx, w, p);
  drawParticles(ctx, w);
  drawBird(ctx, w);
  drawHud(ctx, w, p);

  if (w.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${w.flash * 0.9})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Tiny synthesized sound effects (off by default, no audio files)
 * ────────────────────────────────────────────────────────────────────────── */

type Sfx = 'flap' | 'score' | 'star' | 'hit';

function createSfx(): (kind: Sfx) => void {
  let audio: AudioContext | null = null;
  return (kind) => {
    try {
      if (!audio) {
        const Ctor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        audio = new Ctor();
      }
      if (audio.state === 'suspended') void audio.resume();
      const t0 = audio.currentTime;
      const tone = (type: OscillatorType, from: number, to: number, start: number, dur: number, vol: number) => {
        if (!audio) return;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(from, t0 + start);
        osc.frequency.exponentialRampToValueAtTime(to, t0 + start + dur);
        gain.gain.setValueAtTime(vol, t0 + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(t0 + start);
        osc.stop(t0 + start + dur + 0.02);
      };
      if (kind === 'flap') tone('triangle', 380, 640, 0, 0.09, 0.05);
      else if (kind === 'score') {
        tone('sine', 660, 660, 0, 0.09, 0.06);
        tone('sine', 880, 880, 0.08, 0.12, 0.06);
      } else if (kind === 'star') {
        tone('triangle', 880, 880, 0, 0.09, 0.06);
        tone('triangle', 1175, 1175, 0.08, 0.09, 0.06);
        tone('triangle', 1568, 1568, 0.16, 0.16, 0.06);
      } else tone('sawtooth', 240, 60, 0, 0.32, 0.07);
    } catch {
      /* audio unavailable — the game still works */
    }
  };
}

/* ────────────────────────────────────────────────────────────────────────── *
 * React component
 * ────────────────────────────────────────────────────────────────────────── */

type UiPhase = 'ready' | 'playing' | 'paused' | 'over';
const toUi = (p: FlapPhase): UiPhase => (p === 'dying' ? 'playing' : p);

export function SkyFlapGame() {
  const reduceMotion = useReducedMotion();
  const reduce = !!reduceMotion;
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;

  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const inView = useInView(rootRef, { amount: 0.25 });

  const world = useRef<World>(createWorld());
  const sfx = useRef<((kind: Sfx) => void) | null>(null);
  const soundRef = useRef(false);
  const bestRef = useRef(0);

  const [ui, setUi] = useState<UiPhase>('ready');
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [best, setBest] = useState(readBest);
  const [sound, setSound] = useState(false);
  const [result, setResult] = useState<{ score: number; stars: number; newBest: boolean } | null>(null);
  const [announce, setAnnounce] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  bestRef.current = best;
  soundRef.current = sound;

  const play = useCallback((kind: Sfx) => {
    if (!soundRef.current) return;
    if (!sfx.current) sfx.current = createSfx();
    sfx.current(kind);
  }, []);

  const fx = useMemo<Events>(
    () => ({
      flap: () => play('flap'),
      score: () => play('score'),
      star: () => play('star'),
      die: () => play('hit'),
      scoreChanged: (s, st) => {
        setScore(s);
        setStars(st);
      },
      over: () => {
        const w = world.current;
        const newBest = w.score > bestRef.current;
        if (newBest) {
          setBest(w.score);
          try {
            window.localStorage.setItem(STORAGE_KEY, String(w.score));
          } catch {
            /* storage unavailable */
          }
        }
        setResult({ score: w.score, stars: w.stars, newBest });
        setAnnounce(`Game over. You scored ${w.score}.${newBest ? ' New personal best!' : ''}`);
        setUi('over');
      },
    }),
    [play],
  );

  /** Flaps mid-flight only. Starting or resuming happens exclusively through
   * the explicit Start/Resume buttons (beginFlight below), not by clicking or
   * pressing a key anywhere on the board. */
  const handleFlap = useCallback(() => {
    const w = world.current;
    if (w.phase !== 'playing') return;
    flapWorld(w, fx, reduceRef.current);
    setUi(toUi(w.phase));
  }, [fx]);

  /** Used by the Start button (after the countdown) and the Resume button.
   * Starts a fresh run from 'ready' or resumes from 'paused', with an
   * immediate flap either way. */
  const beginFlight = useCallback(() => {
    const w = world.current;
    if (countdownTimer.current !== null) {
      window.clearTimeout(countdownTimer.current);
      countdownTimer.current = null;
      setCountdown(null);
    }
    flapWorld(w, fx, reduceRef.current);
    setUi(toUi(w.phase));
  }, [fx]);

  /** Start button: a 3-2-1 beat before the first flap. */
  const beginCountdown = useCallback(() => {
    if (countdownTimer.current !== null || world.current.phase !== 'ready') return;
    let n = 3;
    setCountdown(n);
    const tick = () => {
      countdownTimer.current = window.setTimeout(() => {
        n -= 1;
        if (n <= 0) {
          countdownTimer.current = null;
          setCountdown(null);
          if (world.current.phase === 'ready') beginFlight();
          return;
        }
        setCountdown(n);
        tick();
      }, 1000);
    };
    tick();
  }, [beginFlight]);

  useEffect(
    () => () => {
      if (countdownTimer.current !== null) window.clearTimeout(countdownTimer.current);
    },
    [],
  );

  const pause = useCallback(() => {
    if (pauseWorld(world.current)) setUi('paused');
  }, []);

  const playAgain = useCallback(() => {
    resetWorld(world.current);
    setResult(null);
    setScore(0);
    setStars(0);
    setUi('ready');
    setAnnounce('');
    wrapRef.current?.focus({ preventScroll: true });
  }, []);

  /* Canvas sizing (crisp on high-DPI screens) */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const k = canvas.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawWorld(ctx, world.current);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return undefined;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const cw = el.clientWidth || W;
      canvas.width = Math.max(1, Math.round(cw * dpr));
      canvas.height = Math.max(1, Math.round((cw * dpr * H) / W));
      draw();
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  /* Start with the sky that matches the current theme */
  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark') ? 1 : 0;
    world.current.night = dark;
    world.current.nightTarget = dark;
  }, []);

  /* Main loop: only runs while the game is on screen. */
  useEffect(() => {
    if (!inView) {
      pause();
      return undefined;
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000));
      last = now;
      const w = world.current;
      w.nightTarget = document.documentElement.classList.contains('dark') ? 1 : 0;
      stepWorld(w, dt, fx, reduceRef.current);
      draw();
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(raf);
  }, [inView, fx, draw, pause]);

  /* Pause when the tab is hidden */
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause]);

  useEffect(() => {
    if (ui === 'over') againRef.current?.focus({ preventScroll: true });
  }, [ui]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return; // let overlay buttons behave normally
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
      event.preventDefault();
      handleFlap();
    } else if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      event.preventDefault();
      pause();
    }
  };

  const rank = result ? rankFor(result.score) : null;

  return (
    <section id="fly" aria-labelledby="fly-title" className="section-shell py-16 sm:py-20 md:py-32">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.65 }}
      >
        <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-12 md:flex-row md:items-end">
          <div>
            <div className="eyebrow mb-4 flex items-center gap-3">
              <Zap size={13} className="text-accent" />
              <span className="h-px w-8 bg-white/20" />
              Fun zone
            </div>
            <h2
              id="fly-title"
              className="max-w-2xl text-3xl font-medium tracking-[-.035em] text-foreground sm:text-4xl md:text-5xl"
            >
              Sky Flap. How high can you fly?
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            A quick break between projects. Thread the bird through the cloud towers and grab the golden stars.
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          {/* Info column */}
          <div className="order-2 lg:order-1">
            <h3 className="text-2xl leading-tight tracking-[-.04em] text-foreground md:text-3xl">
              Easy to learn. Hard to put down.
            </h3>
            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              Every tower you clear is a point, and every golden star is worth {STAR_POINTS}. The gaps shrink and the wind picks up the longer you last.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2.5">
              {[
                [MousePointerClick, 'Click or tap to flap'],
                [Keyboard, 'Space or ↑'],
                [Pause, 'P to pause'],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Pause;
                return (
                  <li
                    key={label as string}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3.5 py-1.5 font-mono text-[11px] text-muted-foreground"
                  >
                    <I size={13} className="text-primary" /> {label as string}
                  </li>
                );
              })}
            </ul>

            <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                ['Score', String(score), 'text-foreground'],
                ['Best', String(best), 'text-accent'],
                ['Stars', String(stars), 'text-primary'],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3.5">
                  <dt className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{label}</dt>
                  <dd className={`mt-1.5 font-mono text-2xl tabular-nums ${tone}`} data-testid={`text-flap-${(label as string).toLowerCase()}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button
                type="button"
                role="switch"
                aria-checked={sound}
                onClick={() => setSound((v) => !v)}
                className="flex min-h-11 items-center gap-3 text-left text-sm text-muted-foreground"
                data-testid="switch-flap-sound"
              >
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${sound ? 'border-primary/50 bg-primary/25' : 'border-white/15 bg-white/[.04]'}`}
                >
                  <span
                    className={`absolute top-[2px] size-[18px] rounded-full transition-all ${sound ? 'left-[22px] bg-primary' : 'left-[2px] bg-muted-foreground'}`}
                  />
                </span>
                <span className="flex items-center gap-2 text-foreground">
                  {sound ? <Volume2 size={15} /> : <VolumeX size={15} />} Sound {sound ? 'on' : 'off'}
                </span>
              </button>
            </div>

            <p className="mt-6 flex max-w-md items-start gap-2.5 text-xs leading-5 text-muted-foreground">
              <Moon size={14} className="mt-0.5 shrink-0 text-secondary" />
              Tip: flip the theme switch in the menu while you fly. Day turns into night, and the stars come out.
            </p>
          </div>

          {/* Game column */}
          <div ref={rootRef} className="relative order-1 mx-auto w-full max-w-md lg:order-2">
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl" aria-hidden="true" />
            <p className="sr-only" role="status" aria-live="polite">
              {announce}
            </p>
            <div
              ref={wrapRef}
              tabIndex={0}
              role="application"
              aria-label="Sky Flap game. Press space, arrow up, or click to flap. Press P to pause."
              onKeyDown={onKeyDown}
                className="relative aspect-[5/7] w-full select-none overflow-hidden rounded-2xl border border-white/10 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ aspectRatio: `${W} / ${H}` }}
              data-testid="game-flap-wrap"
            >
              <canvas
                ref={canvasRef}
                className="block size-full h-auto w-full"
                style={{ touchAction: ui === 'playing' ? 'none' : 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  wrapRef.current?.focus({ preventScroll: true });
                  handleFlap();
                }}
                data-testid="canvas-flap"
              />

              {/* Ready overlay */}
              <AnimatePresence>
                {ui === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-[16%] text-center"
                  >
                    <div>
                      <p className="text-5xl font-extrabold tracking-[-.05em] text-white [text-shadow:0_3px_22px_rgba(0,30,60,.5)]">
                        Sky Flap
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[.22em] text-white/90 [text-shadow:0_1px_8px_rgba(0,30,60,.6)]">
                        Thread the towers
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      {countdown === null ? (
                        <>
                          <span className="relative flex size-12 items-center justify-center">
                            {!reduce && (
                              <motion.span
                                className="absolute inset-0 rounded-full border-2 border-white/80"
                                animate={{ scale: [0.6, 1.5], opacity: [0.9, 0] }}
                                transition={{ duration: 1.4, repeat: Infinity }}
                              />
                            )}
                            <MousePointerClick size={22} className="text-white" />
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              wrapRef.current?.focus({ preventScroll: true });
                              beginCountdown();
                            }}
                            className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
                            data-testid="button-flap-start"
                          >
                            <Play size={16} className="fill-current" /> Start flying
                          </button>
                        </>
                      ) : (
                        <>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={countdown}
                              initial={reduce ? false : { scale: 1.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={reduce ? undefined : { scale: 0.6, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="text-6xl font-extrabold text-white [text-shadow:0_3px_22px_rgba(0,30,60,.5)]"
                              data-testid="text-flap-countdown"
                            >
                              {countdown}
                            </motion.span>
                          </AnimatePresence>
                          <span className="rounded-full bg-black/45 px-4 py-2 font-mono text-[11px] uppercase tracking-[.16em] text-white backdrop-blur-sm">
                            Get ready…
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Paused overlay */}
              {ui === 'paused' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/55 px-6 py-5 text-center text-white">
                    <Pause size={22} />
                    <p className="text-lg font-semibold">Paused</p>
                    <button
                      type="button"
                      onClick={() => {
                        wrapRef.current?.focus({ preventScroll: true });
                        beginFlight();
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                      data-testid="button-flap-resume"
                    >
                      <Play size={15} className="fill-current" /> Resume
                    </button>
                  </div>
                </div>
              )}

              {/* Game over overlay */}
              <AnimatePresence>
                {ui === 'over' && result && rank && (
                  <motion.div
                    key="over"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-5 backdrop-blur-[3px]"
                  >
                    <motion.div
                      initial={reduce ? false : { y: 24, scale: 0.94, opacity: 0 }}
                      animate={{ y: 0, scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      className="w-full max-w-xs rounded-2xl border border-border bg-card/95 p-5 text-center shadow-2xl sm:p-6"
                    >
                      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent">
                        <Trophy size={22} />
                      </span>
                      <p className="eyebrow mt-4">{result.newBest ? 'New personal best!' : 'Crash landing'}</p>
                      <h4 className="mt-2 text-2xl tracking-[-.03em] text-foreground" data-testid="text-flap-rank">
                        {rank.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{rank.note}</p>

                      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                        {[
                          ['Score', result.score],
                          ['Best', Math.max(best, result.score)],
                          ['Stars', result.stars],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-border bg-muted/50 py-2">
                            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">{label}</p>
                            <p className="mt-0.5 flex items-center justify-center gap-1 font-mono text-lg tabular-nums text-foreground">
                              {label === 'Stars' && <Star size={12} className="fill-accent text-accent" />}
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-2.5">
                        <button
                          ref={againRef}
                          type="button"
                          onClick={playAgain}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                          data-testid="button-flap-again"
                        >
                          <RotateCcw size={16} /> Fly again
                        </button>
                        <a
                          href="#contact"
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-primary/45"
                        >
                          Enjoyed it? Let&apos;s talk <ArrowRight size={15} />
                        </a>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default SkyFlapGame;
