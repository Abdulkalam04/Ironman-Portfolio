"use client";

/**
 * Bug Smash — a whack-a-bug arcade game for the portfolio.
 *
 * Bugs pop out of terminal holes. Squash them before they escape, but watch out:
 *   - Golden bugs are worth 5, and the boss "Memory Leak" takes 3 hits.
 *   - The PROD server is a decoy. Hit it and production goes down (lose a life).
 *   - Coffee adds 3 seconds.
 *   - Chain squashes without a miss to build a combo multiplier (up to x4).
 *
 * Self-contained: uses only react, framer-motion, lucide-react and the
 * existing Tailwind theme tokens. No new dependencies, no CSS changes.
 *
 * Usage (src/App.tsx):
 *   import { BugSmashGame } from '@/components/bug-smash-game';
 *   ...
 *   <Education /><BugSmashGame /><ResumeCta />
 */
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Keyboard,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

/* ────────────────────────────────────────────────────────────────────────── *
 * Constants (logical pixels — the canvas is scaled to fit)
 * ────────────────────────────────────────────────────────────────────────── */

export const W = 400;
export const H = 560;
export const TOTAL_TIME = 45;
export const MAX_TIME = 60;
export const COFFEE_BONUS = 3;
export const LIVES = 3;
const STORAGE_KEY = 'ak-bug-smash-best';
const TAU = Math.PI * 2;

export const HOLE_X = [82, 200, 318] as const;
export const HOLE_Y = [246, 362, 478] as const;
const HOLE_RX = 46;
const HOLE_RY = 15;
/** Keyboard layout: top-left hole is Q / 7, bottom-right is C / 3. */
export const KEYMAP: Record<string, number> = {
  q: 0, w: 1, e: 2, a: 3, s: 4, d: 5, z: 6, x: 7, c: 8,
  '7': 0, '8': 1, '9': 2, '4': 3, '5': 4, '6': 5, '1': 6, '2': 7, '3': 8,
};
const KEY_LABELS = ['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'X', 'C'];

/* ────────────────────────────────────────────────────────────────────────── *
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

export type Kind = 'bug' | 'gold' | 'boss' | 'decoy' | 'coffee';
export type SmashPhase = 'ready' | 'playing' | 'paused' | 'over';
export type OverReason = 'time' | 'lives';

export type Critter = {
  id: number;
  hole: number;
  kind: Kind;
  age: number;
  ttl: number;
  hp: number;
  maxHp: number;
  hitAt: number | null;
  wobble: number;
  demo: boolean;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: 'drop' | 'spark' | 'smoke' };
type Floater = { x: number; y: number; text: string; age: number; color: string };
type Ring = { x: number; y: number; age: number; color: string };

export type World = {
  phase: SmashPhase;
  reason: OverReason;
  time: number;
  elapsed: number;
  timeLeft: number;
  lives: number;
  score: number;
  combo: number;
  bestCombo: number;
  hits: number;
  misses: number;
  escaped: number;
  squashed: number;
  critters: Critter[];
  nextId: number;
  spawnT: number;
  nextBossAt: number;
  coffeeCd: number;
  particles: Particle[];
  floaters: Floater[];
  rings: Ring[];
  shake: number;
  flash: number;
  hover: number;
  rng: () => number;
};

export type Events = {
  squash: (kind: Kind) => void;
  bossHit: () => void;
  decoy: () => void;
  coffee: () => void;
  miss: () => void;
  over: () => void;
  changed: (w: World) => void;
};

export type HitResult = 'bug' | 'gold' | 'boss-hit' | 'boss-dead' | 'coffee' | 'decoy' | 'miss' | 'none';

/* ────────────────────────────────────────────────────────────────────────── *
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function rankFor(score: number): { title: string; note: string } {
  if (score >= 90) return { title: 'Zero-Bug Legend', note: 'Production has never been safer. Incredible reflexes.' };
  if (score >= 60) return { title: 'Debug Master', note: 'Bugs fear you. That was a masterclass.' };
  if (score >= 35) return { title: 'QA Ninja', note: 'Fast and precise. Nothing slips past you.' };
  if (score >= 15) return { title: 'Bug Catcher', note: 'Nice work. Chain more squashes for the combo bonus.' };
  return { title: 'Intern', note: 'Everyone starts somewhere. The bugs are laughing. Try again!' };
}

export const multiplierFor = (combo: number) => Math.min(4, 1 + Math.floor(combo / 5));
export const intervalFor = (elapsed: number) => Math.max(0.34, 0.9 - elapsed * 0.0125);
export const ttlFor = (elapsed: number) => Math.max(0.62, 1.35 - elapsed * 0.0135);
export const maxLiveFor = (elapsed: number) => Math.min(4, 1 + Math.floor(elapsed / 11));

/** Which hole (0-8) is at this logical position, or -1. */
export function holeAt(x: number, y: number): number {
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (Math.abs(x - HOLE_X[c]) <= 58 && y >= HOLE_Y[r] - 104 && y <= HOLE_Y[r] + 32) return r * 3 + c;
    }
  }
  return -1;
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Engine (pure functions on a World — no React, no DOM)
 * ────────────────────────────────────────────────────────────────────────── */

