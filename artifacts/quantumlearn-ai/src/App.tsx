import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Atom,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  CircleDot,
  ChevronDown,
  Eye,
  FlaskConical,
  GitCompare,
  Gauge,
  GraduationCap,
  Lightbulb,
  LogOut,
  Menu,
  MessageCircle,
  Play,
  RotateCcw,
  Send,
  Settings,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';

type GateName = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CZ' | 'DIFF';
type Gate = { id: number; name: GateName; qubit: number };
type LearningLevel = '' | 'beginner' | 'basic' | 'intermediate' | 'advanced';
type Learner = { name: string; email: string; learningLevel: LearningLevel; joinedAt: string; completed: string[]; streak: number; runs: number; quizScore: number; predictionAttempts: number; predictionCorrect: number };
type Complex = { re: number; im: number };

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the environment.');
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(174 58% 35%)',
    colorForeground: 'hsl(231 26% 18%)',
    colorMutedForeground: 'hsl(231 12% 48%)',
    colorDanger: 'hsl(6 72% 55%)',
    colorBackground: 'hsl(43 50% 98%)',
    colorInput: 'hsl(43 43% 95%)',
    colorInputForeground: 'hsl(231 26% 18%)',
    colorNeutral: 'hsl(39 27% 85%)',
    fontFamily: 'DM Sans, ui-sans-serif, sans-serif',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[hsl(43_50%_98%)] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[hsl(231_26%_18%)] font-black',
    headerSubtitle: 'text-[hsl(231_12%_48%)]',
    socialButtonsBlockButtonText: 'text-[hsl(231_26%_18%)] font-bold',
    formFieldLabel: 'text-[hsl(231_26%_18%)] font-bold',
    footerActionLink: 'text-[hsl(174_58%_35%)] font-bold',
    footerActionText: 'text-[hsl(231_12%_48%)]',
    dividerText: 'text-[hsl(231_12%_48%)]',
    identityPreviewEditButton: 'text-[hsl(174_58%_35%)]',
    formFieldSuccessText: 'text-[hsl(174_58%_35%)]',
    alertText: 'text-[hsl(231_26%_18%)]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[hsl(39_27%_85%)] bg-[hsl(43_43%_95%)] hover:bg-[hsl(42_30%_90%)]',
    formButtonPrimary: 'bg-[hsl(174_58%_35%)] hover:bg-[hsl(174_58%_29%)] text-[hsl(43_43%_97%)] font-black',
    formFieldInput: 'border-[hsl(39_27%_85%)] bg-[hsl(43_43%_95%)] text-[hsl(231_26%_18%)]',
    footerAction: 'border-t border-[hsl(39_27%_85%)]',
    dividerLine: 'bg-[hsl(39_27%_85%)]',
    alert: 'border-[hsl(6_72%_65%/.4)] bg-[hsl(6_72%_65%/.08)]',
    otpCodeFieldInput: 'border-[hsl(39_27%_85%)]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};
function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}
const initialLearner: Learner = { name: '', email: '', learningLevel: '', joinedAt: '', completed: [], streak: 1, runs: 0, quizScore: 0, predictionAttempts: 0, predictionCorrect: 0 };
const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Gauge },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/algorithms', label: 'Algorithms', icon: BrainCircuit },
  { href: '/quantum-lab', label: 'Quantum lab', icon: FlaskConical },
  { href: '/qubit-explorer', label: 'Qubit explorer', icon: CircleDot },
  { href: '/quiz', label: 'Practice', icon: CircleHelp },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/ai-tutor', label: 'AI tutor', icon: MessageCircle },
];
const topics = [
  { id: 'what-is-quantum', title: 'What is quantum computing?', tag: 'Start here', time: '6 min', copy: 'A friendly map of qubits, states, and why this field is different.' },
  { id: 'qubits', title: 'Qubits & superposition', tag: 'Foundation', time: '8 min', copy: 'See how one qubit can hold a blend of possibilities.' },
  { id: 'measurement', title: 'Measurement & probability', tag: 'Foundation', time: '7 min', copy: 'Turn amplitudes into the probabilities you can actually observe.' },
  { id: 'entanglement', title: 'Entanglement', tag: 'Next up', time: '10 min', copy: 'Understand correlations that do not behave like ordinary bits.' },
];
const algorithms = [
  { id: 'grover', name: "Grover's algorithm", level: 'Beginner', time: '18 min', copy: 'Search an unstructured space with fewer guesses.', color: 'coral' },
  { id: 'teleportation', name: 'Quantum teleportation', level: 'Intermediate', time: '22 min', copy: 'Move an unknown state using entanglement and two classical bits.', color: 'teal' },
  { id: 'deutsch-jozsa', name: 'Deutsch–Jozsa', level: 'Intermediate', time: '16 min', copy: 'Spot a hidden pattern with one quantum query.', color: 'gold' },
];

const cx = (a: number, b: number): Complex => ({ re: a, im: b });
const add = (a: Complex, b: Complex): Complex => cx(a.re + b.re, a.im + b.im);
const mul = (a: Complex, b: Complex): Complex => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const magnitude2 = (a: Complex) => a.re * a.re + a.im * a.im;
const gateMatrix: Record<'H' | 'X' | 'Y' | 'Z' | 'S' | 'T', [[Complex, Complex], [Complex, Complex]]> = {
  H: [[cx(1 / Math.sqrt(2), 0), cx(1 / Math.sqrt(2), 0)], [cx(1 / Math.sqrt(2), 0), cx(-1 / Math.sqrt(2), 0)]],
  X: [[cx(0, 0), cx(1, 0)], [cx(1, 0), cx(0, 0)]],
  Y: [[cx(0, 0), cx(0, -1)], [cx(0, 1), cx(0, 0)]],
  Z: [[cx(1, 0), cx(0, 0)], [cx(0, 0), cx(-1, 0)]],
  S: [[cx(1, 0), cx(0, 0)], [cx(0, 0), cx(0, 1)]],
  T: [[cx(1, 0), cx(0, 0)], [cx(0, 0), cx(Math.SQRT1_2, Math.SQRT1_2)]],
};

function simulate(gates: Gate[]) {
  let state = Array.from({ length: 8 }, () => cx(0, 0));
  state[0] = cx(1, 0);
  gates.forEach((gate) => {
    if (gate.name === 'CZ') {
      state = state.map((amplitude, index) => (index & (1 << gate.qubit) && index & (1 << ((gate.qubit + 1) % 3)) ? cx(-amplitude.re, -amplitude.im) : amplitude));
      return;
    }
    if (gate.name === 'DIFF') {
      const indices = [0, 1, 2, 3].map((index) => index | (gate.qubit > 1 ? 4 : 0));
      const mean = indices.reduce((sum, index) => add(sum, state[index]), cx(0, 0));
      const avg = cx(mean.re / 4, mean.im / 4);
      state = state.map((amplitude, index) => indices.includes(index) ? cx(2 * avg.re - amplitude.re, 2 * avg.im - amplitude.im) : amplitude);
      return;
    }
    const matrix = gateMatrix[gate.name];
    if (!matrix) return;
    const next = [...state];
    for (let index = 0; index < 8; index += 1) {
      if ((index & (1 << gate.qubit)) === 0) {
        const pair = index | (1 << gate.qubit);
        next[index] = add(mul(matrix[0][0], state[index]), mul(matrix[0][1], state[pair]));
        next[pair] = add(mul(matrix[1][0], state[index]), mul(matrix[1][1], state[pair]));
      }
    }
    state = next;
  });
  const probabilities = state.map(magnitude2);
  const total = probabilities.reduce((sum, value) => sum + value, 0) || 1;
  return { state, probabilities: probabilities.map((value) => value / total) };
}

function useLearner(userId: string | null | undefined, user: { fullName: string | null; primaryEmailAddress: { emailAddress: string } | null } | null | undefined) {
  const storageKey = userId ? `ql-learner:${userId}` : 'ql-guest';
  const [learner, setLearner] = useState<Learner>(initialLearner);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || 'null') as Partial<Learner> | null;
      const next = { ...initialLearner, ...(stored || {}) };
      if (user) {
        next.name = next.name || user.fullName || '';
        next.email = user.primaryEmailAddress?.emailAddress || next.email;
        next.joinedAt = next.joinedAt || new Date().toISOString();
      }
      setLearner(next);
    } catch {
      setLearner({ ...initialLearner, name: user?.fullName || '', email: user?.primaryEmailAddress?.emailAddress || '', joinedAt: user ? new Date().toISOString() : '' });
    } finally {
      setReady(true);
    }
  }, [storageKey, user]);
  useEffect(() => {
    if (ready && userId) localStorage.setItem(storageKey, JSON.stringify(learner));
  }, [learner, ready, storageKey, userId]);
  return [learner, setLearner, ready] as const;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
    <span className="relative flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_4px_0_hsl(174_58%_25%)]">
      <Atom size={20} strokeWidth={1.8} />
      <span className="absolute size-1.5 rounded-full bg-[hsl(var(--accent))]" />
    </span>
    {!compact && <span className="text-[1.05rem] font-black tracking-[-.04em]">quantum<span className="text-[hsl(var(--primary))]">learn</span></span>}
  </Link>;
}

