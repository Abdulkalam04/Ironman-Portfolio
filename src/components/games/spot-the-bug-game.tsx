"use client";

/**
 * Spot the Bug — a small code-review game for the portfolio.
 *
 * Self-contained: uses only react, framer-motion, lucide-react and the
 * existing Tailwind theme tokens. No new dependencies, no CSS changes.
 *
 * Usage (src/App.tsx):
 *   import { SpotTheBugGame } from '@/components/spot-the-bug-game';
 *   ...
 *   <Education /><SpotTheBugGame /><ResumeCta />
 */
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  Bug,
  Check,
  FileCode2,
  Flame,
  Heart,
  Infinity as InfinityIcon,
  Lightbulb,
  Minus,
  Play,
  RotateCcw,
  Search,
  Target,
  Timer,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

/* ────────────────────────────────────────────────────────────────────────── *
 * Game settings
 * ────────────────────────────────────────────────────────────────────────── */

const ROUND_SECONDS = 25;
const TOTAL_LIVES = 3;
const STORAGE_KEY = 'ak-spot-the-bug-best';
/** Rounds per game: [easy, medium, hard] — played in that order. */
const MIX: readonly [number, number, number] = [3, 3, 2];
const ROUNDS_PER_GAME = MIX[0] + MIX[1] + MIX[2];

/* ────────────────────────────────────────────────────────────────────────── *
 * Challenges — each has exactly ONE buggy line.
 * `bug` is the zero-based index into `code`.
 * ────────────────────────────────────────────────────────────────────────── */

type Lang = 'java' | 'sql' | 'js' | 'python';
type Level = 1 | 2 | 3;

export type Challenge = {
  id: string;
  lang: Lang;
  file: string;
  level: Level;
  goal: string;
  code: string[];
  bug: number;
  fix: string;
  why: string;
};