export function createWorld(rng: () => number = Math.random): World {
  return {
    phase: 'ready',
    reason: 'time',
    time: 0,
    elapsed: 0,
    timeLeft: TOTAL_TIME,
    lives: LIVES,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    misses: 0,
    escaped: 0,
    squashed: 0,
    critters: [],
    nextId: 0,
    spawnT: 0.6,
    nextBossAt: 16,
    coffeeCd: 0,
    particles: [],
    floaters: [],
    rings: [],
    shake: 0,
    flash: 0,
    hover: -1,
    rng,
  };
}

export function resetWorld(w: World): void {
  w.phase = 'ready';
  w.reason = 'time';
  w.elapsed = 0;
  w.timeLeft = TOTAL_TIME;
  w.lives = LIVES;
  w.score = 0;
  w.combo = 0;
  w.bestCombo = 0;
  w.hits = 0;
  w.misses = 0;
  w.escaped = 0;
  w.squashed = 0;
  w.critters = [];
  w.spawnT = 0.6;
  w.nextBossAt = 16;
  w.coffeeCd = 0;
  w.particles = [];
  w.floaters = [];
  w.rings = [];
  w.shake = 0;
  w.flash = 0;
}

export function startGame(w: World, fx: Events): void {
  if (w.phase !== 'ready') return;
  resetWorld(w);
  w.phase = 'playing';
  w.spawnT = 0.5;
  fx.changed(w);
}

export function pauseWorld(w: World): boolean {
  if (w.phase !== 'playing') return false;
  w.phase = 'paused';
  return true;
}

export function resumeWorld(w: World): boolean {
  if (w.phase !== 'paused') return false;
  w.phase = 'playing';
  return true;
}

function freeHoles(w: World): number[] {
  const used = new Set(w.critters.map((c) => c.hole));
  return Array.from({ length: 9 }, (_, i) => i).filter((i) => !used.has(i));
}

function spawn(w: World, kind: Kind, ttl: number, demo = false): void {
  const free = freeHoles(w);
  if (free.length === 0) return;
  const hole = free[Math.floor(w.rng() * free.length)];
  const hp = kind === 'boss' ? 3 : 1;
  w.critters.push({ id: w.nextId, hole, kind, age: 0, ttl, hp, maxHp: hp, hitAt: null, wobble: 0, demo });
  w.nextId += 1;
}

function pickKind(w: World): Kind {
  const e = w.elapsed;
  const r = w.rng();
  const decoysAlive = w.critters.filter((c) => c.kind === 'decoy').length;
  if (e > 6 && r < 0.09) return 'gold';
  if (e > 3 && r < 0.24 && decoysAlive < 1) return 'decoy';
  if (e > 9 && w.coffeeCd <= 0 && r < 0.3) return 'coffee';
  return 'bug';
}

function burst(w: World, x: number, y: number, colors: string[], n: number, speed: number, kind: Particle['kind'], reduce: boolean): void {
  if (reduce) return;
  for (let i = 0; i < n; i += 1) {
    const a = w.rng() * TAU;
    const s = speed * (0.4 + w.rng() * 0.8);
    w.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - speed * 0.3,
      life: 0.45 + w.rng() * 0.35,
      max: 0.8,
      size: 2 + w.rng() * 3,
      color: colors[i % colors.length],
      kind,
    });
  }
}

function endGame(w: World, reason: OverReason, fx: Events): void {
  if (w.phase === 'over') return;
  w.phase = 'over';
  w.reason = reason;
  fx.over();
  fx.changed(w);
}

/**
 * Hit a hole (0-8). Returns what happened.
 * Only critters that are visibly up (not yet sinking) can be hit.
 */