function ProfileMenu({ learner }: { learner: Learner }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const displayName = user?.fullName || learner.name || 'Learner';
  return <div className="relative">
    <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 pr-2 text-left hover:border-[hsl(var(--primary)/.5)]" aria-expanded={open} aria-label="Open profile menu" data-testid="button-profile-menu">
      <span className="flex size-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-xs font-black">{displayName.slice(0, 1).toUpperCase()}</span>
      <span className="hidden max-w-28 truncate text-xs font-bold sm:block">{displayName}</span>
      <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="absolute right-0 top-12 z-40 w-52 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[0_16px_40px_hsl(231_26%_18%/.15)]">
      <div className="border-b border-[hsl(var(--border))] px-3 pb-3 pt-2"><p className="truncate text-sm font-black">{displayName}</p><p className="mt-1 truncate text-[10px] text-[hsl(var(--muted-foreground))]">{user?.primaryEmailAddress?.emailAddress || learner.email}</p></div>
      <div className="py-1">
        <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-[hsl(var(--muted))]" data-testid="link-profile-menu"><UserRound size={14} /> Profile</Link>
        <Link href="/progress" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-[hsl(var(--muted))]" data-testid="link-progress-menu"><BarChart3 size={14} /> My progress</Link>
        <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-[hsl(var(--muted))]" data-testid="link-settings-menu"><Settings size={14} /> Settings</Link>
        <Link href="/ai-tutor" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-[hsl(var(--muted))]" data-testid="link-tutor-menu"><MessageCircle size={14} /> AI tutor</Link>
      </div>
      <button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="flex w-full items-center gap-2 border-t border-[hsl(var(--border))] px-3 py-3 text-xs font-bold text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/.08)]" data-testid="button-logout"><LogOut size={14} /> Log out</button>
    </div>}
  </div>;
}

function Shell({ children, learner }: { children: ReactNode; learner: Learner }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return <div className="ql-noise min-h-[100dvh] bg-[hsl(var(--background))]">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col border-r border-[hsl(var(--border))] bg-[hsl(43_43%_93%)] px-4 py-5 transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-9 flex items-center justify-between px-2"><Logo /><button onClick={() => setOpen(false)} className="rounded-lg p-1 md:hidden" aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button></div>
      <p className="ql-kicker px-3 pb-3">Your workspace</p>
      <nav className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href !== '/dashboard' && location.startsWith(href));
          return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${active ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_4px_0_hsl(174_58%_25%)]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <Icon size={17} strokeWidth={active ? 2.5 : 2} /><span>{label}</span>
            {label === 'AI tutor' && <span className={`ml-auto size-2 rounded-full ${active ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--accent))]'}`} />}
          </Link>;
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-[hsl(var(--foreground))] p-4 text-[hsl(var(--primary-foreground))]">
        <div className="mb-3 flex items-center justify-between"><span className="ql-kicker !text-[hsl(var(--secondary))]">This week</span><Zap size={15} className="text-[hsl(var(--secondary))]" /></div>
        <p className="ql-serif text-xl">Keep the spark going.</p>
        <p className="mt-1 text-xs leading-5 text-[hsl(43_43%_82%)]">A little practice today makes the next circuit easier.</p>
        <div className="mt-4 flex items-center gap-2"><div className="ql-progress flex-1 !bg-[hsl(231_20%_30%)]"><span style={{ width: `${Math.min(100, learner.completed.length * 14 + 20)}%`, background: 'hsl(var(--secondary))' }} /></div><span className="ql-mono text-[10px]">{learner.completed.length}/7</span></div>
      </div>
    </aside>
    {open && <button className="fixed inset-0 z-20 bg-[hsl(231_26%_18%_/.25)] md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" data-testid="button-overlay-menu" />}
    <div className="md:pl-[250px]">
      <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.88)] px-5 backdrop-blur-md md:px-9">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 md:hidden" aria-label="Open menu" data-testid="button-open-menu"><Menu size={21} /></button>
        <div className="hidden md:block"><p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">{location === '/dashboard' ? 'Tuesday, your lab is ready' : 'QuantumLearn AI'}</p></div>
        <div className="ml-auto flex items-center gap-3"><Link href="/ai-tutor" className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] sm:flex" data-testid="link-header-tutor"><MessageCircle size={15} /> Ask the tutor</Link><ProfileMenu learner={learner} /></div>
      </header>
      <main className="mx-auto max-w-[1380px] px-5 py-8 md:px-9 md:py-10">{children}</main>
    </div>
  </div>;
}

function Landing() {
  return <div className="ql-noise min-h-[100dvh] overflow-hidden bg-[hsl(var(--background))]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10"><Logo /><div className="flex items-center gap-2"><Link href="/sign-in" className="ql-button ql-button-quiet" data-testid="link-landing-sign-in">Sign in</Link><Link href="/sign-up" className="ql-button ql-button-primary" data-testid="link-landing-sign-up">Create account <ArrowRight size={15} /></Link></div></header>
    <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 md:grid-cols-[1.02fr_.98fr] md:px-10 md:pb-24 md:pt-20">
      <div className="relative z-10 ql-rise"><p className="ql-kicker mb-5 flex items-center gap-2"><span className="size-2 rounded-full bg-[hsl(var(--accent))]" />A personal quantum laboratory</p><h1 className="ql-serif max-w-2xl text-[3.7rem] leading-[.95] tracking-[-.055em] md:text-[6.6rem]">Make the<br /><em className="text-[hsl(var(--primary))]">invisible</em><br />click.</h1><p className="mt-7 max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">QuantumLearn turns quantum computing from a wall of symbols into a place you can explore. Learn a concept, build the circuit, and see what the math does.</p>
         <div className="mt-8 max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.75)] p-4 shadow-[0_12px_34px_hsl(231_26%_18%_/.06)]"><p className="ql-label">Your personal learning path</p><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Create an account to keep lessons, experiments, predictions, and progress connected to you.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/sign-up" className="ql-button ql-button-primary" data-testid="button-start-learning">Start exploring <ArrowRight size={16} /></Link><Link href="/sign-in" className="ql-button ql-button-quiet" data-testid="link-landing-existing-user">I already have an account</Link></div></div>
      </div>
      <div className="relative ql-rise-2 md:pl-5"><div className="ql-grid absolute -inset-10 rounded-[3rem] opacity-70" /><div className="relative mx-auto max-w-[510px] rotate-[2deg] rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[14px_18px_0_hsl(33_69%_78%/.6)]"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-2 pb-4"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[hsl(var(--accent))]" /><span className="ql-mono text-[10px] text-[hsl(var(--muted-foreground))]">LOCAL SIMULATOR / READY</span></div><span className="rounded-full bg-[hsl(174_58%_35%/.1)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--primary))]">3 QUBITS</span></div><div className="ql-mono mt-8 space-y-7 text-xs"><div className="grid grid-cols-[38px_1fr] items-center gap-3"><span className="font-bold text-[hsl(var(--muted-foreground))]">q₂</span><div className="relative h-px bg-[hsl(var(--border))]"><span className="absolute left-[64%] top-1/2 flex size-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-lg border-2 border-[hsl(var(--primary))] bg-[hsl(var(--card))] text-[hsl(var(--primary))]">H</span></div></div><div className="grid grid-cols-[38px_1fr] items-center gap-3"><span className="font-bold text-[hsl(var(--muted-foreground))]">q₁</span><div className="relative h-px bg-[hsl(var(--border))]"><span className="absolute left-[39%] top-1/2 flex size-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-lg border-2 border-[hsl(var(--accent))] bg-[hsl(var(--card))] text-[hsl(var(--accent))]">X</span><span className="absolute left-[72%] top-1/2 flex size-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-lg border-2 border-[hsl(var(--primary))] bg-[hsl(var(--card))] text-[hsl(var(--primary))]">H</span></div></div><div className="grid grid-cols-[38px_1fr] items-center gap-3"><span className="font-bold text-[hsl(var(--muted-foreground))]">q₀</span><div className="relative h-px bg-[hsl(var(--border))]"><span className="absolute left-[22%] top-1/2 flex size-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-lg border-2 border-[hsl(var(--primary))] bg-[hsl(var(--card))] text-[hsl(var(--primary))]">H</span><span className="absolute left-[72%] top-1/2 flex size-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-lg border-2 border-[hsl(var(--primary))] bg-[hsl(var(--card))] text-[hsl(var(--primary))]">H</span></div></div></div><div className="mt-9 grid grid-cols-3 gap-2 border-t border-[hsl(var(--border))] pt-4 text-center"><div><p className="ql-mono text-lg font-bold text-[hsl(var(--primary))]">.50</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">|000⟩</p></div><div><p className="ql-mono text-lg font-bold text-[hsl(var(--accent))]">.25</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">|011⟩</p></div><div><p className="ql-mono text-lg font-bold text-[hsl(var(--primary))]">.25</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">|101⟩</p></div></div></div><div className="absolute -bottom-5 -left-3 rounded-2xl bg-[hsl(var(--foreground))] px-4 py-3 text-[hsl(var(--primary-foreground))] shadow-xl"><p className="ql-mono text-[10px] text-[hsl(var(--secondary))]">TODAY'S LOOP</p><p className="mt-1 text-sm font-bold">Learn → build → understand</p></div></div>
    </section>
    <section className="border-y border-[hsl(var(--border))] bg-[hsl(33_69%_78%/.22)]"><div className="mx-auto grid max-w-7xl gap-0 md:grid-cols-4">{[['01', 'Learn', 'Short lessons, no gatekeeping.'], ['02', 'Visualize', 'Watch probability take shape.'], ['03', 'Build', 'Place gates with your own hands.'], ['04', 'Adapt', 'Ask why, then try again.']].map(([number, title, copy]) => <div key={number} className="border-b border-[hsl(var(--border))] p-6 md:border-b-0 md:border-r md:p-8 last:border-0"><span className="ql-mono text-xs text-[hsl(var(--accent))]">{number}</span><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p></div>)}</div></section>
     <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between md:px-10"><span>Built for curious minds who ask “but why?”</span><span className="ql-mono">YOUR PROGRESS, YOUR LAB NOTEBOOK</span></footer>
  </div>;
}