export const CHALLENGES: Challenge[] = [
  /* ── Easy ─────────────────────────────────────────────────────────────── */
  {
    id: 'java-average',
    lang: 'java',
    file: 'Stats.java',
    level: 1,
    goal: 'Return the average of all the scores in the array.',
    code: [
      'public static double average(int[] scores) {',
      '    int sum = 0;',
      '    for (int i = 0; i <= scores.length; i++) {',
      '        sum += scores[i];',
      '    }',
      '    return (double) sum / scores.length;',
      '}',
    ],
    bug: 2,
    fix: '    for (int i = 0; i < scores.length; i++) {',
    why: 'Arrays are zero-indexed, so the last valid index is length - 1. Using <= makes the loop read scores[length] and crash with ArrayIndexOutOfBoundsException.',
  },
  {
    id: 'java-string-equals',
    lang: 'java',
    file: 'AuthService.java',
    level: 1,
    goal: 'Return true only when the user has the ADMIN role.',
    code: [
      'public boolean isAdmin(User user) {',
      '    if (user == null) {',
      '        return false;',
      '    }',
      '    return user.getRole() == "ADMIN";',
      '}',
    ],
    bug: 4,
    fix: '    return "ADMIN".equals(user.getRole());',
    why: '== compares object references, not text. Two equal strings can be different objects, so the check fails unpredictably. Use equals(), with the literal first to stay null-safe.',
  },
  {
    id: 'sql-null',
    lang: 'sql',
    file: 'customers.sql',
    level: 1,
    goal: 'Find customers who have no phone number on file.',
    code: [
      'SELECT id, name',
      'FROM customers',
      'WHERE phone = NULL',
      'ORDER BY name;',
    ],
    bug: 2,
    fix: 'WHERE phone IS NULL',
    why: 'NULL means "unknown", so phone = NULL evaluates to UNKNOWN for every row and returns nothing. Test for missing values with IS NULL (or IS NOT NULL).',
  },
  {
    id: 'js-await',
    lang: 'js',
    file: 'loadUser.js',
    level: 1,
    goal: 'Return the name of the user fetched from the API.',
    code: [
      'async function loadUser(id) {',
      '  const res = await fetch(`/api/users/${id}`);',
      '  const user = res.json();',
      '  return user.name;',
      '}',
    ],
    bug: 2,
    fix: '  const user = await res.json();',
    why: 'res.json() returns a Promise. Without await, user is still pending, so user.name is undefined.',
  },
  {
    id: 'java-int-division',
    lang: 'java',
    file: 'Report.java',
    level: 1,
    goal: 'Return the pass percentage. Example: 3 passed out of 4 gives 75.0.',
    code: [
      'public static double passRate(int passed, int total) {',
      '    if (total == 0) {',
      '        return 0;',
      '    }',
      '    return (passed / total) * 100;',
      '}',
    ],
    bug: 4,
    fix: '    return (passed * 100.0) / total;',
    why: 'passed / total is integer division: 3 / 4 becomes 0 before it is multiplied by 100. Promote to double first.',
  },

  /* ── Medium ───────────────────────────────────────────────────────────── */
  {
    id: 'sql-left-join',
    lang: 'sql',
    file: 'orders_report.sql',
    level: 2,
    goal: 'List every customer with their number of orders, including customers who have zero orders.',
    code: [
      'SELECT c.name, COUNT(o.id) AS total_orders',
      'FROM customers c',
      'INNER JOIN orders o ON o.customer_id = c.id',
      'GROUP BY c.id, c.name;',
    ],
    bug: 2,
    fix: 'LEFT JOIN orders o ON o.customer_id = c.id',
    why: 'INNER JOIN keeps only rows that match on both sides, so customers without orders disappear. LEFT JOIN keeps every customer, and COUNT(o.id) counts the missing orders as 0.',
  },
  {
    id: 'sql-having',
    lang: 'sql',
    file: 'dept_salary.sql',
    level: 2,
    goal: 'Show the departments whose average salary is above 50,000.',
    code: [
      'SELECT department, AVG(salary) AS avg_salary',
      'FROM employees',
      'WHERE AVG(salary) > 50000',
      'GROUP BY department;',
    ],
    bug: 2,
    fix: 'GROUP BY department\nHAVING AVG(salary) > 50000;',
    why: 'WHERE filters rows before grouping, so aggregates like AVG() are not allowed in it. Filter groups after GROUP BY with HAVING.',
  },
  {
    id: 'java-concurrent-modification',
    lang: 'java',
    file: 'OrderCleanup.java',
    level: 2,
    goal: 'Remove every expired order from the list.',
    code: [
      'List<Order> orders = repo.findAll();',
      'for (Order o : orders) {',
      '    if (o.isExpired()) {',
      '        orders.remove(o);',
      '    }',
      '}',
    ],
    bug: 3,
    fix: 'orders.removeIf(Order::isExpired);  // replaces the whole loop',
    why: 'Removing from a list while a for-each loop iterates it throws ConcurrentModificationException. Use removeIf() or an explicit Iterator.',
  },
  {
    id: 'python-mutable-default',
    lang: 'python',
    file: 'tags.py',
    level: 2,
    goal: 'Each call without a list should start with a fresh, empty list.',
    code: [
      'def add_tag(tag, tags=[]):',
      '    tags.append(tag)',
      '    return tags',
      'print(add_tag("a"))  # ["a"]',
      'print(add_tag("b"))  # expected ["b"]',
    ],
    bug: 0,
    fix: 'def add_tag(tag, tags=None):\n    if tags is None:\n        tags = []',
    why: 'Default arguments are evaluated once, when the function is defined, so every call shares the same list and the second call returns ["a", "b"]. Default to None and create the list inside.',
  },
  {
    id: 'spring-created',
    lang: 'java',
    file: 'UserController.java',
    level: 2,
    goal: 'Return the correct REST response for a newly created resource (HTTP 201).',
    code: [
      '@PostMapping("/users")',
      'public ResponseEntity<User> create(@RequestBody User user) {',
      '    User saved = service.save(user);',
      '    return ResponseEntity.ok(saved);',
      '}',
    ],
    bug: 3,
    fix: '    return ResponseEntity.status(HttpStatus.CREATED).body(saved);',
    why: 'ok() sends 200. A successful POST that creates something should answer 201 Created, ideally with a Location header, so clients can tell creation apart from a plain read.',
  },

  /* ── Hard ─────────────────────────────────────────────────────────────── */
  {
    id: 'java-sql-injection',
    lang: 'java',
    file: 'UserDao.java',
    level: 3,
    goal: 'Look up a user by email without exposing the database to attack.',
    code: [
      'public User findByEmail(Connection conn, String email) throws SQLException {',
      '    String sql = "SELECT * FROM users WHERE email = \'" + email + "\'";',
      '    try (Statement st = conn.createStatement();',
      '         ResultSet rs = st.executeQuery(sql)) {',
      '        return rs.next() ? map(rs) : null;',
      '    }',
      '}',
    ],
    bug: 1,
    fix: '    String sql = "SELECT * FROM users WHERE email = ?";  // + PreparedStatement.setString(1, email)',
    why: 'Concatenating user input into SQL allows SQL injection: an email like \' OR \'1\'=\'1 rewrites the query. Use a PreparedStatement with ? placeholders so input is always treated as data.',
  },
  {
    id: 'sql-not-in-null',
    lang: 'sql',
    file: 'no_orders.sql',
    level: 3,
    goal: 'Find customers who have never placed an order. (orders.customer_id can be NULL.)',
    code: [
      'SELECT name',
      'FROM customers',
      'WHERE id NOT IN (SELECT customer_id FROM orders)',
      'ORDER BY name;',
    ],
    bug: 2,
    fix: 'WHERE NOT EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = customers.id\n)',
    why: 'If the subquery returns even one NULL, NOT IN evaluates to UNKNOWN for every row and the result is empty. NOT EXISTS (or a LEFT JOIN … IS NULL) handles NULLs correctly.',
  },
  {
    id: 'js-var-closure',
    lang: 'js',
    file: 'retry.js',
    level: 3,
    goal: 'After 100 ms, log "Request 0", "Request 1" and "Request 2".',
    code: [
      'for (var i = 0; i < 3; i++) {',
      '  setTimeout(() => {',
      '    console.log("Request " + i);',
      '  }, 100);',
      '}',
    ],
    bug: 0,
    fix: 'for (let i = 0; i < 3; i++) {',
    why: 'var is function-scoped, so all three callbacks share one i. By the time the timers fire the loop is done and i is 3, so "Request 3" prints three times. let creates a fresh binding per iteration.',
  },
  {
    id: 'java-integer-equals',
    lang: 'java',
    file: 'Inventory.java',
    level: 3,
    goal: 'Return true when two quantities have the same value (values can be large, like 1000).',
    code: [
      'public boolean sameQuantity(Integer a, Integer b) {',
      '    if (a == null || b == null) {',
      '        return false;',
      '    }',
      '    return a == b;',
      '}',
    ],
    bug: 4,
    fix: '    return a.equals(b);',
    why: 'With Integer objects, == compares references. Java caches values from -128 to 127, so tests on small numbers pass, but 1000 == 1000 can be false. Use equals() or unbox to int.',
  },
  {
    id: 'java-binary-search-overflow',
    lang: 'java',
    file: 'BinarySearch.java',
    level: 3,
    goal: 'Search a sorted array that can hold more than a billion elements.',
    code: [
      'public static int search(int[] arr, int target) {',
      '    int lo = 0, hi = arr.length - 1;',
      '    while (lo <= hi) {',
      '        int mid = (lo + hi) / 2;',
      '        if (arr[mid] == target) return mid;',
      '        if (arr[mid] < target) lo = mid + 1;',
      '        else hi = mid - 1;',
      '    }',
      '    return -1;',
      '}',
    ],
    bug: 3,
    fix: '        int mid = lo + (hi - lo) / 2;',
    why: 'lo + hi can exceed Integer.MAX_VALUE on huge arrays, wrap around to a negative number and crash with a negative index. lo + (hi - lo) / 2 never overflows. This exact bug hid in widely used library code for years.',
  },
];