export function hitHole(w: World, hole: number, fx: Events, reduce: boolean): HitResult {
  if (w.phase !== 'playing') return 'none';
  const hx = HOLE_X[hole % 3];
  const hy = HOLE_Y[Math.floor(hole / 3)];
  const c = w.critters.find((k) => k.hole === hole && k.hitAt === null && !k.demo && k.age >= 0.05 && k.age <= k.ttl - 0.06);
  w.rings.push({ x: hx, y: hy - 30, age: 0, color: c ? '#ffffff' : '#7ec8e3' });

  if (!c) {
    w.combo = 0;
    w.misses += 1;
    burst(w, hx, hy, ['#5d7680', '#8fa9a4'], 5, 60, 'smoke', reduce);
    fx.miss();
    fx.changed(w);
    return 'miss';
  }

  const mult = multiplierFor(w.combo);
  let result: HitResult = 'bug';

  if (c.kind === 'decoy') {
    c.hitAt = c.age;
    w.lives -= 1;
    w.combo = 0;
    w.misses += 1;
    w.score = Math.max(0, w.score - 3);
    if (!reduce) {
      w.shake = 0.5;
      w.flash = 0.4;
    }
    w.floaters.push({ x: hx, y: hy - 70, text: 'PROD DOWN!', age: 0, color: '#ff6b6b' });
    burst(w, hx, hy - 40, ['#ff6b6b', '#5d7680', '#f0c27a'], 14, 130, 'smoke', reduce);
    fx.decoy();
    result = 'decoy';
    if (w.lives <= 0) endGame(w, 'lives', fx);
  } else if (c.kind === 'coffee') {
    c.hitAt = c.age;
    w.timeLeft = Math.min(MAX_TIME, w.timeLeft + COFFEE_BONUS);
    w.combo += 1;
    w.hits += 1;
    w.floaters.push({ x: hx, y: hy - 70, text: `+${COFFEE_BONUS}s`, age: 0, color: '#7ec8e3' });
    burst(w, hx, hy - 40, ['#7ec8e3', '#ffffff', '#f0c27a'], 12, 120, 'spark', reduce);
    fx.coffee();
    result = 'coffee';
  } else if (c.kind === 'boss') {
    c.hp -= 1;
    w.combo += 1;
    w.hits += 1;
    c.wobble = 0.3;
    if (c.hp > 0) {
      w.score += mult;
      w.floaters.push({ x: hx, y: hy - 110, text: `+${mult}`, age: 0, color: '#c9b8ff' });
      burst(w, hx, hy - 60, ['#c9b8ff', '#8b5cf6'], 7, 110, 'drop', reduce);
      fx.bossHit();
      result = 'boss-hit';
    } else {
      c.hitAt = c.age;
      w.squashed += 1;
      w.score += 10 * mult;
      w.floaters.push({ x: hx, y: hy - 110, text: `+${10 * mult}`, age: 0, color: '#ffd166' });
      burst(w, hx, hy - 50, ['#c9b8ff', '#8b5cf6', '#ffd166'], 24, 180, 'drop', reduce);
      fx.squash('boss');
      result = 'boss-dead';
    }
  } else {
    const pts = (c.kind === 'gold' ? 5 : 1) * mult;
    c.hitAt = c.age;
    w.score += pts;
    w.combo += 1;
    w.hits += 1;
    w.squashed += 1;
    w.floaters.push({ x: hx, y: hy - 80, text: `+${pts}`, age: 0, color: c.kind === 'gold' ? '#ffd166' : '#ffffff' });
    burst(w, hx, hy - 30, c.kind === 'gold' ? ['#ffd166', '#fff3c4', '#f5b942'] : ['#9be15d', '#c8f08f', '#ff6b5a'], c.kind === 'gold' ? 16 : 11, 150, c.kind === 'gold' ? 'spark' : 'drop', reduce);
    fx.squash(c.kind);
    result = c.kind === 'gold' ? 'gold' : 'bug';
  }

  if (w.combo > w.bestCombo) w.bestCombo = w.combo;
  if (multiplierFor(w.combo) > mult) w.floaters.push({ x: 200, y: 150, text: `COMBO x${multiplierFor(w.combo)}!`, age: 0, color: '#ffd166' });
  fx.changed(w);
  return result;
}

/** Tap at logical coordinates. Returns the result, or 'none' if no hole was tapped. */
export function tapAt(w: World, x: number, y: number, fx: Events, reduce: boolean): HitResult {
  const hole = holeAt(x, y);
  if (hole < 0) return 'none';
  return hitHole(w, hole, fx, reduce);
}

export function stepWorld(w: World, dt: number, fx: Events, reduce: boolean): void {
  if (w.phase === 'paused') return;
  w.time += dt;

  if (w.phase === 'ready') {
    // attract mode: harmless demo bugs peek out
    w.spawnT -= dt;
    if (w.spawnT <= 0 && w.critters.length < 3) {
      spawn(w, 'bug', 1.5, true);
      w.spawnT = 0.9 + w.rng() * 0.6;
    }
  } else if (w.phase === 'playing') {
    w.elapsed += dt;
    w.timeLeft -= dt;
    w.coffeeCd -= dt;

    w.spawnT -= dt;
    const live = w.critters.filter((c) => c.hitAt === null).length;
    if (w.spawnT <= 0) {
      if (live < maxLiveFor(w.elapsed)) {
        const kind = pickKind(w);
        if (kind === 'coffee') w.coffeeCd = 12;
        spawn(w, kind, kind === 'coffee' ? 1.6 : ttlFor(w.elapsed));
      }
      w.spawnT = intervalFor(w.elapsed) * (0.75 + w.rng() * 0.5);
    }
    if (w.elapsed >= w.nextBossAt && !w.critters.some((c) => c.kind === 'boss')) {
      spawn(w, 'boss', 3.4);
      w.nextBossAt = w.elapsed + 17 + w.rng() * 5;
    }
  }

  // Age critters; handle escapes
  if (w.phase === 'playing' || w.phase === 'ready') {
    for (const c of w.critters) {
      c.age += dt;
      c.wobble = Math.max(0, c.wobble - dt);
    }
    const remaining: Critter[] = [];
    for (const c of w.critters) {
      const done = c.hitAt !== null ? c.age - c.hitAt > 0.45 : c.age >= c.ttl;
      if (!done) {
        remaining.push(c);
        continue;
      }
      if (c.hitAt === null && !c.demo) {
        if (c.kind === 'bug' || c.kind === 'gold') w.escaped += 1;
        else if (c.kind === 'boss') {
          w.lives -= 1;
          w.combo = 0;
          if (!reduce) {
            w.shake = 0.5;
            w.flash = 0.35;
          }
          w.floaters.push({ x: HOLE_X[c.hole % 3], y: HOLE_Y[Math.floor(c.hole / 3)] - 110, text: 'CRASH!', age: 0, color: '#ff6b6b' });
          fx.decoy();
          fx.changed(w);
        }
      }
    }
    w.critters = remaining;
    if (w.phase === 'playing') {
      if (w.lives <= 0) endGame(w, 'lives', fx);
      else if (w.timeLeft <= 0) {
        w.timeLeft = 0;
        endGame(w, 'time', fx);
      }
    }
  }

  for (const p of w.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.kind === 'smoke' ? -30 : 520) * dt;
  }
  w.particles = w.particles.filter((p) => p.life > 0);
  for (const f of w.floaters) {
    f.age += dt;
    f.y -= 36 * dt;
  }
  w.floaters = w.floaters.filter((f) => f.age < 0.95);
  for (const r of w.rings) r.age += dt;
  w.rings = w.rings.filter((r) => r.age < 0.35);
  w.shake = Math.max(0, w.shake - dt * 1.8);
  w.flash = Math.max(0, w.flash - dt * 1.5);
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Rendering (Canvas 2D, logical coordinates)
 * ────────────────────────────────────────────────────────────────────────── */