function AuthLoading() {
  return <div className="ql-noise flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] p-6"><div className="ql-card w-full max-w-sm p-8 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Atom size={24} className="animate-pulse" /></div><p className="ql-kicker mt-5">QuantumLearn</p><h1 className="ql-serif mt-2 text-3xl">Preparing your lab…</h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Checking your secure session.</p></div></div>;
}

function SignInPage() {
  const redirect = new URLSearchParams(window.location.search).get('redirect_url');
  return <div className="ql-noise flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] p-4 md:p-8"><div className="w-full max-w-[520px]"><div className="mb-5 flex items-center justify-between"><Logo /><Link href="/" className="text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" data-testid="link-auth-home">Back to overview</Link></div><div className="ql-card overflow-hidden p-3 md:p-5"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={redirect || `${basePath}/`} /></div></div></div>;
}

function SignUpPage() {
  return <div className="ql-noise flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] p-4 md:p-8"><div className="w-full max-w-[520px]"><div className="mb-5 flex items-center justify-between"><Logo /><Link href="/" className="text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" data-testid="link-auth-home">Back to overview</Link></div><div className="ql-card overflow-hidden p-3 md:p-5"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/onboarding`} /></div></div></div>;
}

function Onboarding({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const [, setLocation] = useLocation();
  const [level, setLevel] = useState<Exclude<LearningLevel, ''>>((learner.learningLevel || 'beginner') as Exclude<LearningLevel, ''>);
  const options: { id: Exclude<LearningLevel, ''>; icon: string; title: string; copy: string }[] = [
    { id: 'beginner', icon: '01', title: 'Complete beginner', copy: "I don't know anything yet." },
    { id: 'basic', icon: '02', title: 'Basic knowledge', copy: 'I know what qubits and gates are.' },
    { id: 'intermediate', icon: '03', title: 'Intermediate', copy: 'I can build basic quantum circuits.' },
    { id: 'advanced', icon: '04', title: 'Advanced', copy: 'I already understand quantum algorithms.' },
  ];
  const finish = () => { setLearner({ ...learner, learningLevel: level }); setLocation('/dashboard'); };
  return <div className="ql-noise min-h-[100dvh] bg-[hsl(var(--background))] p-5 md:p-10"><div className="mx-auto max-w-3xl"><div className="flex items-center justify-between"><Logo /><span className="ql-kicker">First lab setup</span></div><div className="mt-16 max-w-2xl"><p className="ql-kicker">Welcome to QuantumLearn</p><h1 className="ql-serif mt-3 text-5xl leading-[.98] tracking-[-.05em] md:text-7xl">Let’s find your starting point.</h1><p className="mt-6 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">This helps us recommend the right first experiment. You can explore every topic at any time.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-2">{options.map((option) => <button key={option.id} onClick={() => setLevel(option.id)} className={`ql-card p-5 text-left transition-transform hover:-translate-y-1 ${level === option.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)] shadow-[0_0_0_2px_hsl(var(--primary)/.18)]' : ''}`} data-testid={`button-onboarding-${option.id}`}><div className="flex items-start justify-between"><span className="ql-mono text-xs text-[hsl(var(--accent))]">{option.icon}</span><span className={`size-4 rounded-full border-2 ${level === option.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`} /></div><h2 className="mt-8 text-lg font-black">{option.title}</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{option.copy}</p></button>)}</div><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[hsl(var(--muted-foreground))]">Your level personalizes recommendations; it never locks content.</p><button onClick={finish} className="ql-button ql-button-primary" data-testid="button-finish-onboarding">Open my learning path <ArrowRight size={16} /></button></div></div></div>;
}

