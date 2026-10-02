"use client";

import dynamic from "next/dynamic";

/**
 * The three arcade mini-games are canvas/timer driven and randomised, so they
 * render on the client only (avoids any server/client hydration mismatch).
 */
const Placeholder = () => <div className="section-shell min-h-[640px]" aria-hidden="true" />;

const SpotTheBugGame = dynamic(
  () => import("@/components/games/spot-the-bug-game").then((m) => m.SpotTheBugGame),
  { ssr: false, loading: Placeholder },
);
const SkyFlapGame = dynamic(
  () => import("@/components/games/sky-flap-game").then((m) => m.SkyFlapGame),
  { ssr: false, loading: Placeholder },
);
const BugSmashGame = dynamic(
  () => import("@/components/games/bug-smash-game").then((m) => m.BugSmashGame),
  { ssr: false, loading: Placeholder },
);

export function Games() {
  return (
    <div id="games" className="relative overflow-hidden border-t border-white/5 bg-background">
      <SpotTheBugGame />
      <SkyFlapGame />
      <BugSmashGame />
    </div>
  );
}