type Ctx = CanvasRenderingContext2D;
const FONT = "'Manrope', ui-sans-serif, system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const easeOutBack = (t: number) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;

/** 0 (hidden) .. ~1 (fully up) */
function riseOf(c: Critter): number {
  const pop = easeOutBack(clamp(c.age / 0.14, 0, 1));
  const sink =
    c.hitAt !== null ? clamp(1 - (c.age - c.hitAt - 0.2) / 0.2, 0, 1) : clamp((c.ttl - c.age) / 0.16, 0, 1);
  return pop * sink;
}

function drawBackground(ctx: Ctx, w: World): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1519');
  g.addColorStop(1, '#122830');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // faint code lines
  ctx.fillStyle = 'rgba(126,220,180,0.05)';
  for (let i = 0; i < 22; i += 1) {
    const y = 138 + i * 19;
    const indent = ((i * 37) % 4) * 14;
    const width = 40 + ((i * 53) % 9) * 22;
    ctx.fillRect(14 + indent, y, width, 5);
    ctx.fillRect(W - 14 - ((i * 29) % 5) * 18 - 60, y + 6, 60, 5);
  }

  const glow = ctx.createRadialGradient(W / 2, 330, 20, W / 2, 330, 260);
  glow.addColorStop(0, 'rgba(126,220,180,0.10)');
  glow.addColorStop(1, 'rgba(126,220,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 100, W, 420);

  // playfield panel
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  rr(ctx, 10, 134, W - 20, 412, 18);
  ctx.stroke();
  void w;
}

function drawHoleBack(ctx: Ctx, x: number, y: number, hot: boolean): void {
  // outer pipe rim
  ctx.fillStyle = '#16303a';
  ctx.beginPath();
  ctx.ellipse(x, y, HOLE_RX + 6, HOLE_RY + 5, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hot ? '#7edcb4' : 'rgba(47,138,108,0.85)';
  ctx.lineWidth = hot ? 3 : 2.5;
  ctx.stroke();
  // dark interior
  const g = ctx.createRadialGradient(x, y, 4, x, y, HOLE_RX);
  g.addColorStop(0, '#010506');
  g.addColorStop(1, '#0a161b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, HOLE_RX, HOLE_RY, 0, 0, TAU);
  ctx.fill();
}

function drawHoleFront(ctx: Ctx, x: number, y: number, hot: boolean): void {
  ctx.strokeStyle = hot ? '#7edcb4' : '#2f8a6c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, HOLE_RX + 4, HOLE_RY + 4, 0, 0.05, Math.PI - 0.05);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, HOLE_RX + 4, HOLE_RY + 4, 0, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function drawBugSprite(ctx: Ctx, kind: 'bug' | 'gold' | 'boss', t: number, squash: number, hurt: number, hp: number, maxHp: number): void {
  const boss = kind === 'boss';
  const gold = kind === 'gold';
  const body1 = boss ? '#a78bfa' : gold ? '#ffe08a' : '#ff7a66';
  const body2 = boss ? '#4c1d95' : gold ? '#dc9a14' : '#c22f2a';
  const head = boss ? '#2a1250' : gold ? '#7a5410' : '#3a1f1a';
  ctx.save();
  if (boss) ctx.scale(1.45, 1.45);
  ctx.scale(1 + squash * 0.35, 1 - squash * 0.78);

  // legs
  ctx.strokeStyle = head;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const wig = Math.sin(t * 14) * 3;
  [-16, -30, -44].forEach((ly, i) => {
    const s = i % 2 === 0 ? wig : -wig;
    ctx.beginPath();
    ctx.moveTo(-20, ly);
    ctx.lineTo(-33, ly + 8 + s);
    ctx.moveTo(20, ly);
    ctx.lineTo(33, ly + 8 - s);
    ctx.stroke();
  });
  // antennae / horns
  ctx.lineWidth = 2.5;
  if (boss) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-12, -74);
    ctx.lineTo(-22, -96);
    ctx.lineTo(-4, -80);
    ctx.closePath();
    ctx.moveTo(12, -74);
    ctx.lineTo(22, -96);
    ctx.lineTo(4, -80);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-6, -76);
    ctx.quadraticCurveTo(-14, -92 + Math.sin(t * 8) * 2, -20, -88);
    ctx.moveTo(6, -76);
    ctx.quadraticCurveTo(14, -92 - Math.sin(t * 8) * 2, 20, -88);
    ctx.stroke();
  }
  // shell
  const g = ctx.createLinearGradient(0, -62, 0, -2);
  g.addColorStop(0, body1);
  g.addColorStop(1, body2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -32, 24, 30, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.lineTo(0, -3);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  [[-11, -40, 4.5], [11, -32, 4], [-9, -20, 3.5], [10, -16, 3]].forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, TAU);
    ctx.fill();
  });
  // shine
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(-9, -50, 5, 9, -0.4, 0, TAU);
  ctx.fill();
  // head
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(0, -64, 14, 0, TAU);
  ctx.fill();
  // eyes
  if (squash > 0.5) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    [-6, 6].forEach((ex) => {
      ctx.beginPath();
      ctx.moveTo(ex - 3, -70);
      ctx.lineTo(ex + 3, -64);
      ctx.moveTo(ex + 3, -70);
      ctx.lineTo(ex - 3, -64);
      ctx.stroke();
    });
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-6, -67, 5, 0, TAU);
    ctx.arc(6, -67, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = boss ? '#ff3b3b' : '#111';
    ctx.beginPath();
    ctx.arc(-6 + Math.sin(t * 3) * 1.2, -65.5, 2.4, 0, TAU);
    ctx.arc(6 + Math.sin(t * 3) * 1.2, -65.5, 2.4, 0, TAU);
    ctx.fill();
    if (boss) {
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -75);
      ctx.lineTo(-2, -71);
      ctx.moveTo(12, -75);
      ctx.lineTo(2, -71);
      ctx.stroke();
    }
  }
  if (hurt > 0) {
    ctx.fillStyle = `rgba(255,255,255,${clamp(hurt * 2.4, 0, 0.75)})`;
    ctx.beginPath();
    ctx.ellipse(0, -32, 24, 30, 0, 0, TAU);
    ctx.fill();
  }
  if (gold) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 3; i += 1) {
      const a = t * 3 + i * 2.1;
      const r = 32 + Math.sin(t * 5 + i) * 4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, -34 + Math.sin(a) * r * 0.9, 2.2, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();

  // boss HP pips (drawn unscaled above the head)
  if (boss && squash < 0.1) {
    for (let i = 0; i < maxHp; i += 1) {
      ctx.fillStyle = i < hp ? '#ff6b6b' : 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.arc((i - (maxHp - 1) / 2) * 16, -148, 5, 0, TAU);
      ctx.fill();
    }
  }
}