function ProfilePage({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const { user } = useUser();
  const [name, setName] = useState(learner.name || user?.fullName || '');
  const [saved, setSaved] = useState(false);
  const save = async () => {
    const nextName = name.trim() || learner.name || 'Learner';
    if (user && nextName !== user.fullName) await user.update({ firstName: nextName, lastName: '' });
    setLearner({ ...learner, name: nextName });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const levelLabel = learner.learningLevel ? learner.learningLevel[0].toUpperCase() + learner.learningLevel.slice(1) : 'Not selected';
  return <div className="ql-rise mx-auto max-w-4xl"><PageTitle kicker="Your account" title="A profile for the work you’re doing." copy="Your identity and learning signals stay connected to your secure account." /><div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]"><section className="ql-card p-6 md:p-8"><div className="flex size-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-2xl font-black text-[hsl(var(--primary-foreground))]">{(user?.fullName || learner.name || 'L').slice(0, 1).toUpperCase()}</div><p className="ql-kicker mt-6">Student account</p><h2 className="mt-2 text-2xl font-black">{user?.fullName || learner.name || 'Learner'}</h2><p className="mt-2 break-all text-sm text-[hsl(var(--muted-foreground))]">{user?.primaryEmailAddress?.emailAddress || learner.email}</p><div className="mt-8 rounded-xl bg-[hsl(var(--muted))] p-4"><p className="ql-kicker">Joined</p><p className="mt-2 text-sm font-bold">{learner.joinedAt ? new Date(learner.joinedAt).toLocaleDateString() : 'Recently'}</p></div></section><section className="ql-card p-6 md:p-8"><p className="ql-kicker">Personal details</p><div className="mt-5"><label className="ql-label" htmlFor="profile-name">Full name</label><input id="profile-name" className="ql-input mt-2" value={name} onChange={(event) => setName(event.target.value)} data-testid="input-profile-name" /></div><div className="mt-5 rounded-xl border border-[hsl(var(--border))] p-4"><p className="ql-kicker">Learning level</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-lg font-black">{levelLabel}</p><Link href="/onboarding" className="text-xs font-black text-[hsl(var(--primary))]" data-testid="link-change-learning-level">Change level</Link></div></div><div className="mt-5 grid grid-cols-3 gap-3"><div><p className="ql-mono text-2xl font-bold">{learner.completed.length}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">lessons</p></div><div><p className="ql-mono text-2xl font-bold">{learner.runs}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">runs</p></div><div><p className="ql-mono text-2xl font-bold">{learner.quizScore || '—'}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">quiz score</p></div></div><button onClick={save} className="ql-button ql-button-primary mt-7" data-testid="button-save-profile">{saved ? <Check size={16} /> : <UserRound size={16} />}{saved ? 'Saved' : 'Save profile'}</button></section></div></div>;
}

function PageTitle({ kicker, title, copy, action }: { kicker: string; title: string; copy: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="ql-kicker mb-3">{kicker}</p><h1 className="ql-serif text-4xl tracking-[-.04em] md:text-5xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p></div>{action}</div>;
}

function Dashboard({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const firstName = learner.name || 'learner';
  const predictionAccuracy = learner.predictionAttempts ? Math.round(learner.predictionCorrect / learner.predictionAttempts * 100) : null;
  const advisor = learner.predictionAttempts === 0 ? { title: 'Start with a prediction', copy: 'Open the Qubit Explorer and make your first call before the simulator reveals the answer.', href: '/qubit-explorer', label: 'Open explorer' } : predictionAccuracy !== null && predictionAccuracy < 60 ? { title: 'Revisit phase and probability', copy: 'Your predictions are useful evidence. Try H, then Z or T, and watch which changes measurement versus phase.', href: '/qubit-explorer', label: 'Run a phase experiment' } : learner.quizScore > 0 && learner.quizScore < 70 ? { title: 'Strengthen the foundations', copy: 'Your circuit intuition is growing. A short practice pass on measurement will make the next run easier.', href: '/learn/measurement', label: 'Review measurement' } : { title: 'Stretch the mental model', copy: 'You have evidence from the lab. Compare a simple qubit experiment with Grover’s interference story.', href: '/algorithms/grover', label: 'Explore Grover' };
  return <div className="ql-rise"><PageTitle kicker="Your lab notebook" title={`Good to see you, ${firstName}.`} copy="One small experiment is enough to move the needle today." action={<div className="flex flex-wrap gap-2"><Link href="/qubit-explorer" className="ql-button ql-button-coral" data-testid="link-open-qubit-explorer"><CircleDot size={16} /> Explore one qubit</Link><Link href="/quantum-lab" className="ql-button ql-button-primary" data-testid="link-open-lab"><FlaskConical size={16} /> Open circuit lab</Link></div>} />
    <section className="grid gap-5 lg:grid-cols-[1.5fr_.8fr]"><div className="relative overflow-hidden rounded-[1.5rem] bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--primary-foreground))] md:p-8"><div className="absolute -right-16 -top-20 size-64 rounded-full border-[28px] border-[hsl(var(--primary)/.2)]" /><div className="relative z-[1]"><div className="flex items-center gap-2 text-[hsl(var(--secondary))]"><Sparkles size={16} /><span className="ql-kicker !text-[hsl(var(--secondary))]">Recommended next</span></div><h2 className="ql-serif mt-5 max-w-lg text-3xl leading-tight md:text-4xl">Find the marked state with Grover's algorithm.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[hsl(43_43%_80%)]">Start with a clean two-qubit canvas, then see how interference turns a spread-out guess into one strong answer.</p><Link href="/algorithms/grover" className="ql-button ql-button-coral mt-6" data-testid="link-recommended-algorithm">Explore Grover <ArrowRight size={16} /></Link></div></div><div className="ql-card p-6"><div className="flex items-center justify-between"><p className="ql-kicker">Learning rhythm</p><span className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--secondary)/.38)]"><Zap size={17} /></span></div><p className="mt-4 ql-serif text-4xl">{learner.streak} <span className="font-sans text-sm font-bold">day streak</span></p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Your curiosity is showing up.</p><div className="mt-8 grid grid-cols-7 gap-1.5">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <div key={`${day}-${index}`} className="text-center"><div className={`mx-auto mb-2 size-7 rounded-full ${index < 3 ? 'bg-[hsl(var(--primary))]' : index === 3 ? 'border-2 border-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`} /> <span className="ql-mono text-[9px] text-[hsl(var(--muted-foreground))]">{day}</span></div>)}</div></div></section>
    <section className="mt-5 grid gap-5 md:grid-cols-3"><div className="ql-card p-5"><p className="ql-kicker">Concepts explored</p><p className="mt-3 ql-serif text-4xl">{learner.completed.length}<span className="text-xl text-[hsl(var(--muted-foreground))]"> / 7</span></p><div className="ql-progress mt-4"><span style={{ width: `${Math.max(7, learner.completed.length / 7 * 100)}%` }} /></div><Link href="/learn" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[hsl(var(--primary))]" data-testid="link-dashboard-learn">View lessons <ChevronRight size={14} /></Link></div><div className="ql-card p-5"><p className="ql-kicker">Circuit runs</p><p className="mt-3 ql-serif text-4xl">{learner.runs}</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Local simulations, kept on this device.</p><Link href="/quantum-lab" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[hsl(var(--primary))]" data-testid="link-dashboard-runs">Run a circuit <ChevronRight size={14} /></Link></div><div className="ql-card border-[hsl(var(--accent)/.4)] bg-[hsl(6_72%_65%/.09)] p-5"><p className="ql-kicker !text-[hsl(var(--accent))]">Practice score</p><p className="mt-3 ql-serif text-4xl">{learner.quizScore ? `${learner.quizScore}%` : '—'}</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">A score is just a clue about what to revisit.</p><Link href="/quiz" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[hsl(var(--accent))]" data-testid="link-dashboard-quiz">Try a challenge <ChevronRight size={14} /></Link></div></section>
     <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><div className="ql-card p-6"><div className="flex items-start justify-between gap-4"><div><p className="ql-kicker">Your quantum learning advisor</p><h2 className="mt-2 text-2xl font-black">{advisor.title}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">{advisor.copy}</p></div><Sparkles size={19} className="shrink-0 text-[hsl(var(--accent))]" /></div><Link href={advisor.href} className="ql-button ql-button-quiet mt-5" data-testid="link-advisor-recommendation">{advisor.label} <ArrowRight size={15} /></Link></div><div className="ql-card p-6"><div className="flex items-center justify-between"><div><p className="ql-kicker">Evidence so far</p><h2 className="mt-2 text-2xl font-black">Small signals, useful clues.</h2></div><BarChart3 size={19} className="text-[hsl(var(--primary))]" /></div><div className="mt-5 grid grid-cols-3 gap-3"><div><p className="ql-mono text-2xl font-bold">{learner.runs}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">runs</p></div><div><p className="ql-mono text-2xl font-bold">{predictionAccuracy === null ? '—' : `${predictionAccuracy}%`}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">prediction</p></div><div><p className="ql-mono text-2xl font-bold">{learner.quizScore || '—'}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">quiz score</p></div></div></div></section>
     <section className="mt-10"><div className="mb-4 flex items-center justify-between"><div><p className="ql-kicker">The learning loop</p><h2 className="mt-2 text-2xl font-black">Pick up where you are</h2></div><Link href="/progress" className="text-xs font-black text-[hsl(var(--primary))]" data-testid="link-dashboard-progress">See all progress <ArrowRight size={14} className="ml-1 inline" /></Link></div><div className="ql-mobile-scroll flex gap-4 pb-2">{[{ label: 'Learn', title: 'Qubits & superposition', meta: '8 min', href: '/learn/qubits', icon: BookOpen }, { label: 'Predict', title: 'One qubit, one clear question', meta: 'Explorer', href: '/qubit-explorer', icon: CircleDot }, { label: 'Build', title: 'Your first interference pattern', meta: 'Lab', href: '/quantum-lab', icon: FlaskConical }, { label: 'Practice', title: 'Amplitude or probability?', meta: '3 questions', href: '/quiz', icon: Target }].map((item) => { const ItemIcon = item.icon; return <Link href={item.href} key={item.title} className="ql-card min-w-[245px] flex-1 p-5 transition-transform hover:-translate-y-1" data-testid={`card-loop-${item.label.toLowerCase()}`}><div className="flex items-center justify-between"><span className="ql-kicker">{item.label}</span><ItemIcon size={17} className="text-[hsl(var(--primary))]" /></div><h3 className="mt-8 text-lg font-black">{item.title}</h3><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{item.meta}</p></Link>; })}</div></section>
  </div>;
}

function Learn({ learner }: { learner: Learner }) {
  return <div className="ql-rise"><PageTitle kicker="Fundamentals" title="Build the mental model first." copy="Short, visual lessons that make each new gate feel less mysterious." action={<div className="flex flex-wrap items-center gap-2"><Link href="/qubit-explorer" className="ql-button ql-button-coral" data-testid="link-learn-qubit-explorer"><CircleDot size={15} /> Try prediction lab</Link><div className="flex items-center gap-2 rounded-full bg-[hsl(var(--secondary)/.35)] px-3 py-2 text-xs font-bold"><GraduationCap size={15} /> {learner.completed.length}/7 concepts explored</div></div>} /><div className="grid gap-4 md:grid-cols-2">{topics.map((topic, index) => { const done = learner.completed.includes(topic.id); return <Link href={`/learn/${topic.id}`} key={topic.id} className={`ql-card group relative overflow-hidden p-6 transition-transform hover:-translate-y-1 ${index === 0 ? 'md:col-span-2 md:flex md:items-end md:justify-between md:p-8' : ''}`} data-testid={`card-lesson-${topic.id}`}><div className={`absolute right-0 top-0 size-32 rounded-full ${index % 2 ? 'bg-[hsl(var(--secondary)/.24)]' : 'bg-[hsl(var(--primary)/.08)]'} -translate-y-1/2 translate-x-1/2`} /><div className="relative"><div className="flex items-center gap-2"><span className="ql-kicker">{topic.tag}</span>{done && <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--primary)/.12)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--primary))]"><Check size={11} /> Done</span>}</div><h2 className={`mt-4 max-w-lg font-black tracking-[-.03em] ${index === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>{topic.title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{topic.copy}</p></div><div className="relative mt-6 flex items-center justify-between gap-5 text-xs font-bold text-[hsl(var(--muted-foreground))] md:mt-0"><span>{topic.time} read</span><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--primary))] transition-colors group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))]"><ArrowRight size={16} /></span></div></Link>; })}</div><div className="mt-8 rounded-2xl border border-dashed border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary)/.05)] p-5 text-sm text-[hsl(var(--muted-foreground))]"><Lightbulb className="mb-3 text-[hsl(var(--primary))]" size={19} /><p><strong className="text-[hsl(var(--foreground))]">Suggested rhythm:</strong> read one lesson, then open the lab and reproduce one idea yourself. The memory sticks when your hands get involved.</p></div></div>;
}

function LearnDetail({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const { topic } = useParams<{ topic: string }>();
  const current = topics.find((item) => item.id === topic) || topics[0];
  const [location, setLocation] = useLocation();
  const done = learner.completed.includes(current.id);
  const markDone = () => { if (!done) setLearner({ ...learner, completed: [...learner.completed, current.id] }); };
  return <div className="ql-rise mx-auto max-w-4xl"><Link href="/learn" className="mb-8 inline-flex items-center gap-2 text-xs font-black text-[hsl(var(--muted-foreground))]" data-testid="link-back-lessons">← All fundamentals</Link><div className="mb-8"><p className="ql-kicker">{current.tag} · {current.time}</p><h1 className="ql-serif mt-3 text-5xl leading-[.98] tracking-[-.05em] md:text-7xl">{current.title}</h1></div><div className="ql-card overflow-hidden"><div className="ql-grid flex min-h-[240px] items-center justify-center bg-[hsl(174_58%_35%/.06)] p-8"><div className="relative flex size-36 items-center justify-center rounded-full border border-dashed border-[hsl(var(--primary)/.6)] bg-[hsl(var(--card))] shadow-[0_0_0_18px_hsl(var(--primary)/.06),0_0_0_36px_hsl(var(--primary)/.04)]"><span className="ql-serif text-5xl text-[hsl(var(--primary))]">ψ</span><span className="absolute -right-14 top-2 rounded-lg bg-[hsl(var(--accent))] px-2 py-1 text-xs font-black text-[hsl(var(--accent-foreground))]">possible</span><span className="absolute -bottom-3 -left-14 rounded-lg bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-black">not certain</span></div></div><div className="p-6 md:p-10"><p className="text-lg leading-8 text-[hsl(var(--foreground))]">{current.id === 'qubits' ? 'A qubit is not simply a tiny version of a bit. Before measurement, its state can be a carefully weighted combination of 0 and 1. The weights are called amplitudes.' : current.id === 'measurement' ? 'Measurement is the moment a quantum state becomes an ordinary result. Squaring an amplitude gives the chance of seeing its matching bitstring. The simulator below does exactly that.' : current.id === 'entanglement' ? 'Entanglement links the description of two qubits so tightly that measuring one gives information about the other. It is a relationship, not a faster-than-light message.' : 'Quantum computers work with quantum states, then use gates to shape those states before measuring them. The trick is not magic: it is linear algebra made programmable.'}</p><div className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-[hsl(var(--muted))] p-4"><p className="ql-kicker">Keep this picture</p><p className="mt-2 text-sm leading-6">A circuit is a recipe. Gates change the recipe’s state. Measurement checks the finished dish.</p></div><div className="rounded-xl bg-[hsl(var(--secondary)/.35)] p-4"><p className="ql-kicker">Try it with your hands</p><p className="mt-2 text-sm leading-6">Open the lab, place an H gate on q₀, and run it. You should see two equally likely outcomes.</p></div></div><div className="mt-9 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">{done ? 'Lesson saved to your notebook.' : 'A two-minute experiment is waiting.'}</span><div className="flex gap-2"><button onClick={markDone} className={`ql-button ${done ? 'ql-button-quiet' : 'ql-button-primary'}`} data-testid="button-complete-lesson">{done ? <Check size={16} /> : <Award size={16} />}{done ? 'Completed' : 'Mark complete'}</button><Link href="/quantum-lab" className="ql-button ql-button-coral" data-testid="link-lesson-lab">Open lab <ArrowRight size={16} /></Link></div></div></div></div></div>;
}

function Algorithms() {
  return <div className="ql-rise"><PageTitle kicker="Algorithm library" title="Big ideas, small experiments." copy="Pick an algorithm, learn the intuition, then open the circuit and make it misbehave." /><div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">{algorithms.map((algorithm, index) => <Link href={`/algorithms/${algorithm.id}`} key={algorithm.id} className={`ql-card group relative overflow-hidden p-6 transition-transform hover:-translate-y-1 ${index === 0 ? 'lg:row-span-2 lg:p-8' : ''}`} data-testid={`card-algorithm-${algorithm.id}`}><div className={`absolute -right-16 -top-16 size-48 rounded-full ${algorithm.color === 'coral' ? 'bg-[hsl(var(--accent)/.16)]' : algorithm.color === 'gold' ? 'bg-[hsl(var(--secondary)/.5)]' : 'bg-[hsl(var(--primary)/.12)]'}`} /><div className="relative flex h-full flex-col"><div className="flex items-center justify-between"><span className="ql-kicker">{algorithm.level}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{algorithm.time}</span></div><div className="mt-auto pt-16"><div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[hsl(var(--foreground))] text-[hsl(var(--secondary))]"><BrainCircuit size={23} /></div><h2 className={`font-black tracking-[-.04em] ${index === 0 ? 'text-4xl' : 'text-2xl'}`}>{algorithm.name}</h2><p className="mt-3 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{algorithm.copy}</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[hsl(var(--primary))]">Open algorithm <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span></div></div></Link>)}</div><div className="mt-8 flex items-start gap-3 rounded-2xl border border-[hsl(var(--border))] p-5"><Target size={18} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" /><p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]"><strong className="text-[hsl(var(--foreground))]">A note for beginners:</strong> algorithms are recipes, not riddles. You do not need to memorize every gate to understand what a recipe is trying to cook.</p></div></div>;
}