/* ────────────────────────────────────────────────────────────────────────── *
 * Tiny syntax highlighter (no dependencies)
 * ────────────────────────────────────────────────────────────────────────── */

type TokenKind = 'kw' | 'type' | 'str' | 'num' | 'fn' | 'ann' | 'com' | 'plain';
type Token = { text: string; kind: TokenKind };

const KEYWORDS: Record<Lang, Set<string>> = {
  java: new Set(
    'public private protected static final class void int double boolean long return if else for while try catch throws new null true false this extends implements import package'.split(
      ' ',
    ),
  ),
  js: new Set(
    'async await function const let var return if else for while new null true false undefined this class import export from of in typeof throw try catch'.split(
      ' ',
    ),
  ),
  python: new Set(
    'def return if else elif for while in not and or is None True False import from class'.split(
      ' ',
    ),
  ),
  sql: new Set(
    'SELECT FROM WHERE GROUP BY ORDER HAVING JOIN INNER LEFT RIGHT OUTER ON AS AND OR NOT IN IS NULL DISTINCT LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE EXISTS'.split(
      ' ',
    ),
  ),
};

// Groups: 1 comment · 2 string · 3 annotation · 4 number · 5 word · 6 space · 7 anything else
const COMMON_TOKENS =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(@\w+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/
    .source;

const TOKEN_RE: Record<Lang, RegExp> = {
  java: new RegExp(`(//.*)|${COMMON_TOKENS}`, 'g'),
  js: new RegExp(`(//.*)|${COMMON_TOKENS}`, 'g'),
  sql: new RegExp(`(--.*)|${COMMON_TOKENS}`, 'g'),
  python: new RegExp(`(#.*)|${COMMON_TOKENS}`, 'g'),
};

function tokenize(line: string, lang: Lang): Token[] {
  const tokens: Token[] = [];
  for (const m of line.matchAll(TOKEN_RE[lang])) {
    const text = m[0];
    let kind: TokenKind = 'plain';
    if (m[1]) kind = 'com';
    else if (m[2]) kind = 'str';
    else if (m[3]) kind = 'ann';
    else if (m[4]) kind = 'num';
    else if (m[5]) {
      const probe = lang === 'sql' ? text.toUpperCase() : text;
      if (KEYWORDS[lang].has(probe)) kind = 'kw';
      else if (line[(m.index ?? 0) + text.length] === '(') kind = 'fn';
      else if (lang !== 'sql' && /^[A-Z]/.test(text)) kind = 'type';
    }
    tokens.push({ text, kind });
  }
  return tokens;
}

/** The editor is always dark (in both site themes) so the palette is fixed. */
const TOKEN_CLASS: Record<TokenKind, string> = {
  kw: 'text-[#7ec8e3]',
  type: 'text-[#7edcb4]',
  str: 'text-[#f0c27a]',
  num: 'text-[#f4a582]',
  fn: 'text-[#c9b8ff]',
  ann: 'text-[#c9b8ff]',
  com: 'italic text-[#6f8a94]',
  plain: 'text-[#d7e9e4]',
};

const LANG_META: Record<Lang, { label: string; color: string }> = {
  java: { label: 'Java', color: '#f0c27a' },
  sql: { label: 'SQL', color: '#7ec8e3' },
  js: { label: 'JavaScript', color: '#f0d860' },
  python: { label: 'Python', color: '#8fb6f0' },
};

const LEVEL_LABEL: Record<Level, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

/* ────────────────────────────────────────────────────────────────────────── *
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRounds(): Challenge[] {
  const tier = (level: Level, count: number) =>
    shuffle(CHALLENGES.filter((c) => c.level === level)).slice(0, count);
  return [...tier(1, MIX[0]), ...tier(2, MIX[1]), ...tier(3, MIX[2])];
}

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function rankFor(correct: number, total: number): { title: string; note: string } {
  if (correct === total) {
    return { title: 'Principal Debugger', note: 'Flawless. Not a single bug got past you.' };
  }
  if (correct >= total - 2) {
    return { title: 'Senior Debugger', note: 'Sharp eyes. Your code reviews would be a pleasure to read.' };
  }
  if (correct >= Math.ceil(total / 2)) {
    return { title: 'Bug Hunter', note: 'Solid instincts. A few sneaky ones slipped through.' };
  }
  return { title: 'Rookie Debugger', note: 'Every great developer has shipped these bugs. Give it another go.' };
}

type Phase = 'intro' | 'playing' | 'result';
type Status = 'asking' | 'correct' | 'wrong' | 'timeout';
type RoundResult = 'right' | 'wrong';

/* ────────────────────────────────────────────────────────────────────────── *
 * Small presentational pieces
 * ────────────────────────────────────────────────────────────────────────── */

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (reduceMotion) {
      node.textContent = String(value);
      previous.current = value;
      return undefined;
    }
    const controls = animate(previous.current, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => {
        node.textContent = String(Math.round(v));
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduceMotion]);

  return <span ref={ref} />;
}