function drawDecoy(ctx: Ctx, t: number, squash: number): void {
  ctx.save();
  ctx.scale(1 + squash * 0.1, 1 - squash * 0.2);
  const g = ctx.createLinearGradient(-32, 0, 32, 0);
  g.addColorStop(0, '#22303a');
  g.addColorStop(0.5, '#33454f');
  g.addColorStop(1, '#1b262d');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5b7380';
  ctx.lineWidth = 2;
  ctx.beginPath();
  rr(ctx, -32, -82, 64, 80, 7);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    const y = -74 + i * 24;
    ctx.fillStyle = '#0d171c';
    ctx.beginPath();
    rr(ctx, -26, y, 52, 18, 3);
    ctx.fill();
    const on = Math.sin(t * 6 + i * 2) > -0.3;
    ctx.fillStyle = squash > 0.3 ? '#ff4d4d' : on ? '#7edcb4' : '#2a6b55';
    ctx.beginPath();
    ctx.arc(-17, y + 9, 3.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, y + 6);
    ctx.lineTo(20, y + 6);
    ctx.moveTo(-6, y + 12);
    ctx.lineTo(20, y + 12);
    ctx.stroke();
  }
  // PROD badge
  ctx.fillStyle = '#e5484d';
  ctx.beginPath();
  rr(ctx, -20, -98, 40, 16, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText('PROD', 0, -86);
  ctx.restore();
}

