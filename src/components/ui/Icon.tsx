import {
  BookOpen,
  CarFront,
  Code2,
  Database,
  FlaskConical,
  Layers3,
  MessageCircle,
  Monitor,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  server: Server,
  database: Database,
  shield: ShieldCheck,
  code: Code2,
  terminal: Terminal,
  monitor: Monitor,
  flask: FlaskConical,
  layers: Layers3,
  sparkles: Sparkles,
  users: Users,
  book: BookOpen,
  message: MessageCircle,
  car: CarFront,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = ICONS[name];
  return <Cmp aria-hidden="true" {...props} />;
}