function AlgorithmDetail() {
  const { algorithm } = useParams<{ algorithm: string }>();
  const item = algorithms.find((entry) => entry.id === algorithm) || algorithms[0];
  const isGrover = item.id === 'grover';
  return <div className="ql-rise mx-auto max-w-5xl"><Link href="/algorithms" className="mb-8 inline-flex items-center gap-2 text-xs font-black text-[hsl(var(--muted-foreground))]" data-testid="link-back-algorithms">← Algorithm library</Link><div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><div><p className="ql-kicker">{item.level} algorithm · {item.time}</p><h1 className="ql-serif mt-4 text-5xl leading-[.94] tracking-[-.05em] md:text-7xl">{item.name}</h1><p className="mt-6 text-base leading-7 text-[hsl(var(--muted-foreground))]">{isGrover ? "Imagine looking for one marked card in a deck. Grover's algorithm uses interference to make the right card more likely to appear." : item.copy}</p><Link href="/quantum-lab" className="ql-button ql-button-primary mt-7" data-testid="link-algorithm-lab">Try it in the lab <FlaskConical size={16} /></Link></div><div className="ql-card ql-grid p-6"><div className="mb-5 flex items-center justify-between"><p className="ql-mono text-[10px] text-[hsl(var(--muted-foreground))]">ALGORITHM SHAPE</p><span className="rounded-full bg-[hsl(var(--accent)/.15)] px-2 py-1 text-[10px] font-black text-[hsl(var(--accent))]">{isGrover ? 'AMPLIFY' : 'CORRELATE'}</span></div><div className="flex items-center gap-2 overflow-x-auto pb-2">{(isGrover ? ['H', 'H', 'ORACLE', 'DIFFUSE', 'MEASURE'] : ['PREPARE', 'ENTANGLE', 'OPERATE', 'MEASURE']).map((step, index) => <div key={step} className="flex shrink-0 items-center gap-2"><div className={`flex h-14 items-center justify-center rounded-xl border px-3 text-xs font-black ${index === 2 ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}>{step}</div>{index < (isGrover ? 4 : 3) && <ArrowRight size={14} className="text-[hsl(var(--muted-foreground))]" />}</div>)}</div></div></div><section className="mt-12 grid gap-5 md:grid-cols-3">{[['01', 'Spread', 'Put the system into a fair mix of possibilities.'], ['02', 'Mark', 'Flip the phase of the answer without looking at it.'], ['03', 'Amplify', 'Interference makes the marked answer stand out.']].map(([number, title, copy]) => <div className="ql-card p-5" key={number}><span className="ql-mono text-xs text-[hsl(var(--accent))]">{number}</span><h2 className="mt-6 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p></div>)}</section><div className="mt-8 rounded-2xl bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--primary-foreground))] md:p-8"><div className="flex items-start gap-4"><Lightbulb className="mt-1 shrink-0 text-[hsl(var(--secondary))]" /><div><h2 className="text-xl font-black">What to watch for</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(43_43%_80%)]">{isGrover ? 'The answer is not “checked” directly. It wins because the wrong possibilities cancel and the right possibility gets amplified. That is the quantum move.' : 'Track which information is local and which information lives in the relationship between qubits. That distinction is the useful part.'}</p></div></div></div></div>;
}

function GateButton({ name, onClick }: { name: GateName; onClick: () => void }) {
  return <button onClick={onClick} className={`flex size-11 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black transition-transform hover:-translate-y-1 ${name === 'X' || name === 'DIFF' ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]' : 'border-[hsl(var(--primary)/.5)] bg-[hsl(var(--primary)/.06)] text-[hsl(var(--primary))]'}`} data-testid={`button-add-gate-${name.toLowerCase()}`}>{name}</button>;
}

function ProbabilityChart({ probabilities }: { probabilities: number[] }) {
  const visible = probabilities.map((probability, index) => ({ probability, index })).filter(({ probability }) => probability > .0001);
  return <div className="space-y-3" data-testid="chart-probabilities">{visible.length ? visible.map(({ probability, index }) => <div key={index} className="grid grid-cols-[52px_1fr_48px] items-center gap-3 text-xs"><span className="ql-mono text-[hsl(var(--muted-foreground))]">|{index.toString(2).padStart(3, '0')}⟩</span><div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className={`h-full rounded-full ${index === visible.reduce((best, current) => current.probability > best.probability ? current : best).index ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary))]'}`} style={{ width: `${Math.max(1, probability * 100)}%` }} /></div><span className="ql-mono text-right font-bold">{Math.round(probability * 100)}%</span></div>) : <p className="text-sm text-[hsl(var(--muted-foreground))]">Run the circuit to see measured probabilities.</p>}</div>;
}

type SingleGate = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T';
const singleGates: SingleGate[] = ['H', 'X', 'Y', 'Z', 'S', 'T'];
const gateNotes: Record<SingleGate, { title: string; copy: string; answer: string }> = {
  H: { title: 'Hadamard', copy: 'Splits a definite |0⟩ into an equal superposition. The amplitudes are real and positive.', answer: 'superposition' },
  X: { title: 'Pauli-X', copy: 'A bit flip. It swaps the |0⟩ and |1⟩ amplitudes.', answer: 'flipped' },
  Y: { title: 'Pauli-Y', copy: 'A bit flip with a quarter-turn of phase. Starting from |0⟩, the probability still moves to |1⟩.', answer: 'flipped' },
  Z: { title: 'Pauli-Z', copy: 'A phase flip. From |0⟩ it changes no probability, but it matters after a superposition.', answer: 'same-probability' },
  S: { title: 'S phase', copy: 'Adds a 90° phase to the |1⟩ component. From |0⟩, probabilities stay exactly the same.', answer: 'same-probability' },
  T: { title: 'T phase', copy: 'Adds a 45° phase to the |1⟩ component. Phase is invisible to a direct measurement of |0⟩.', answer: 'same-probability' },
};

function simulateSingle(gate: SingleGate) {
  const matrix = gateMatrix[gate];
  const state = [cx(1, 0), cx(0, 0)];
  return [
    add(mul(matrix[0][0], state[0]), mul(matrix[0][1], state[1])),
    add(mul(matrix[1][0], state[0]), mul(matrix[1][1], state[1])),
  ];
}

function formatComplex(value: Complex) {
  const re = Math.abs(value.re) < .0005 ? 0 : value.re;
  const im = Math.abs(value.im) < .0005 ? 0 : value.im;
  if (im === 0) return re.toFixed(3);
  if (re === 0) return `${im.toFixed(3)}i`;
  return `${re.toFixed(3)} ${im >= 0 ? '+' : '−'} ${Math.abs(im).toFixed(3)}i`;
}

function BlochSphere({ state }: { state: Complex[] }) {
  const alpha = state[0];
  const beta = state[1];
  const x = 2 * (alpha.re * beta.re + alpha.im * beta.im);
  const y = 2 * (alpha.re * beta.im - alpha.im * beta.re);
  const z = magnitude2(alpha) - magnitude2(beta);
  const left = `${50 + x * 38}%`;
  const top = `${50 - z * 34}%`;
  const vectorLength = Math.max(5, Math.hypot(x * 38, z * 34));
  const vectorAngle = Math.atan2(-z * 34, x * 38) * 180 / Math.PI;
  return <div className="ql-bloch-wrap" data-testid="visual-bloch-sphere">
    <div className="ql-bloch-sphere" aria-label={`Bloch sphere state x ${x.toFixed(2)}, y ${y.toFixed(2)}, z ${z.toFixed(2)}`}>
      <span className="ql-bloch-ring ql-bloch-ring-a" /><span className="ql-bloch-ring ql-bloch-ring-b" />
      <span className="ql-bloch-axis ql-bloch-axis-x" /><span className="ql-bloch-axis ql-bloch-axis-z" />
      <span className="ql-bloch-label ql-bloch-label-top">|0⟩</span><span className="ql-bloch-label ql-bloch-label-bottom">|1⟩</span>
      <span className="ql-bloch-vector" style={{ width: `${vectorLength}%`, transform: `rotate(${vectorAngle}deg)` }} />
      <span className="ql-bloch-dot" style={{ left, top }} />
      <span className="ql-bloch-center" />
    </div>
    <div className="mt-3 flex justify-between px-2 text-[10px] text-[hsl(var(--muted-foreground))]"><span>x {x.toFixed(2)}</span><span>y {y.toFixed(2)}</span><span>z {z.toFixed(2)}</span></div>
  </div>;
}

function TutorChips({ onSelect }: { onSelect: (prompt: string) => void }) {
  const chips = ['Explain simply', 'Step-by-step', 'Give me a hint', 'Explain mathematically', 'Explain my circuit', 'Quiz me', 'Challenge me'];
  return <div className="flex flex-wrap gap-2" data-testid="tutor-mode-chips">{chips.map((chip) => <button key={chip} onClick={() => onSelect(chip)} className="ql-chip" data-testid={`button-tutor-mode-${chip.toLowerCase().replaceAll(' ', '-')}`}>{chip}</button>)}</div>;
}

function QubitExplorer({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const [selectedGate, setSelectedGate] = useState<SingleGate>('H');
  const [prediction, setPrediction] = useState('');
  const [ran, setRan] = useState(false);
  const [lastGate, setLastGate] = useState<SingleGate | null>(null);
  const [why, setWhy] = useState('');
  const actual = useMemo(() => simulateSingle(selectedGate), [selectedGate]);
  const probabilities = actual.map(magnitude2);
  const accuracy = learner.predictionAttempts ? Math.round(learner.predictionCorrect / learner.predictionAttempts * 100) : 0;
  const predictionOptions = [
    { id: 'superposition', label: 'A balanced superposition' },
    { id: 'flipped', label: 'The qubit flips to |1⟩' },
    { id: 'same-probability', label: 'Probabilities stay at |0⟩' },
  ];
  const run = () => {
    if (!prediction) return;
    const correct = prediction === gateNotes[selectedGate].answer;
    setLearner({ ...learner, runs: learner.runs + 1, predictionAttempts: learner.predictionAttempts + 1, predictionCorrect: learner.predictionCorrect + (correct ? 1 : 0) });
    setLastGate(selectedGate);
    setRan(true);
    setWhy(correct ? 'Good prediction. The simulator agrees: your mental model matches the matrix for this gate.' : `The simulator gives ${Math.round(probabilities[0] * 100)}% |0⟩ and ${Math.round(probabilities[1] * 100)}% |1⟩. Compare that with your prediction, then try the gate again after H to make phase changes visible.`);
  };
  const reset = () => { setPrediction(''); setRan(false); setLastGate(null); setWhy(''); setSelectedGate('H'); };
  const chooseChip = (prompt: string) => setWhy(prompt === 'Explain mathematically' ? `The ${selectedGate} matrix transforms [1, 0]ᵀ into [${formatComplex(actual[0])}, ${formatComplex(actual[1])}]ᵀ. Measurement probabilities are the squared magnitudes of those amplitudes.` : prompt === 'Give me a hint' ? gateNotes[selectedGate].copy : `${prompt}: ${gateNotes[selectedGate].copy}`);
  return <div className="ql-rise">
    <PageTitle kicker="Interactive single-qubit lab" title="Predict the state. Then check the math." copy="Start at |0⟩, choose one gate, make a call, and run the real local simulator. The result is computed in your browser — never invented by a tutor." action={<Link href="/quantum-lab" className="ql-button ql-button-quiet" data-testid="link-explorer-circuit-lab"><FlaskConical size={16} /> Open circuit lab</Link>} />
    <div className="mb-5 grid gap-4 md:grid-cols-4">
      {[['01', 'Learn', 'What the gate changes'], ['02', 'Predict', 'Commit before running'], ['03', 'Run', 'Use local amplitudes'], ['04', 'Explain', 'Connect cause to result']].map(([number, title, copy], index) => <div key={number} className={`ql-step ${index === 0 || (index === 1 && selectedGate) ? 'ql-step-active' : ''}`}><span className="ql-mono text-[10px]">{number}</span><strong>{title}</strong><span>{copy}</span></div>)}
    </div>
    <div className="grid gap-5 xl:grid-cols-[.86fr_1.14fr]">
      <section className="ql-card p-5 md:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="ql-kicker">Choose your change</p><h2 className="mt-2 text-2xl font-black">What should happen to |0⟩?</h2></div><button onClick={reset} className="ql-button ql-button-quiet px-3" aria-label="Reset qubit experiment" data-testid="button-reset-qubit"><RotateCcw size={14} /> Reset</button></div>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">{singleGates.map((gate) => <button key={gate} onClick={() => { setSelectedGate(gate); setPrediction(''); setRan(false); setWhy(''); }} className={`ql-gate-choice ${selectedGate === gate ? 'ql-gate-choice-active' : ''}`} aria-label={`Choose ${gate} gate`} data-testid={`button-explorer-gate-${gate.toLowerCase()}`}><span>{gate}</span><small>{gateNotes[gate].title}</small></button>)}</div>
        <div className="mt-6 rounded-2xl bg-[hsl(var(--muted)/.7)] p-4"><p className="ql-kicker">Gate note</p><p className="mt-2 text-sm leading-6">{gateNotes[selectedGate].copy}</p></div>
        <div className="mt-6 border-t border-[hsl(var(--border))] pt-6"><p className="ql-kicker">Before you run</p><p className="mt-2 text-lg font-black">Predict the measurement pattern.</p><div className="mt-4 space-y-2">{predictionOptions.map((option) => <button key={option.id} onClick={() => setPrediction(option.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${prediction === option.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'}`} data-testid={`button-prediction-${option.id}`}><span className={`flex size-5 items-center justify-center rounded-full border ${prediction === option.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]' : 'border-[hsl(var(--muted-foreground))]'}`}>{prediction === option.id && <Check size={12} className="text-[hsl(var(--primary-foreground))]" />}</span>{option.label}</button>)}</div><button onClick={run} disabled={!prediction} className="ql-button ql-button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-run-qubit-experiment"><Play size={16} /> Run local experiment</button></div>
      </section>
      <section className="space-y-5">
        <div className="ql-card overflow-hidden"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5"><div><p className="ql-kicker">State inspector</p><h2 className="mt-1 text-xl font-black">The qubit, in full</h2></div><span className={`ql-status ${ran ? 'ql-status-live' : ''}`}>{ran ? 'RESULT READY' : 'AWAITING RUN'}</span></div><div className="grid gap-5 p-5 md:grid-cols-[.8fr_1.2fr] md:p-7"><div><div className="rounded-2xl bg-[hsl(231_26%_18%)] p-5 text-[hsl(var(--primary-foreground))]"><p className="ql-mono text-[10px] text-[hsl(var(--secondary))]">AMPLITUDES</p><div className="mt-5 space-y-3 font-mono text-sm"><div className="flex justify-between"><span>α · |0⟩</span><strong>{ran ? formatComplex(actual[0]) : '1.000'}</strong></div><div className="flex justify-between"><span>β · |1⟩</span><strong>{ran ? formatComplex(actual[1]) : '0.000'}</strong></div></div><div className="mt-5 border-t border-white/15 pt-4 text-xs text-[hsl(43_43%_78%)]">{ran ? probabilities[0].toFixed(3) : '1.000'} chance of |0⟩ · {ran ? probabilities[1].toFixed(3) : '0.000'} chance of |1⟩</div></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-[hsl(var(--border))] p-3"><p className="ql-kicker">|0⟩</p><p className="mt-2 ql-mono text-lg font-bold">{ran ? `${Math.round(probabilities[0] * 100)}%` : '100%'}</p></div><div className="rounded-xl border border-[hsl(var(--border))] p-3"><p className="ql-kicker">|1⟩</p><p className="mt-2 ql-mono text-lg font-bold">{ran ? `${Math.round(probabilities[1] * 100)}%` : '0%'}</p></div></div></div><div><BlochSphere state={ran ? actual : [cx(1, 0), cx(0, 0)]} /><div className="mt-3 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Eye size={14} className="text-[hsl(var(--primary))]" /> Vector position is calculated from α and β, not a decorative preset.</div></div></div></div>
        {ran && <div className="ql-card ql-result-card p-5 md:p-6" data-testid="qubit-result-feedback"><div className="flex items-start gap-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${prediction === gateNotes[selectedGate].answer ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--accent))]'} text-[hsl(var(--primary-foreground))]`}>{prediction === gateNotes[selectedGate].answer ? <Check size={17} /> : <GitCompare size={17} />}</div><div><p className="ql-kicker">{prediction === gateNotes[selectedGate].answer ? 'Prediction confirmed' : 'Prediction to revisit'}</p><h3 className="mt-1 text-lg font-black">{lastGate} produced {Math.round(probabilities[0] * 100)} / {Math.round(probabilities[1] * 100)}</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{why}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-[hsl(var(--border))] pt-4"><div><p className="ql-kicker">Your prediction</p><p className="mt-1 text-sm font-bold">{predictionOptions.find((option) => option.id === prediction)?.label}</p></div><div><p className="ql-kicker">Lifetime accuracy</p><p className="mt-1 ql-mono text-lg font-bold text-[hsl(var(--primary))]">{accuracy}% <span className="font-sans text-[10px] text-[hsl(var(--muted-foreground))]">({learner.predictionCorrect}/{learner.predictionAttempts})</span></p></div></div><TutorChips onSelect={chooseChip} /></div>}
      </section>
    </div>
    <div className="mt-5 rounded-2xl border border-dashed border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.05)] p-5"><div className="flex items-start gap-3"><CircleHelp size={18} className="mt-0.5 text-[hsl(var(--primary))]" /><p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]"><strong className="text-[hsl(var(--foreground))]">Mini-experiment loop:</strong> Choose a gate → predict → run → observe the amplitudes and Bloch vector → ask why. Try H, then T: phase becomes visible when you create a superposition first.</p></div></div>
  </div>;
}

function QuantumLab({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [ran, setRan] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [lastRun, setLastRun] = useState<{ gates: Gate[]; probabilities: number[] } | null>(null);
  const result = useMemo(() => simulate(gates), [gates]);
  const addGate = (name: GateName) => { setGates((current) => [...current, { id: Date.now() + current.length, name, qubit: selectedQubit }]); setRan(false); setExplanation(''); };
  const run = () => { setLastRun({ gates: gates.map((gate) => ({ ...gate })), probabilities: result.probabilities }); setRan(true); setLearner({ ...learner, runs: learner.runs + 1 }); };
  const loadGrover = () => { setGates([{ id: 1, name: 'H', qubit: 0 }, { id: 2, name: 'H', qubit: 1 }, { id: 3, name: 'CZ', qubit: 0 }, { id: 4, name: 'DIFF', qubit: 0 }]); setLastRun(null); setRan(false); setExplanation(''); };
  const explain = () => { const strongest = result.probabilities.reduce((best, probability, index) => probability > best.probability ? { probability, index } : best, { probability: 0, index: 0 }); setExplanation(gates.length ? `Your circuit applies ${gates.map((gate) => gate.name).join(' → ')}. After those transformations, the most likely result is |${strongest.index.toString(2).padStart(3, '0')}⟩ at ${Math.round(strongest.probability * 100)}%. The simulator starts at |000⟩ and applies each gate with real complex amplitudes.` : 'Add a gate first. I can explain the circuit once there is something to inspect.'); };
  const changed = Boolean(lastRun && JSON.stringify(lastRun.gates.map((gate) => gate.name)) !== JSON.stringify(gates.map((gate) => gate.name)));
  return <div className="ql-rise"><PageTitle kicker="Local quantum lab" title="Make a circuit. See the math." copy="Place gates on a qubit, run the in-browser simulator, and inspect the result. Nothing leaves your device." action={<div className="flex flex-wrap gap-2"><Link href="/qubit-explorer" className="ql-button ql-button-quiet" data-testid="link-lab-explorer"><CircleDot size={16} /> One-qubit explorer</Link><button onClick={loadGrover} className="ql-button ql-button-coral" data-testid="button-load-grover"><Sparkles size={16} /> Load Grover starter</button></div>} /><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="ql-card overflow-hidden"><div className="flex flex-col gap-4 border-b border-[hsl(var(--border))] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="ql-kicker">01 / Build</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Choose a row, then add gates to the end of the circuit.</p></div><button onClick={() => { setGates([]); setLastRun(null); setRan(false); setExplanation(''); }} className="ql-button ql-button-quiet self-start" data-testid="button-reset-circuit"><RotateCcw size={14} /> Reset</button></div><div className="ql-mobile-scroll p-5"><div className="min-w-[620px]"><div className="mb-5 flex items-center gap-2"><span className="ql-mono w-10 text-[10px] text-[hsl(var(--muted-foreground))]">GATE</span>{gates.length ? gates.map((gate) => <span key={gate.id} className="ql-mono flex w-12 justify-center text-[9px] text-[hsl(var(--muted-foreground))]">t{gates.indexOf(gate) + 1}</span>) : <span className="text-xs text-[hsl(var(--muted-foreground))]">Your timeline is empty</span>}</div>{[2, 1, 0].map((qubit) => <button key={qubit} onClick={() => setSelectedQubit(qubit)} className={`mb-4 grid w-full grid-cols-[40px_1fr] items-center gap-2 text-left ${selectedQubit === qubit ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-select-qubit-${qubit}`}><span className="ql-mono text-xs font-bold">q{qubit}</span><span className={`relative flex min-h-[58px] items-center gap-2 rounded-xl border px-2 ${selectedQubit === qubit ? 'border-[hsl(var(--primary)/.5)] bg-[hsl(var(--primary)/.05)]' : 'border-[hsl(var(--border))]'}`}><span className="absolute left-0 right-0 top-1/2 h-px bg-[hsl(var(--border))]" />{gates.map((gate) => <span key={gate.id} className={`relative z-[1] flex size-11 shrink-0 items-center justify-center rounded-xl border-2 bg-[hsl(var(--card))] text-xs font-black ${gate.qubit === qubit || (gate.name === 'CZ' && (qubit === gate.qubit || qubit === (gate.qubit + 1) % 3)) ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] text-transparent'}`}>{gate.qubit === qubit ? gate.name : gate.name === 'CZ' && qubit === (gate.qubit + 1) % 3 ? '●' : ''}</span>)}</span></button>)}</div></div><div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/.45)] p-5"><div className="flex flex-wrap items-center gap-3"><span className="ql-kicker mr-1">Add gate to q{selectedQubit}</span>{(['H', 'X', 'Y', 'Z', 'S', 'T', 'CZ', 'DIFF'] as GateName[]).map((name) => <GateButton key={name} name={name} onClick={() => addGate(name)} />)}</div><p className="mt-3 text-[11px] text-[hsl(var(--muted-foreground))]">H creates a mix. X/Y flip with different phase. Z/S/T change phase. CZ marks two qubits. DIFF is Grover's diffusion step.</p></div></section><section className="space-y-5"><div className="ql-card p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="ql-kicker">02 / Simulate</p><h2 className="mt-1 text-xl font-black">Probability readout</h2></div><span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${ran ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>{ran ? <Check size={12} /> : <span className="size-1.5 rounded-full bg-[hsl(var(--muted-foreground))]" />}{ran ? 'SIMULATED' : 'NOT RUN'}</span></div><div className="mt-6">{ran ? <ProbabilityChart probabilities={result.probabilities} /> : <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-6 text-center"><Play size={21} className="mx-auto text-[hsl(var(--primary))]" /><p className="mt-3 text-sm font-bold">Your result will appear here</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">The simulator uses the circuit above, not a preset result.</p></div>}</div><button onClick={run} disabled={!gates.length} className="ql-button ql-button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-run-simulation"><Play size={16} /> Run local simulation</button>{changed && lastRun && <div className="mt-5 rounded-xl border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.06)] p-4" data-testid="panel-before-after"><div className="flex items-center gap-2"><GitCompare size={15} className="text-[hsl(var(--accent))]" /><p className="text-xs font-black">What changed?</p></div><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">You changed the circuit after the last run. The live bars below are the new predicted result; compare it with the saved run.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="ql-kicker">Before · {lastRun.gates.map((gate) => gate.name).join(' → ')}</p><div className="mt-2"><ProbabilityChart probabilities={lastRun.probabilities} /></div></div><div><p className="ql-kicker !text-[hsl(var(--accent))]">After · {gates.map((gate) => gate.name).join(' → ')}</p><div className="mt-2"><ProbabilityChart probabilities={result.probabilities} /></div></div></div></div>}</div><div className="ql-card p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="ql-kicker">03 / Analyze</p><h2 className="mt-1 text-xl font-black">Ask why</h2></div><Lightbulb size={19} className="text-[hsl(var(--accent))]" /></div><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">No black box. Get a plain-language read of the gates you placed.</p>{explanation && <div className="mt-4 rounded-xl bg-[hsl(var(--secondary)/.28)] p-4 text-sm leading-6" data-testid="text-circuit-explanation">{explanation}</div>}<button onClick={explain} className="ql-button ql-button-quiet mt-4 w-full" data-testid="button-explain-circuit"><MessageCircle size={15} /> Explain this circuit</button></div></section></div></div>;
}

function Quiz({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const questions = [{ prompt: 'What does an H gate do to |0⟩?', choices: ['It guarantees a 1', 'It creates an equal mix of 0 and 1', 'It measures the qubit'], answer: 1 }, { prompt: 'What does measurement return?', choices: ['An amplitude', 'A guaranteed zero', 'A classical outcome sampled by probability'], answer: 2 }, { prompt: 'Why is Grover useful?', choices: ['It amplifies a marked answer', 'It removes all gates', 'It avoids measurement'], answer: 0 }];
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = questions.filter((question, index) => selected[index] === question.answer).length;
  const submit = () => { setSubmitted(true); setLearner({ ...learner, quizScore: Math.round(score / questions.length * 100) }); };
  return <div className="ql-rise mx-auto max-w-4xl"><PageTitle kicker="Practice room" title="A little retrieval goes far." copy="Three gentle questions. Choose an answer, then use the feedback to decide what to revisit." action={<div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--muted-foreground))]"><Target size={16} className="text-[hsl(var(--accent))]" /> 3 questions</div>} /><div className="space-y-4">{questions.map((question, index) => <section className="ql-card p-5 md:p-7" key={question.prompt}><div className="flex items-start gap-4"><span className="ql-mono flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-xs">0{index + 1}</span><div className="flex-1"><h2 className="text-lg font-black">{question.prompt}</h2><div className="mt-5 grid gap-2">{question.choices.map((choice, choiceIndex) => { const isSelected = selected[index] === choiceIndex; const isCorrect = submitted && choiceIndex === question.answer; return <button key={choice} onClick={() => !submitted && setSelected({ ...selected, [index]: choiceIndex })} className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm transition-colors ${isCorrect ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]' : isSelected ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.08)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'}`} data-testid={`button-answer-${index}-${choiceIndex}`}><span>{choice}</span>{isCorrect && <Check size={16} className="text-[hsl(var(--primary))]" />}</button>; })}</div>{submitted && <p className={`mt-3 text-xs font-bold ${selected[index] === question.answer ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--accent))]'}`}>{selected[index] === question.answer ? 'That is it. You spotted the key idea.' : `The useful clue: ${question.choices[question.answer]}.`}</p>}</div></div></section>)}</div><div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl bg-[hsl(var(--foreground))] p-5 text-[hsl(var(--primary-foreground))] sm:flex-row sm:items-center"><div><p className="ql-kicker !text-[hsl(var(--secondary))]">Ready to check?</p><p className="mt-1 text-sm text-[hsl(43_43%_80%)]">{submitted ? `You scored ${score} out of ${questions.length}.` : 'Your first answer is a useful data point, not a verdict.'}</p></div><button onClick={submit} disabled={Object.keys(selected).length < questions.length || submitted} className="ql-button ql-button-coral disabled:opacity-40" data-testid="button-submit-quiz">{submitted ? <Check size={16} /> : <Trophy size={16} />}{submitted ? 'Submitted' : 'Submit challenge'}</button></div></div>;
}

function Progress({ learner }: { learner: Learner }) {
  const total = 7;
  const predictionAccuracy = learner.predictionAttempts ? Math.round(learner.predictionCorrect / learner.predictionAttempts * 100) : null;
  return <div className="ql-rise"><PageTitle kicker="Your progress" title="Notice the pattern, not the score." copy="Progress is the trail of experiments you have already made." action={<Link href="/quiz" className="ql-button ql-button-primary" data-testid="link-progress-practice"><Target size={16} /> Practice now</Link>} /><section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><div className="ql-card p-6"><p className="ql-kicker">Foundations</p><p className="mt-4 ql-serif text-5xl">{Math.round(learner.completed.length / total * 100)}<span className="text-2xl">%</span></p><div className="ql-progress mt-5"><span style={{ width: `${Math.max(4, learner.completed.length / total * 100)}%` }} /></div><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{learner.completed.length} of {total} concepts explored</p></div><div className="ql-card p-6"><p className="ql-kicker">Lab notebook</p><p className="mt-4 ql-serif text-5xl">{learner.runs}</p><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">circuits simulated locally</p></div><div className="ql-card border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.05)] p-6"><p className="ql-kicker">Prediction signal</p><p className="mt-4 ql-serif text-5xl">{predictionAccuracy === null ? '—' : predictionAccuracy}<span className="text-2xl">{predictionAccuracy === null ? '' : '%'}</span></p><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{learner.predictionAttempts ? `${learner.predictionCorrect} of ${learner.predictionAttempts} calls matched` : 'Make a call before the run'}</p></div><div className="ql-card bg-[hsl(33_69%_78%/.28)] p-6"><p className="ql-kicker">Practice signal</p><p className="mt-4 ql-serif text-5xl">{learner.quizScore || '—'}<span className="text-2xl">{learner.quizScore ? '%' : ''}</span></p><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{learner.quizScore ? 'Last challenge result' : 'Your first challenge is waiting'}</p></div></section><section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="ql-card p-6"><div className="flex items-center justify-between"><div><p className="ql-kicker">Concept trail</p><h2 className="mt-2 text-xl font-black">Your notebook</h2></div><BookOpen size={18} className="text-[hsl(var(--primary))]" /></div><div className="mt-6 space-y-3">{topics.map((topic, index) => { const done = learner.completed.includes(topic.id); return <div key={topic.id} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/.6)] p-3"><span className={`flex size-7 items-center justify-center rounded-full ${done ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>{done ? <Check size={14} /> : <span className="ql-mono text-[10px]">0{index + 1}</span>}</span><span className={`text-sm font-bold ${done ? '' : 'text-[hsl(var(--muted-foreground))]'}`}>{topic.title}</span><span className="ml-auto text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{done ? 'explored' : 'up next'}</span></div>; })}</div></div><div className="rounded-[1.25rem] bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--primary-foreground))]"><Award className="text-[hsl(var(--secondary))]" size={22} /><h2 className="ql-serif mt-8 text-3xl">Every run is evidence.</h2><p className="mt-3 text-sm leading-6 text-[hsl(43_43%_80%)]">You are building intuition by making predictions and checking them. That is the real skill behind the numbers.</p><Link href="/qubit-explorer" className="ql-button ql-button-coral mt-8" data-testid="link-progress-lab">Make another prediction <ArrowRight size={15} /></Link></div></section></div>;
}

function AiTutor() {
  const [messages, setMessages] = useState([{ from: 'tutor', text: 'Hi. I can help you untangle a quantum idea. What feels fuzzy right now?' }]);
  const [input, setInput] = useState('');
  const send = () => { const question = input.trim(); if (!question) return; const lower = question.toLowerCase(); const answer = lower.includes('superposition') ? 'Superposition means a qubit can have amplitudes for both 0 and 1 before measurement. It is not two classical values you can read at once; measurement samples one result using those amplitudes.' : lower.includes('grover') ? "Grover’s recipe is: spread probability, mark the answer’s phase, then use diffusion to amplify it. The answer wins through interference, not because the circuit secretly checked every card." : lower.includes('measure') ? 'Measurement turns the quantum state into a classical bitstring. The probability of each bitstring is the squared magnitude of its amplitude.' : 'Try asking about one gate or one line of the circuit. For example: “What does H do to |0⟩?” I will keep the answer grounded in the lab.'; setMessages([...messages, { from: 'you', text: question }, { from: 'tutor', text: answer }]); setInput(''); };
   return <div className="ql-rise mx-auto max-w-4xl"><PageTitle kicker="Plain-language tutor" title="Ask the question you almost asked." copy="No jargon parade. Ask about a gate, an outcome, or the bit that does not make sense yet." action={<div className="flex items-center gap-2 rounded-full bg-[hsl(var(--primary)/.1)] px-3 py-2 text-xs font-bold text-[hsl(var(--primary))]"><Sparkles size={15} /> Always learning with you</div>} /><div className="ql-card overflow-hidden"><div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.45)] p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><BrainCircuit size={19} /></div><div><p className="text-sm font-black">QuantumLearn tutor</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Grounded in your current learning path</p></div><span className="ml-auto size-2 rounded-full bg-[hsl(var(--primary))]" /></div></div><div className="min-h-[330px] space-y-4 p-5 md:p-7" data-testid="tutor-message-list">{messages.map((message, index) => <div key={`${message.from}-${index}`} className={`flex ${message.from === 'you' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.from === 'you' ? 'rounded-br-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'rounded-bl-sm bg-[hsl(var(--muted))]'}`} data-testid={`text-tutor-message-${index}`}>{message.text}</div></div>)}</div><div className="border-t border-[hsl(var(--border))] p-4"><p className="ql-label">Choose a tutor mode</p><TutorChips onSelect={(prompt) => setInput(`${prompt}: `)} /><div className="mt-3 flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} className="ql-input" placeholder="Try: what does an H gate do?" data-testid="input-tutor-question" /><button onClick={send} className="ql-button ql-button-primary px-4" aria-label="Send question" data-testid="button-send-tutor"><Send size={16} /></button></div><p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">Tip: mention “superposition”, “Grover”, or “measurement” for a guided explanation.</p></div></div></div>;
}

function NotFoundPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center p-6"><div className="text-center"><p className="ql-kicker">404 / Empty state</p><h1 className="ql-serif mt-3 text-5xl">This path decohered.</h1><Link href="/dashboard" className="ql-button ql-button-primary mt-6" data-testid="link-404-dashboard">Back to the lab <ArrowRight size={16} /></Link></div></div>;
}

function Router({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const [location] = useLocation();
  return <Shell learner={learner}><ErrorBoundary resetKey={location}><Switch><Route path="/dashboard"><Dashboard learner={learner} setLearner={setLearner} /></Route><Route path="/onboarding"><Onboarding learner={learner} setLearner={setLearner} /></Route><Route path="/learn"><Learn learner={learner} /></Route><Route path="/learn/:topic"><LearnDetail learner={learner} setLearner={setLearner} /></Route><Route path="/algorithms"><Algorithms /></Route><Route path="/algorithms/:algorithm"><AlgorithmDetail /></Route><Route path="/quantum-lab"><QuantumLab learner={learner} setLearner={setLearner} /></Route><Route path="/qubit-explorer"><QubitExplorer learner={learner} setLearner={setLearner} /></Route><Route path="/quiz"><Quiz learner={learner} setLearner={setLearner} /></Route><Route path="/progress"><Progress learner={learner} /></Route><Route path="/ai-tutor"><AiTutor /></Route><Route path="/profile"><ProfilePage learner={learner} setLearner={setLearner} /></Route><Route path="/settings"><ProfilePage learner={learner} setLearner={setLearner} /></Route><Route component={NotFoundPage} /></Switch></ErrorBoundary></Shell>;
}

function ProtectedRouter() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [location] = useLocation();
  const [learner, setLearner, ready] = useLearner(user?.id, user);
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return location === '/' ? <Landing /> : <Redirect to={`/sign-in?redirect_url=${encodeURIComponent(location)}`} />;
  if (!ready) return <AuthLoading />;
  if (location === '/') return <Redirect to={learner.learningLevel ? '/dashboard' : '/onboarding'} />;
  return <Router learner={learner} setLearner={setLearner} />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to return to your quantum lab.' } },
      signUp: { start: { title: 'Create your QuantumLearn account', subtitle: 'Keep your experiments and progress together.' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={ProtectedRouter} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;