function drawCoffee(ctx: Ctx, t: number): void {
  // steam
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  [-10, 4].forEach((sx, i) => {
    ctx.beginPath();
    ctx.moveTo(sx, -56);
    ctx.bezierCurveTo(sx - 8, -66 + Math.sin(t * 4 + i) * 2, sx + 8, -74, sx, -84 + Math.sin(t * 3 + i) * 3);
    ctx.stroke();
  });
  // saucer
  ctx.fillStyle = '#d9d2c5';
  ctx.beginPath();
  ctx.ellipse(0, -6, 34, 8, 0, 0, TAU);
  ctx.fill();
  // handle
  ctx.strokeStyle = '#efe9dd';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(28, -34, 12, -1.3, 1.3);
  ctx.stroke();
  // cup
  const g = ctx.createLinearGradient(-24, 0, 24, 0);
  g.addColorStop(0, '#f6f1e7');
  g.addColorStop(1, '#cfc7b8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-26, -52);
  ctx.lineTo(26, -52);
  ctx.quadraticCurveTo(24, -8, 0, -8);
  ctx.quadraticCurveTo(-24, -8, -26, -52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5b3a29';
  ctx.beginPath();
  ctx.ellipse(0, -52, 26, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2f8a6c';
  ctx.fillRect(-22, -32, 44, 6);
}

function drawCritter(ctx: Ctx, w: World, c: Critter): void {
  const r = riseOf(c);
  if (r <= 0.01) return;
  const hx = HOLE_X[c.hole % 3];
  const hy = HOLE_Y[Math.floor(c.hole / 3)];
  const drop = (1 - r) * (c.kind === 'boss' ? 150 : 100);
  const squash = c.hitAt !== null ? clamp((c.age - c.hitAt) / 0.08, 0, 1) : 0;
  const wob = c.wobble > 0 ? Math.sin(c.age * 70) * c.wobble * 14 : 0;
  const hurt = c.wobble;

  ctx.save();
  ctx.beginPath();
  ctx.rect(hx - 90, hy - 190, 180, 190 + 4);
  ctx.clip();
  ctx.translate(hx + wob, hy + drop);
  const t = w.time + c.id;
  if (c.kind === 'decoy') drawDecoy(ctx, t, squash);
  else if (c.kind === 'coffee') drawCoffee(ctx, t);
  else drawBugSprite(ctx, c.kind, t, squash, hurt, c.hp, c.maxHp);
  ctx.restore();
}

function drawHeart(ctx: Ctx, x: number, y: number, s: number, filled: boolean): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y - s * 0.1, x - s * 0.6, y - s * 0.1, x - s * 0.6, y + s * 0.25);
  ctx.bezierCurveTo(x - s * 0.6, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.6, y + s * 0.6, x + s * 0.6, y + s * 0.25);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 0.1, x, y - s * 0.1, x, y + s * 0.3);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#ff5c6c';
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawHud(ctx: Ctx, w: World): void {
  ctx.textBaseline = 'alphabetic';
  // labels
  ctx.font = `600 10px ${MONO}`;
  ctx.fillStyle = 'rgba(190,215,210,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 22, 28);
  ctx.textAlign = 'right';
  ctx.fillText('TIME', W - 22, 28);
  ctx.textAlign = 'center';
  ctx.fillText('LIVES', W / 2, 28);

  // values
  ctx.font = `800 40px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(String(w.score), 22, 70);
  const low = w.timeLeft <= 10 && w.phase !== 'ready';
  ctx.textAlign = 'right';
  ctx.fillStyle = low ? (Math.sin(w.time * 10) > 0 ? '#ff6b6b' : '#ffb4b4') : '#ffffff';
  ctx.fillText(String(Math.max(0, Math.ceil(w.timeLeft))), W - 22, 70);

  // lives
  for (let i = 0; i < LIVES; i += 1) drawHeart(ctx, W / 2 + (i - 1) * 28, 36, 17, i < w.lives);

  // time bar
  const frac = clamp(w.timeLeft / TOTAL_TIME, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  rr(ctx, 22, 86, W - 44, 8, 4);
  ctx.fill();
  if (frac > 0.01) {
    ctx.fillStyle = frac > 0.4 ? '#7edcb4' : frac > 0.2 ? '#f0c27a' : '#ff6b6b';
    ctx.beginPath();
    rr(ctx, 22, 86, (W - 44) * frac, 8, 4);
    ctx.fill();
  }

  // combo chip
  if (w.phase !== 'ready' && w.combo >= 2) {
    const m = multiplierFor(w.combo);
    const text = `COMBO ${w.combo}  x${m}`;
    ctx.font = `700 12px ${MONO}`;
    const tw = ctx.measureText(text).width + 28;
    ctx.fillStyle = m > 1 ? 'rgba(240,194,122,0.22)' : 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = m > 1 ? 'rgba(240,194,122,0.7)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    rr(ctx, W / 2 - tw / 2, 106, tw, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = m > 1 ? '#ffd166' : '#d7e9e4';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, 122);
  }
}

/** Draws one full frame. `ctx` must already be scaled to the W x H logical space. */
export function drawWorld(ctx: Ctx, w: World): void {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  if (w.shake > 0) {
    const m = w.shake * 9;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  drawBackground(ctx, w);

  for (let i = 0; i < 9; i += 1) {
    const hx = HOLE_X[i % 3];
    const hy = HOLE_Y[Math.floor(i / 3)];
    const hot = w.hover === i && w.phase === 'playing';
    drawHoleBack(ctx, hx, hy, hot);
    for (const c of w.critters) if (c.hole === i) drawCritter(ctx, w, c);
    drawHoleFront(ctx, hx, hy, hot);
    // keyboard hint
    ctx.font = `600 11px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = hot ? 'rgba(126,220,180,0.95)' : 'rgba(190,215,210,0.32)';
    ctx.fillText(KEY_LABELS[i], hx, hy + 36);
  }

  for (const r of w.rings) {
    const t = r.age / 0.35;
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = 1 - t;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 12 + t * 34, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const p of w.particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.kind === 'smoke' ? 1.8 - p.life : 1), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawHud(ctx, w);

  for (const f of w.floaters) {
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = clamp(1 - f.age / 0.95, 0, 1);
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,10,14,0.7)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  ctx.font = `600 10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(190,215,210,0.45)';
  ctx.fillText('Squash bugs  ·  Avoid PROD  ·  Grab coffee', W / 2, 546);

  if (w.flash > 0) {
    ctx.fillStyle = `rgba(255,70,70,${w.flash * 0.45})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Tiny synthesized sound effects (off by default, no audio files)
 * ────────────────────────────────────────────────────────────────────────── */

type Sfx = 'squash' | 'gold' | 'bossHit' | 'bossDead' | 'decoy' | 'coffee' | 'miss' | 'over';

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
      switch (kind) {
        case 'squash':
          tone('triangle', 460, 150, 0, 0.09, 0.08);
          break;
        case 'gold':
          tone('triangle', 880, 880, 0, 0.08, 0.06);
          tone('triangle', 1175, 1175, 0.07, 0.08, 0.06);
          tone('triangle', 1568, 1568, 0.14, 0.14, 0.06);
          break;
        case 'bossHit':
          tone('sine', 150, 70, 0, 0.14, 0.1);
          break;
        case 'bossDead':
          tone('sine', 150, 60, 0, 0.16, 0.1);
          tone('triangle', 660, 990, 0.1, 0.12, 0.06);
          tone('triangle', 990, 1320, 0.2, 0.2, 0.06);
          break;
        case 'decoy':
          tone('sawtooth', 140, 45, 0, 0.35, 0.08);
          break;
        case 'coffee':
          tone('sine', 520, 900, 0, 0.16, 0.07);
          break;
        case 'miss':
          tone('sine', 200, 140, 0, 0.06, 0.03);
          break;
        default:
          tone('triangle', 520, 260, 0, 0.35, 0.07);
      }
    } catch {
      /* audio unavailable — the game still works */
    }
  };
}