function LangBadge({ lang }: { lang: Lang }) {
  const { label, color } = LANG_META[lang];
  return (
    <span
      className="rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[.14em]"
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {label}
    </span>
  );
}

function LevelBars({ level }: { level: Level }) {
  return (
    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i
            key={n}
            className={`w-1 rounded-sm ${n <= level ? 'bg-accent' : 'bg-foreground/15'}`}
            style={{ height: 4 + n * 3 }}
          />
        ))}
      </span>
      {LEVEL_LABEL[level]}
    </span>
  );
}

function Hearts({ lives }: { lives: number }) {
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${lives} of ${TOTAL_LIVES} lives left`}
    >
      {Array.from({ length: TOTAL_LIVES }, (_, i) => {
        const alive = i < lives;
        return (
          <motion.span
            key={i}
            initial={false}
            animate={alive ? { scale: 1, opacity: 1 } : { scale: [1, 1.4, 0.9], opacity: 0.55 }}
            transition={{ duration: 0.45 }}
            className="inline-flex"
          >
            <Heart
              size={19}
              className={alive ? 'fill-destructive text-destructive' : 'text-muted-foreground'}
            />
          </motion.span>
        );
      })}
    </div>
  );
}

function Pips({ total, results, current }: { total: number; results: RoundResult[]; current: number }) {
  return (
    <div className="flex items-center gap-3">
      <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
        Bug {Math.min(current + 1, total)}/{total}
      </p>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => {
          const r = results[i];
          const tone =
            r === 'right'
              ? 'bg-primary'
              : r === 'wrong'
                ? 'bg-destructive'
                : i === current
                  ? 'bg-foreground/50'
                  : 'bg-foreground/15';
          return <span key={i} className={`h-1.5 w-4 rounded-full transition-colors duration-300 sm:w-6 ${tone}`} />;
        })}
      </div>
    </div>
  );
}

/** Little confetti burst, played on the gutter of the line that was the bug. */
function Burst() {
  const colors = ['#7edcb4', '#7ec8e3', '#f0c27a', '#c9b8ff'];
  return (
    <span className="pointer-events-none absolute left-7 top-1/2" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 26 + (i % 3) * 12;
        return (
          <motion.i
            key={i}
            className="absolute block size-1.5 rounded-[2px]"
            style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.3,
              rotate: 180,
            }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        );
      })}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Intro artwork: a mini editor with a scanning magnifier hunting for a bug
 * ────────────────────────────────────────────────────────────────────────── */

function IntroArt({ reduce }: { reduce: boolean }) {
  const rows: ReadonlyArray<readonly [string, string]> = [
    ['w-[38%]', 'bg-[#7ec8e3]'],
    ['w-[62%]', 'bg-[#c9b8ff]'],
    ['w-[48%]', 'bg-[#7edcb4]'],
    ['w-[74%]', 'bg-[#f0c27a]'],
    ['w-[30%]', 'bg-[#7ec8e3]'],
    ['w-[56%]', 'bg-[#c9b8ff]'],
    ['w-[44%]', 'bg-[#7edcb4]'],
  ];
  const BUG_ROW = 3;
  const chips: ReadonlyArray<readonly [string, string]> = [
    ['Java', '-left-2 top-2'],
    ['SQL', '-right-3 top-[30%]'],
    ['REST', '-left-4 bottom-[26%]'],
    ['Python', 'right-6 -bottom-3'],
  ];

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-sm py-4">
      <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0b1519] shadow-[0_30px_80px_rgba(0,9,12,.35)]">
        <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] bg-[#0f1d22] px-3.5 py-2.5">
          <span className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-[#ff6b6b]/80" />
            <i className="size-2.5 rounded-full bg-[#f0c27a]/80" />
            <i className="size-2.5 rounded-full bg-[#7edcb4]/80" />
          </span>
          <span className="font-mono text-[11px] text-[#8fa9a4]">Mystery.java</span>
        </div>
        <div className="relative">
          {rows.map(([width, color], i) => (
            <div
              key={i}
              className={`relative flex h-8 items-center gap-4 px-4 ${i === BUG_ROW ? 'bg-[rgba(255,107,107,0.12)]' : ''}`}
            >
              {i === BUG_ROW && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#ff6b6b]" />}
              <span className="w-4 text-right font-mono text-[11px] text-[#5d7680]">{i + 1}</span>
              <span className={`h-2 rounded-full opacity-70 ${width} ${color}`} />
              {i === BUG_ROW && (
                <motion.span
                  className="ml-auto text-[#ff8a8a]"
                  animate={reduce ? undefined : { rotate: [0, -14, 14, -10, 10, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}
                >
                  <Bug size={16} />
                </motion.span>
              )}
            </div>
          ))}
          <motion.div
            className="pointer-events-none absolute left-[46%] top-0 flex size-8 items-center justify-center"
            animate={reduce ? { y: BUG_ROW * 32 } : { y: [0, 64, 160, 96, 96, 0] }}
            transition={
              reduce ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.2, 0.45, 0.7, 0.9, 1] }
            }
          >
            <span className="flex size-7 items-center justify-center rounded-full border border-[#7ec8e3]/60 bg-[#7ec8e3]/15 text-[#7ec8e3] shadow-[0_0_20px_rgba(126,200,227,.4)]">
              <Search size={14} />
            </span>
          </motion.div>
        </div>
      </div>
      {chips.map(([label, position], i) => (
        <motion.span
          key={label}
          className={`glass absolute rounded-full px-3 py-1 font-mono text-[10px] text-foreground ${position}`}
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        >
          {label}
        </motion.span>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * The game
 * ────────────────────────────────────────────────────────────────────────── */

export function SpotTheBugGame() {
  const reduceMotion = useReducedMotion();
  const reduce = !!reduceMotion;
  const rootRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const inView = useInView(rootRef, { amount: 0.25 });

  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<Challenge[]>([]);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<Status>('asking');
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [gain, setGain] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [relaxed, setRelaxed] = useState(false);
  const [best, setBest] = useState(readBest);
  const [newBest, setNewBest] = useState(false);
  const [announce, setAnnounce] = useState('');

  const current: Challenge | undefined = rounds[idx];
  const tokens = useMemo(
    () => (current ? current.code.map((line) => tokenize(line, current.lang)) : []),
    [current],
  );

  /* Timer: runs only while a question is open, the section is on screen and
     the tab is visible. Relaxed mode has no timer at all. */
  useEffect(() => {
    if (phase !== 'playing' || status !== 'asking' || relaxed || !inView) return undefined;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (document.hidden) return;
      setTimeLeft((t) => Math.max(0, t - dt));
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, status, relaxed, inView, idx]);

  const answer = useCallback(
    (line: number | null) => {
      if (phase !== 'playing' || status !== 'asking' || !current) return;
      setPicked(line);
      if (line === current.bug) {
        const speedBonus = relaxed ? 0 : Math.round((timeLeft / ROUND_SECONDS) * 50);
        const points = 100 + speedBonus + Math.min(streak, 4) * 10;
        setGain(points);
        setScore((s) => s + points);
        setStreak(streak + 1);
        setBestStreak((b) => Math.max(b, streak + 1));
        setResults((r) => [...r, 'right']);
        setStatus('correct');
        setAnnounce(`Correct! Plus ${points} points. ${current.why}`);
      } else {
        setLives((l) => l - 1);
        setStreak(0);
        setResults((r) => [...r, 'wrong']);
        setStatus(line === null ? 'timeout' : 'wrong');
        setAnnounce(
          `${line === null ? 'Time is up.' : 'Not quite.'} The bug was on line ${current.bug + 1}. ${current.why}`,
        );
      }
    },
    [phase, status, current, relaxed, timeLeft, streak],
  );

  useEffect(() => {
    if (phase === 'playing' && status === 'asking' && !relaxed && timeLeft <= 0) answer(null);
  }, [phase, status, relaxed, timeLeft, answer]);

  /* Focus management: Next button after answering, code panel on a new round. */
  useEffect(() => {
    if (phase === 'playing' && status !== 'asking') nextRef.current?.focus({ preventScroll: true });
  }, [phase, status]);
  useEffect(() => {
    if (phase === 'playing') codeRef.current?.focus({ preventScroll: true });
  }, [phase, idx]);

  const start = () => {
    setRounds(pickRounds());
    setIdx(0);
    setScore(0);
    setLives(TOTAL_LIVES);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    setPicked(null);
    setStatus('asking');
    setTimeLeft(ROUND_SECONDS);
    setGain(0);
    setNewBest(false);
    setAnnounce('');
    setPhase('playing');
  };

  const finish = () => {
    if (score > best) {
      setBest(score);
      setNewBest(true);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(score));
      } catch {
        /* storage unavailable — the game still works */
      }
    }
    setPhase('result');
  };

  const next = () => {
    if (lives <= 0 || idx >= rounds.length - 1) {
      finish();
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setStatus('asking');
    setTimeLeft(ROUND_SECONDS);
    setGain(0);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (phase !== 'playing' || status !== 'asking' || !current) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const n = Number(event.key);
    if (Number.isInteger(n) && n >= 1 && n <= current.code.length) {
      event.preventDefault();
      answer(n - 1);
    }
  };

  const correctCount = results.filter((r) => r === 'right').length;
  const revealed = status !== 'asking';
  const pct = relaxed ? 100 : Math.max(0, (timeLeft / ROUND_SECONDS) * 100);
  const timerTone = relaxed ? 'bg-primary/40' : pct > 50 ? 'bg-primary' : pct > 25 ? 'bg-accent' : 'bg-destructive';
  const isLastRound = lives <= 0 || idx >= rounds.length - 1;

  return (
    <section id="play" aria-labelledby="play-title" className="section-shell py-16 sm:py-20 md:py-32">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.65 }}
      >
        {/* Section heading — same look as the other sections */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-12 md:flex-row md:items-end">
          <div>
            <div className="eyebrow mb-4 flex items-center gap-3">
              <Zap size={13} className="text-accent" />
              <span className="h-px w-8 bg-white/20" />
              Bonus level
            </div>
            <h2
              id="play-title"
              className="max-w-2xl text-3xl font-medium tracking-[-.035em] text-foreground sm:text-4xl md:text-5xl"
            >
              Spot the bug. Beat the clock.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Real bug patterns from Java, SQL and REST code. Each snippet has exactly one broken line. How many can you catch?
          </p>
        </div>

        {/* Game shell */}
        <div
          ref={rootRef}
          onKeyDown={onKeyDown}
          className="glass relative overflow-hidden rounded-2xl"
        >
          <div className="grid-lines pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />

          <p className="sr-only" role="status" aria-live="polite">
            {announce}
          </p>

          {/* ── INTRO ───────────────────────────────────────────────────── */}
          {phase === 'intro' && (
            <div className="relative grid items-center gap-10 p-6 md:p-10 lg:grid-cols-[1.05fr_.95fr] lg:p-14">
              <div>
                <h3 className="text-3xl leading-tight tracking-[-.04em] text-foreground md:text-4xl">
                  Think you can review code like a developer?
                </h3>
                <p className="mt-4 max-w-md leading-7 text-muted-foreground">
                  You get {ROUNDS_PER_GAME} short snippets, from easy to nasty. Click the line that breaks the code. Fast, correct answers build a streak bonus.
                </p>

                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {[
                    [Target, `${ROUNDS_PER_GAME} snippets`],
                    [Heart, `${TOTAL_LIVES} lives`],
                    [Timer, `${ROUND_SECONDS}s per bug`],
                    [Flame, 'Streak bonus'],
                  ].map(([Icon, label]) => {
                    const I = Icon as typeof Target;
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

                <button
                  type="button"
                  role="switch"
                  aria-checked={relaxed}
                  onClick={() => setRelaxed((v) => !v)}
                  className="mt-7 flex min-h-11 items-center gap-3 text-left text-sm text-muted-foreground"
                >
                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${relaxed ? 'border-primary/50 bg-primary/25' : 'border-white/15 bg-white/[.04]'}`}
                  >
                    <span
                      className={`absolute top-[2px] size-[18px] rounded-full transition-all ${relaxed ? 'left-[22px] bg-primary' : 'left-[2px] bg-muted-foreground'}`}
                    />
                  </span>
                  <span>
                    <span className="block text-foreground">Relaxed mode</span>
                    <span className="block text-xs">No timer. Take as long as you like.</span>
                  </span>
                </button>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <button
                    type="button"
                    onClick={start}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    data-testid="button-start-game"
                  >
                    <Play size={16} className="fill-current" /> Start debugging
                  </button>
                  {best > 0 && (
                    <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <Trophy size={14} className="text-accent" /> Your best: <strong className="text-foreground">{best}</strong>
                    </p>
                  )}
                </div>
              </div>
              <IntroArt reduce={reduce} />
            </div>
          )}

          {/* ── PLAYING ─────────────────────────────────────────────────── */}
          {phase === 'playing' && current && (
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-white/10 px-4 py-3.5 md:px-6">
                <Pips total={rounds.length} results={results} current={idx} />
                <div className="flex items-center gap-4 sm:gap-6">
                  {streak >= 2 && (
                    <motion.div
                      key={streak}
                      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent"
                      aria-label={`Streak of ${streak}`}
                    >
                      <Flame size={13} /> x{streak}
                    </motion.div>
                  )}
                  <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {relaxed ? <InfinityIcon size={14} /> : <Timer size={14} />}
                    {relaxed ? 'relaxed' : `${Math.ceil(timeLeft)}s`}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Score</p>
                    <p className="font-mono text-lg leading-none tabular-nums text-foreground" data-testid="text-score">
                      <AnimatedNumber value={score} />
                    </p>
                  </div>
                  <Hearts lives={lives} />
                </div>
              </div>

              <div className="h-1.5 w-full bg-foreground/10" aria-hidden="true">
                <div
                  className={`h-full transition-[width] duration-100 ease-linear ${timerTone}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                {/* Editor */}
                <div className="min-w-0 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0b1519] shadow-[0_24px_60px_rgba(0,9,12,.28)]">
                  <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] bg-[#0f1d22] px-3.5 py-2.5">
                    <span className="flex gap-1.5" aria-hidden="true">
                      <i className="size-2.5 rounded-full bg-[#ff6b6b]/80" />
                      <i className="size-2.5 rounded-full bg-[#f0c27a]/80" />
                      <i className="size-2.5 rounded-full bg-[#7edcb4]/80" />
                    </span>
                    <span className="flex min-w-0 items-center gap-2 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 font-mono text-[11px] text-[#b8cfc9]">
                      <FileCode2 size={12} className="shrink-0 text-[#7edcb4]" />
                      <span className="truncate">{current.file}</span>
                    </span>
                    <span className="ml-auto">
                      <LangBadge lang={current.lang} />
                    </span>
                  </div>

                  <div
                    ref={codeRef}
                    tabIndex={-1}
                    role="group"
                    aria-label="Code. Choose the line that contains the bug."
                    className="overflow-x-auto py-2 outline-none"
                  >
                    <div className="w-max min-w-full">
                      {current.code.map((line, i) => {
                        const isBug = i === current.bug;
                        const isPicked = picked === i;
                        const wrongPick = revealed && isPicked && !isBug;
                        let tone = 'hover:bg-[rgba(255,255,255,0.06)] focus-visible:bg-[rgba(255,255,255,0.06)]';
                        let bar = 'bg-transparent group-hover:bg-[#7ec8e3]';
                        if (revealed) {
                          if (isBug) {
                            tone = status === 'correct' ? 'bg-[rgba(126,220,180,0.14)]' : 'bg-[rgba(255,107,107,0.16)]';
                            bar = status === 'correct' ? 'bg-[#7edcb4]' : 'bg-[#ff6b6b]';
                          } else if (wrongPick) {
                            tone = 'bg-[rgba(240,194,122,0.13)]';
                            bar = 'bg-[#f0c27a]';
                          } else {
                            tone = 'opacity-45';
                            bar = 'bg-transparent';
                          }
                        }
                        const label = `Line ${i + 1}: ${line.trim()}${
                          revealed ? (isBug ? '. This is the bug.' : wrongPick ? '. Your pick.' : '') : ''
                        }`;
                        return (
                          <motion.button
                            key={i}
                            type="button"
                            aria-label={label}
                            aria-disabled={revealed}
                            onClick={() => answer(i)}
                            animate={wrongPick && !reduce ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`group relative flex min-h-11 w-full items-center text-left transition-colors sm:min-h-10 ${tone} ${revealed ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <span className={`absolute inset-y-0 left-0 w-[3px] transition-colors ${bar}`} />
                            <span className="relative flex w-14 shrink-0 select-none items-center justify-end gap-1.5 pr-4 font-mono text-[11px] text-[#5d7680]">
                              {revealed && isBug && status === 'correct' && <Check size={14} className="text-[#7edcb4]" />}
                              {revealed && isBug && status !== 'correct' && (
                                <motion.span
                                  animate={reduce ? undefined : { rotate: [0, -16, 16, -10, 10, 0] }}
                                  transition={{ duration: 1.2, repeat: 2 }}
                                  className="inline-flex"
                                >
                                  <Bug size={14} className="text-[#ff8a8a]" />
                                </motion.span>
                              )}
                              {wrongPick && <X size={14} className="text-[#f0c27a]" />}
                              {i + 1}
                              {revealed && isBug && status === 'correct' && !reduce && <Burst />}
                            </span>
                            <code className="whitespace-pre pr-16 font-mono text-[12.5px] leading-8 sm:text-[13.5px]">
                              {(tokens[i] ?? []).map((t, k) => (
                                <span key={k} className={TOKEN_CLASS[t.kind]}>
                                  {t.text}
                                </span>
                              ))}
                            </code>
                            {revealed && isBug && status === 'correct' && (
                              <motion.span
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-[#7edcb4]"
                                initial={reduce ? false : { opacity: 0, y: 6 }}
                                animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 1, 0.85], y: [6, -8, -8, -8] }}
                                transition={{ duration: 1.1 }}
                              >
                                +{gain}
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.08)] bg-[#0f1d22] px-3.5 py-2 font-mono text-[10px] text-[#6f8a94]">
                    <span>{LANG_META[current.lang].label} · UTF-8</span>
                    <span className="hidden sm:inline">
                      {revealed ? `Bug on line ${current.bug + 1}` : `Tip: press 1–${current.code.length} to pick a line`}
                    </span>
                  </div>
                </div>

                {/* Side panel */}
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 md:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="eyebrow">Mission</p>
                      <LevelBars level={current.level} />
                    </div>
                    <p className="mt-3.5 text-sm leading-6 text-foreground">{current.goal}</p>
                    <p className="mt-3.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                      <Bug size={13} className="text-destructive" /> Exactly one line is broken.
                    </p>
                  </div>

                  {!revealed ? (
                    <motion.div
                      key="ask"
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-1 items-center gap-4 rounded-xl border border-dashed border-white/15 p-4 md:p-5"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10 text-secondary">
                        <Search size={17} />
                      </span>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Read the code, find the line that does not match the mission, and click it.
                        {relaxed ? ' No timer in relaxed mode.' : ''}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="answer"
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className={`flex flex-1 flex-col rounded-xl border p-4 md:p-5 ${status === 'correct' ? 'border-primary/35 bg-primary/[.06]' : 'border-destructive/35 bg-destructive/[.06]'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex size-8 items-center justify-center rounded-full ${status === 'correct' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}
                        >
                          {status === 'correct' ? <Check size={17} /> : status === 'timeout' ? <Timer size={16} /> : <X size={17} />}
                        </span>
                        <p className="text-base font-semibold text-foreground">
                          {status === 'correct'
                            ? `Bug squashed! +${gain}`
                            : status === 'timeout'
                              ? `Time's up. Bug was on line ${current.bug + 1}`
                              : `Not quite. Bug was on line ${current.bug + 1}`}
                        </p>
                      </div>

                      <div className="mt-4 overflow-x-auto rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0b1519] py-1.5 font-mono text-[12px] leading-6">
                        <div className="w-max min-w-full">
                          <div className="whitespace-pre border-l-2 border-[#ff6b6b] bg-[rgba(255,107,107,0.1)] px-3 text-[#ffb4b4]">
                            {'- '}
                            {current.code[current.bug]}
                          </div>
                          {current.fix.split('\n').map((fixLine, i) => (
                            <div
                              key={i}
                              className="whitespace-pre border-l-2 border-[#7edcb4] bg-[rgba(126,220,180,0.1)] px-3 text-[#a6efce]"
                            >
                              {'+ '}
                              {fixLine}
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="mt-4 flex gap-2.5 text-sm leading-6 text-muted-foreground">
                        <Lightbulb size={16} className="mt-1 shrink-0 text-accent" />
                        <span>{current.why}</span>
                      </p>

                      <div className="mt-auto pt-5">
                        <button
                          ref={nextRef}
                          type="button"
                          onClick={next}
                          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                          data-testid="button-next-bug"
                        >
                          {isLastRound ? 'See results' : 'Next bug'} <ArrowRight size={16} />
                        </button>
                        {lives <= 0 && (
                          <p className="mt-3 font-mono text-[11px] text-muted-foreground">Out of lives. The bugs won this round.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── RESULT ──────────────────────────────────────────────────── */}
          {phase === 'result' &&
            (() => {
              const rank = rankFor(correctCount, rounds.length);
              return (
                <div className="relative grid items-center gap-10 p-6 md:p-10 lg:grid-cols-[1fr_.9fr] lg:p-14">
                  <div>
                    <motion.div
                      initial={reduce ? false : { scale: 0.6, rotate: -12, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                      className="relative flex size-16 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent"
                    >
                      <Trophy size={28} />
                    </motion.div>
                    <p className="eyebrow mt-6">{lives <= 0 ? 'Game over' : 'Session complete'}</p>
                    <h3 className="mt-3 text-3xl leading-tight tracking-[-.04em] text-foreground md:text-4xl" data-testid="text-rank">
                      {rank.title}
                    </h3>
                    <p className="mt-3 max-w-md leading-7 text-muted-foreground">{rank.note}</p>

                    <dl className="mt-7 grid max-w-md grid-cols-2 gap-3">
                      {[
                        ['Score', String(score)],
                        ['Correct', `${correctCount}/${rounds.length}`],
                        ['Best streak', `x${bestStreak}`],
                        ['Personal best', String(Math.max(best, score))],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3.5">
                          <dt className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{label}</dt>
                          <dd className="mt-1.5 font-mono text-2xl tabular-nums text-foreground">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {newBest && (
                      <p className="mt-4 flex items-center gap-2 font-mono text-xs text-accent">
                        <Zap size={14} /> New personal best!
                      </p>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={start}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                        data-testid="button-play-again"
                      >
                        <RotateCcw size={16} /> Play again
                      </button>
                      <a
                        href="#contact"
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm text-foreground transition-colors hover:border-primary/45 hover:bg-white/[.04]"
                      >
                        Like how I think? Let&apos;s talk <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[.03] p-4 md:p-5">
                    <p className="eyebrow mb-4">Bug report</p>
                    <ul className="divide-y divide-border">
                      {rounds.map((round, i) => {
                        const r = results[i];
                        return (
                          <li key={round.id} className="flex items-center gap-3 py-2.5">
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                                r === 'right'
                                  ? 'bg-primary/15 text-primary'
                                  : r === 'wrong'
                                    ? 'bg-destructive/15 text-destructive'
                                    : 'bg-foreground/10 text-muted-foreground'
                              }`}
                            >
                              {r === 'right' ? <Check size={13} /> : r === 'wrong' ? <X size={13} /> : <Minus size={13} />}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{round.file}</span>
                            <LangBadge lang={round.lang} />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })()}
        </div>
      </motion.div>
    </section>
  );
}

export default SpotTheBugGame;