/* ────────────────────────────────────────────────────────────────────────── *
 * React component
 * ────────────────────────────────────────────────────────────────────────── */

type UiPhase = 'ready' | 'playing' | 'paused' | 'over';
type Result = { score: number; squashed: number; accuracy: number; bestCombo: number; reason: OverReason; newBest: boolean };

export function BugSmashGame() {
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
  const sfx = useRef<((k: Sfx) => void) | null>(null);
  const soundRef = useRef(false);
  const bestRef = useRef(0);

  const [ui, setUi] = useState<UiPhase>('ready');
  const [score, setScore] = useState(0);
  const [squashed, setSquashed] = useState(0);
  const [best, setBest] = useState(readBest);
  const [sound, setSound] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [announce, setAnnounce] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  bestRef.current = best;
  soundRef.current = sound;

  const play = useCallback((k: Sfx) => {
    if (!soundRef.current) return;
    if (!sfx.current) sfx.current = createSfx();
    sfx.current(k);
  }, []);

  const fx = useMemo<Events>(
    () => ({
      squash: (kind) => play(kind === 'gold' ? 'gold' : kind === 'boss' ? 'bossDead' : 'squash'),
      bossHit: () => play('bossHit'),
      decoy: () => play('decoy'),
      coffee: () => play('coffee'),
      miss: () => play('miss'),
      changed: (w) => {
        setScore(w.score);
        setSquashed(w.squashed);
      },
      over: () => {
        const w = world.current;
        const total = w.hits + w.misses;
        const newBest = w.score > bestRef.current;
        if (newBest) {
          setBest(w.score);
          try {
            window.localStorage.setItem(STORAGE_KEY, String(w.score));
          } catch {
            /* storage unavailable */
          }
        }
        play('over');
        setResult({
          score: w.score,
          squashed: w.squashed,
          accuracy: total === 0 ? 0 : Math.round((w.hits / total) * 100),
          bestCombo: w.bestCombo,
          reason: w.reason,
          newBest,
        });
        setAnnounce(
          `${w.reason === 'lives' ? 'Production went down!' : "Time's up."} You scored ${w.score}.${newBest ? ' New personal best!' : ''}`,
        );
        setUi('over');
      },
    }),
    [play],
  );

  const begin = useCallback(() => {
    const w = world.current;
    if (countdownTimer.current !== null) {
      window.clearTimeout(countdownTimer.current);
      countdownTimer.current = null;
      setCountdown(null);
    }
    if (w.phase === 'ready') {
      startGame(w, fx);
      setUi('playing');
    } else if (w.phase === 'paused') {
      resumeWorld(w);
      setUi('playing');
    }
  }, [fx]);

  /** Start button: a 3-2-1 beat before the board goes live. Resuming from
   * pause (via the Resume button) skips the countdown entirely. */
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
          if (world.current.phase === 'ready') begin();
          return;
        }
        setCountdown(n);
        tick();
      }, 1000);
    };
    tick();
  }, [begin]);

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
    setSquashed(0);
    setUi('ready');
    setAnnounce('');
    wrapRef.current?.focus({ preventScroll: true });
  }, []);

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
      stepWorld(world.current, dt, fx, reduceRef.current);
      draw();
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(raf);
  }, [inView, fx, draw, pause]);

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

  const toLogical = (clientX: number, clientY: number): [number, number] => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return [-1, -1];
    return [((clientX - rect.left) / rect.width) * W, ((clientY - rect.top) / rect.height) * H];
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return; // let overlay buttons behave normally
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    const w = world.current;
    if (key === 'p' || key === 'escape') {
      event.preventDefault();
      pause();
    } else if (key in KEYMAP && w.phase === 'playing') {
      event.preventDefault();
      hitHole(w, KEYMAP[key], fx, reduceRef.current);
    }
  };

  const rank = result ? rankFor(result.score) : null;

  return (
    <section id="smash" aria-labelledby="smash-title" className="section-shell py-16 sm:py-20 md:py-32">
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
              id="smash-title"
              className="max-w-2xl text-3xl font-medium tracking-[-.035em] text-foreground sm:text-4xl md:text-5xl"
            >
              Bug Smash. Protect production.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Bugs are popping out of the terminal. Squash as many as you can in 45 seconds, but do not touch the PROD server.
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          {/* Info column */}
          <div className="order-2 lg:order-1">
            <h3 className="text-2xl leading-tight tracking-[-.04em] text-foreground md:text-3xl">
              Fast fingers. Careful eyes.
            </h3>

            <ul className="mt-6 grid max-w-md gap-3 text-sm">
              {[
                ['#ff7a66', 'Bug', '+1. Squash it before it escapes.'],
                ['#ffd166', 'Golden bug', '+5. Rare and quick.'],
                ['#a78bfa', 'Memory Leak boss', '+10. Takes 3 hits, and crashes prod if it escapes.'],
                ['#7ec8e3', 'Coffee', `+${COFFEE_BONUS} seconds on the clock.`],
                ['#ff6b6b', 'PROD server', 'Do not touch! Costs a life.'],
              ].map(([color, name, text]) => (
                <li key={name} className="flex items-start gap-3 text-muted-foreground">
                  <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}88` }} />
                  <span>
                    <strong className="font-medium text-foreground">{name}</strong> · {text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Chain squashes without a miss to build a combo: every 5 in a row raises your multiplier, up to x4.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2.5">
              {[
                [MousePointerClick, 'Click or tap the holes'],
                [Keyboard, 'Keys Q W E · A S D · Z X C'],
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
                ['Squashed', String(squashed), 'text-primary'],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3.5">
                  <dt className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{label}</dt>
                  <dd className={`mt-1.5 font-mono text-2xl tabular-nums ${tone}`} data-testid={`text-smash-${(label as string).toLowerCase()}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7">
              <button
                type="button"
                role="switch"
                aria-checked={sound}
                onClick={() => setSound((v) => !v)}
                className="flex min-h-11 items-center gap-3 text-left text-sm text-muted-foreground"
                data-testid="switch-smash-sound"
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
              aria-label="Bug Smash game. Click the holes or press Q W E, A S D, Z X C to squash bugs. Avoid the PROD server. Press P to pause."
              onKeyDown={onKeyDown}
              className="relative aspect-[5/7] w-full select-none overflow-hidden rounded-2xl border border-white/10 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ aspectRatio: `${W} / ${H}` }}
              data-testid="game-smash-wrap"
            >
              <canvas
                ref={canvasRef}
                className="block size-full h-auto w-full cursor-crosshair"
                style={{ touchAction: ui === 'playing' ? 'none' : 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  wrapRef.current?.focus({ preventScroll: true });
                  const w = world.current;
                  if (w.phase !== 'playing') return;
                  const [x, y] = toLogical(e.clientX, e.clientY);
                  tapAt(w, x, y, fx, reduceRef.current);
                }}
                onPointerMove={(e) => {
                  const [x, y] = toLogical(e.clientX, e.clientY);
                  world.current.hover = holeAt(x, y);
                }}
                onPointerLeave={() => {
                  world.current.hover = -1;
                }}
                data-testid="canvas-smash"
              />

              <AnimatePresence>
                {ui === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-3 text-center"
                  >
                    {countdown === null ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            wrapRef.current?.focus({ preventScroll: true });
                            beginCountdown();
                          }}
                          className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
                          data-testid="button-smash-start"
                        >
                          <Play size={16} className="fill-current" /> Start smashing
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
                            data-testid="text-smash-countdown"
                          >
                            {countdown}
                          </motion.span>
                        </AnimatePresence>
                        <span className="rounded-full bg-black/60 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[.16em] text-white backdrop-blur-sm">
                          Get ready…
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {ui === 'paused' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/60 px-6 py-5 text-center text-white">
                    <Pause size={22} />
                    <p className="text-lg font-semibold">Paused</p>
                    <button
                      type="button"
                      onClick={() => {
                        wrapRef.current?.focus({ preventScroll: true });
                        begin();
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                      data-testid="button-smash-resume"
                    >
                      <Play size={15} className="fill-current" /> Resume
                    </button>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {ui === 'over' && result && rank && (
                  <motion.div
                    key="over"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-5 backdrop-blur-[3px]"
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
                      <p className="eyebrow mt-4">
                        {result.newBest ? 'New personal best!' : result.reason === 'lives' ? 'Production went down!' : "Time's up!"}
                      </p>
                      <h4 className="mt-2 text-2xl tracking-[-.03em] text-foreground" data-testid="text-smash-rank">
                        {rank.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{rank.note}</p>

                      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                        {[
                          ['Score', result.score],
                          ['Best', Math.max(best, result.score)],
                          ['Accuracy', `${result.accuracy}%`],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-border bg-muted/50 py-2">
                            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">{label}</p>
                            <p className="mt-0.5 font-mono text-lg tabular-nums text-foreground">{value}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                        {result.squashed} squashed · best combo {result.bestCombo}
                      </p>

                      <div className="mt-5 flex flex-col gap-2.5">
                        <button
                          ref={againRef}
                          type="button"
                          onClick={playAgain}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                          data-testid="button-smash-again"
                        >
                          <RotateCcw size={16} /> Smash again
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

export default BugSmashGame;
