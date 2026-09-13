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
  Code2,
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
const rawClerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasClerkKey = Boolean(rawClerkPubKey);
const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const clerkPubKey = isLocalhost
  ? rawClerkPubKey
  : publishableKeyFromHost(window.location.hostname, rawClerkPubKey);
const clerkProxyUrl = isLocalhost ? undefined : import.meta.env.VITE_CLERK_PROXY_URL;
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
  { id: 'what-is-quantum', title: 'What is quantum computing?', tag: '01 · Orientation', time: '6 min', copy: 'The big picture: information, physics, and what quantum computers are actually built to do.' },
  { id: 'complex-numbers', title: 'Complex numbers for quantum states', tag: '02 · Mathematics', time: '9 min', copy: 'Read real and imaginary amplitudes without letting the notation become a wall.' },
  { id: 'qubits', title: 'Qubits & superposition', tag: '03 · Foundation', time: '8 min', copy: 'See how one qubit can hold a blend of possibilities.' },
  { id: 'measurement', title: 'Measurement & probability', tag: '04 · Foundation', time: '7 min', copy: 'Turn amplitudes into the probabilities you can actually observe.' },
  { id: 'quantum-states', title: 'State vectors and Dirac notation', tag: '05 · Mathematics', time: '10 min', copy: 'Move between ket notation, vectors, amplitudes, and the computational basis.' },
  { id: 'bloch-sphere', title: 'The Bloch sphere', tag: '06 · Visualization', time: '9 min', copy: 'Use geometry to understand every pure single-qubit state.' },
  { id: 'quantum-gates', title: 'Quantum gates and unitary motion', tag: '07 · Circuits', time: '10 min', copy: 'Understand gates as reversible transformations that preserve probability.' },
  { id: 'pauli-gates', title: 'X, Y, and Z: the Pauli gates', tag: '08 · Gates', time: '8 min', copy: 'Learn bit flips, phase flips, and the axes they rotate around.' },
  { id: 'hadamard-gate', title: 'The Hadamard gate', tag: '09 · Gates', time: '8 min', copy: 'Create, reverse, and reason about equal superpositions.' },
  { id: 'phase-gates', title: 'S, T, and phase', tag: '10 · Gates', time: '9 min', copy: 'See why invisible phase becomes measurable after interference.' },
  { id: 'interference', title: 'Interference and amplitude', tag: '11 · Core idea', time: '10 min', copy: 'Follow amplitudes as they reinforce and cancel.' },
  { id: 'entanglement', title: 'Entanglement', tag: '12 · Core idea', time: '10 min', copy: 'Understand correlations that do not behave like ordinary bits.' },
  { id: 'controlled-gates', title: 'Controlled gates and CNOT', tag: '13 · Circuits', time: '10 min', copy: 'Connect qubits and build conditional quantum operations.' },
  { id: 'quantum-circuits', title: 'Reading and building circuits', tag: '14 · Circuits', time: '12 min', copy: 'Read wires, time steps, registers, controls, and measurements.' },
  { id: 'tensor-products', title: 'Multiple qubits and tensor products', tag: '15 · Mathematics', time: '12 min', copy: 'Scale from one qubit to joint states and exponentially larger spaces.' },
  { id: 'noise-errors', title: 'Noise, decoherence, and errors', tag: '16 · Hardware', time: '10 min', copy: 'Why real qubits lose information and how errors show up in results.' },
  { id: 'error-correction', title: 'Quantum error correction', tag: '17 · Hardware', time: '12 min', copy: 'Protect quantum information without directly copying an unknown state.' },
  { id: 'quantum-hardware', title: 'How quantum computers are built', tag: '18 · Hardware', time: '11 min', copy: 'Compare superconducting, trapped-ion, photonic, and neutral-atom approaches.' },
  { id: 'qiskit-python', title: 'Python and Qiskit fundamentals', tag: '19 · Programming', time: '14 min', copy: 'Translate a circuit into executable Python and inspect the result.' },
  { id: 'quantum-complexity', title: 'Quantum complexity and advantage', tag: '20 · Theory', time: '11 min', copy: 'Understand speedups, query complexity, and why not every task gets faster.' },
  { id: 'grover-intuition', title: "Grover's search algorithm", tag: '21 · Algorithm', time: '18 min', copy: 'Spread, mark, and amplify a target in an unstructured search.' },
  { id: 'quantum-teleportation', title: 'Quantum teleportation', tag: '22 · Algorithm', time: '16 min', copy: 'Move an unknown state using entanglement and two classical bits.' },
  { id: 'deutsch-jozsa', title: 'Deutsch–Jozsa algorithm', tag: '23 · Algorithm', time: '14 min', copy: 'Use interference to distinguish hidden function structure.' },
  { id: 'quantum-applications', title: 'Applications and the road ahead', tag: '24 · Perspective', time: '10 min', copy: 'Survey chemistry, optimization, cryptography, sensing, and responsible expectations.' },
];
const lessonContent: Record<string, { lesson: string; key: string; practice: string }> = {
  'what-is-quantum': { lesson: 'Quantum computing uses quantum states to process information. It is not a faster replacement for every laptop: its promise comes from designing interference patterns that make useful answers more likely.', key: 'The workflow is prepare a state, apply reversible gates, and measure a classical result.', practice: 'Open the circuit lab and run a circuit with no gates, then add H to q0 and compare the distribution.' },
  'complex-numbers': { lesson: 'Quantum amplitudes can be real or complex. A complex value has a real part and an imaginary part, and its squared magnitude gives the contribution to measurement probability.', key: 'The imaginary unit i changes phase; it does not mean a probability is imaginary.', practice: 'In the qubit explorer, compare X with Y. Both move probability to |1⟩, but Y adds a phase.' },
  qubits: { lesson: 'A qubit is represented as α|0⟩ + β|1⟩, where |α|² + |β|² = 1. Before measurement it can have amplitudes for both basis states, but measurement returns one classical result.', key: 'Superposition describes amplitudes, not two readable classical copies of information.', practice: 'Choose H in the qubit explorer and predict the two equally likely outcomes before running it.' },
  measurement: { lesson: 'Measurement samples a basis state according to squared amplitude magnitude. After measurement, the state is projected to the result that was observed.', key: 'Amplitudes interfere first; probabilities are what the detector finally reports.', practice: 'Run H several times conceptually or with the Python code and compare counts with the ideal 50/50 probabilities.' },
  'quantum-states': { lesson: 'Dirac notation writes a state as a ket, such as |0⟩ or |ψ⟩. A column vector stores the same information as amplitudes in a chosen basis.', key: 'Changing the basis changes how the same state is described, not the physical state itself.', practice: 'Translate (|0⟩ + |1⟩)/√2 into its two-component vector and identify each amplitude.' },
  'bloch-sphere': { lesson: 'Every pure single-qubit state can be drawn as a point on the Bloch sphere. The north and south poles are |0⟩ and |1⟩; the equator represents equal-magnitude superpositions with different phases.', key: 'The sphere makes rotations and phase relationships visible, but it does not scale directly to many qubits.', practice: 'Apply H, X, and Z in the qubit explorer and watch how the state description changes.' },
  'quantum-gates': { lesson: 'Quantum gates are unitary transformations: they preserve total probability and are reversible. A circuit is a time-ordered product of these transformations.', key: 'A gate changes amplitudes, and the order of gates matters because most quantum operations do not commute.', practice: 'Run H then X, reset, and run X then H. Compare the final states.' },
  'pauli-gates': { lesson: 'X swaps |0⟩ and |1⟩, Y swaps them while adding imaginary phase, and Z leaves |0⟩ alone while negating the |1⟩ amplitude.', key: 'X, Y, and Z act like rotations around the three Bloch-sphere axes.', practice: 'Try Z from |0⟩, then try H followed by Z to make the phase change affect the geometry.' },
  'hadamard-gate': { lesson: 'Hadamard maps a basis state to an equal superposition and maps that superposition back when applied again. It is the standard doorway into interference.', key: 'H is its own inverse: H² = I.', practice: 'Build H → H in the circuit lab and verify that the original |0⟩ state returns.' },
  'phase-gates': { lesson: 'S adds a π/2 phase and T adds a π/4 phase to |1⟩. A phase may leave immediate probabilities unchanged, yet later interference can reveal it.', key: 'Phase gates are essential because algorithms control relative phase, not just population.', practice: 'Apply H, then T, then H and compare that with H → H.' },
  interference: { lesson: 'When amplitudes meet, they add as complex numbers. Matching signs reinforce; opposite signs cancel. Quantum algorithms arrange this arithmetic so wrong answers fade and useful answers grow.', key: 'Interference is the mechanism behind most quantum speedup stories.', practice: 'Use H → Z → H and compare it with H → H. The middle phase flip changes the final result.' },
  entanglement: { lesson: 'An entangled state cannot be written as a product of independent single-qubit states. In a Bell circuit, H on q0 followed by CNOT creates correlated outcomes 00 and 11.', key: 'Entanglement creates correlations, not faster-than-light communication.', practice: 'Load a two-qubit Bell-style circuit conceptually: H on q0 followed by a controlled operation to q1.' },
  'controlled-gates': { lesson: 'A controlled gate applies its target operation only when a control qubit is |1⟩. CNOT is the most common example and is a building block for entanglement and reversible logic.', key: 'Controls let one quantum state conditionally alter another.', practice: 'In the lab, inspect how CZ touches two rows and how its phase mark changes later interference.' },
  'quantum-circuits': { lesson: 'Read a circuit from left to right: wires hold qubits, columns are time steps, boxes are gates, and measurement maps quantum wires to classical bits.', key: 'Circuit composition is matrix multiplication in the same order the operations occur.', practice: 'Build a short H → X → H circuit and use the explanation panel to connect each step to the output.' },
  'tensor-products': { lesson: 'For n qubits, the state vector has 2ⁿ amplitudes. Tensor products combine local states into joint states and also explain why entanglement cannot always be separated into individual qubit descriptions.', key: 'More qubits enlarge the state space exponentially, which is both the power and the engineering challenge.', practice: 'Compare one-qubit and three-qubit probability readouts in the lab.' },
  'noise-errors': { lesson: 'Real hardware interacts with its environment. Decoherence destroys phase information, while gate and readout errors make results differ from the ideal circuit.', key: 'A simulator can show the ideal algorithm; hardware experiments must account for a noisy channel.', practice: 'Repeat an ideal H experiment and think about why finite samples do not produce exactly 50/50 counts.' },
  'error-correction': { lesson: 'Quantum error correction encodes one logical qubit across several physical qubits and detects error syndromes without directly measuring the protected state.', key: 'You cannot clone an unknown quantum state, so protection uses redundancy and carefully designed parity checks.', practice: 'Explain why correcting a bit flip and correcting a phase flip require different checks.' },
  'quantum-hardware': { lesson: 'Superconducting circuits, trapped ions, neutral atoms, and photons use different physical systems to implement qubits. They trade off speed, connectivity, coherence, and control complexity.', key: 'There is no single best hardware platform for every workload.', practice: 'Choose one platform and list its qubit, gate-control, measurement, and scaling challenges.' },
  'qiskit-python': { lesson: 'Qiskit represents a circuit as Python objects. You create registers, append gates, measure, execute with a simulator, and inspect counts or state information.', key: 'The visual circuit and the Python circuit should describe the same operations in the same order.', practice: 'Copy the Python panel from the qubit explorer, install qiskit and qiskit-aer, and run it locally.' },
  'quantum-complexity': { lesson: 'Quantum complexity asks which problems benefit from quantum resources. A speedup may concern query count, asymptotic runtime, memory, or a practical bottleneck.', key: 'Quantum does not automatically make every classical algorithm faster.', practice: 'Compare Grover’s square-root query improvement with the cost of preparing and measuring the system.' },
  'grover-intuition': { lesson: 'Grover search starts with equal amplitudes, uses an oracle to mark a target phase, then applies diffusion to amplify the marked state. Repeating the iterate increases success up to an optimal point.', key: 'The speedup comes from amplitude amplification, not from reading all candidates at once.', practice: 'Load the Grover starter in the lab and inspect how the probability bars change.' },
  'quantum-teleportation': { lesson: 'Teleportation transfers an unknown state using a shared Bell pair, two local gates and two classical bits. The original state is destroyed, so this is not copying.', key: 'Entanglement provides the resource; classical communication supplies the correction instructions.', practice: 'Write the three stages: create Bell pair, interact with the sender state, measure and apply conditional corrections.' },
  'deutsch-jozsa': { lesson: 'Deutsch–Jozsa distinguishes constant from balanced black-box functions with one quantum query under its promise. Hadamards turn the hidden function structure into a measurable interference pattern.', key: 'The algorithm is a clean demonstration of phase kickback and global interference.', practice: 'Trace the initial Hadamards, oracle, final Hadamards, and the all-zero measurement test.' },
  'quantum-applications': { lesson: 'Promising applications include molecular simulation, materials, optimization heuristics, cryptography, and precision sensing. Many are still research problems, and useful advantage requires capable hardware and carefully chosen workloads.', key: 'Be precise about the problem, data-loading cost, noise, and the baseline when evaluating a quantum claim.', practice: 'Choose one application and explain what quantum subroutine would need to outperform the best classical approach.' },
};
type LessonDeepDive = { meaning: string; mechanics: string; example: string; misconception: string; check: string };
const lessonDeepDive: Record<string, LessonDeepDive> = {
  'what-is-quantum': { meaning: 'Quantum computing is a way to calculate with physical systems whose states follow quantum mechanics. A program prepares amplitudes, transforms them with gates, and measures the final state.', mechanics: 'Gates are reversible transformations. The useful answer is not read from every possibility; the circuit is designed so interference increases the probability of useful outcomes.', example: 'For |0⟩, applying H creates (|0⟩ + |1⟩)/√2. A measurement then returns 0 or 1, not a list containing both.', misconception: 'Quantum does not mean automatically faster. The algorithm, data-loading cost, noise, and classical baseline still matter.', check: 'Can you name the three stages of a quantum program in order?' },
  'complex-numbers': { meaning: 'A complex amplitude has a real part and an imaginary part: a + bi. It is not a strange probability; it is a number that carries both size and phase.', mechanics: 'The squared magnitude |a + bi|² = a² + b² becomes a probability contribution. Relative phase affects how amplitudes combine later.', example: 'The amplitude i/√2 has the same probability as 1/√2, because both have squared magnitude 1/2, but their phases differ.', misconception: 'Probabilities are always real and non-negative. Amplitudes may be negative or complex before you calculate probabilities.', check: 'Why can two amplitudes with equal probabilities behave differently in a later circuit?' },
  qubits: { meaning: 'A qubit is a normalized vector α|0⟩ + β|1⟩. The coefficients are amplitudes, so the qubit is described by possibilities and phases rather than a hidden classical 0 or 1.', mechanics: 'Normalization requires |α|² + |β|² = 1. A gate rotates this vector without changing the total probability.', example: 'H|0⟩ = (|0⟩ + |1⟩)/√2, giving equal measurement chances. X|0⟩ = |1⟩ gives a certain 1.', misconception: 'A superposition is not two classical bits stored where we can read both answers independently.', check: 'What must happen to |α|² + |β|² after a valid quantum gate?' },
  measurement: { meaning: 'Measurement converts a quantum state into a classical outcome. The Born rule says the probability of a basis state is the squared magnitude of its amplitude.', mechanics: 'The state evolves as amplitudes until measurement. The observed result is random according to those probabilities, and the state is then consistent with that result.', example: 'Measuring (|0⟩ + |1⟩)/√2 gives 0 half the time and 1 half the time over many repeated shots.', misconception: 'One run does not reveal the full wavefunction. Repetition estimates the distribution.', check: 'If an amplitude is 1/2, what probability contribution does it produce?' },
  'quantum-states': { meaning: 'Dirac notation and column vectors are two ways to write the same state in a chosen basis. |0⟩ and |1⟩ are basis vectors for one qubit.', mechanics: 'A state vector stores amplitudes in order. A gate is a matrix that multiplies the vector, producing a new vector.', example: '(|0⟩ + |1⟩)/√2 is the vector [1/√2, 1/√2]ᵀ in the computational basis.', misconception: 'Changing notation or basis does not physically change the state; it changes the coordinates used to describe it.', check: 'Which entries in a state vector correspond to |0⟩ and |1⟩?' },
  'bloch-sphere': { meaning: 'The Bloch sphere maps every pure single-qubit state to a point on a unit sphere. The poles represent |0⟩ and |1⟩; the equator contains equal-magnitude superpositions.', mechanics: 'Single-qubit gates act like rotations of the state vector on this sphere. The azimuth records relative phase while latitude records the balance of probabilities.', example: 'H moves |0⟩ from the north pole to the equator. X swaps the poles, and Z rotates equatorial phase by π.', misconception: 'The Bloch sphere is exact for one qubit, but it cannot directly show the full state of a large entangled register.', check: 'What physical difference does the north pole versus the south pole represent?' },
  'quantum-gates': { meaning: 'A quantum gate is a unitary matrix: it changes amplitudes while preserving normalization and remains reversible.', mechanics: 'Circuit order matters because matrix multiplication is generally non-commutative. The rightmost operation acts first in standard ket notation.', example: 'H followed by H returns |0⟩, while H followed by X creates a different state than X followed by H.', misconception: 'A gate is not an irreversible instruction like “erase this value.” It must have an inverse operation.', check: 'Why can swapping two gates change the final measurement distribution?' },
  'pauli-gates': { meaning: 'The Pauli gates are the simplest single-qubit rotations. X changes computational value, Y changes value with phase, and Z changes relative phase.', mechanics: 'X is a bit flip, Z is a phase flip, and Y combines both with an imaginary phase. Each is a π rotation around a Bloch-sphere axis.', example: 'Z|0⟩ = |0⟩ and Z|1⟩ = -|1⟩. The minus sign is invisible to direct measurement but matters after interference.', misconception: 'A phase flip is not the same as changing a measured bit from 0 to 1.', check: 'Which Pauli gate changes |0⟩ directly into |1⟩?' },
  'hadamard-gate': { meaning: 'The Hadamard gate creates balanced superposition from a basis state and converts certain phase differences back into measurable population differences.', mechanics: 'H is its own inverse, so H² = I. This makes it a bridge between the computational basis and the superposition basis.', example: 'H|0⟩ = (|0⟩ + |1⟩)/√2, while H|1⟩ = (|0⟩ - |1⟩)/√2. The minus sign is the important distinction.', misconception: 'H does not randomly choose a bit. It creates amplitudes, and measurement samples them later.', check: 'What happens when you apply H twice to |0⟩?' },
  'phase-gates': { meaning: 'Phase gates change the angle of an amplitude without necessarily changing its immediate measurement probability.', mechanics: 'S adds π/2 phase to |1⟩ and T adds π/4. A later H can turn that relative phase into different probabilities.', example: 'Starting with |0⟩, H → T → H produces a different distribution than H → H even though T alone does not change the first direct probabilities.', misconception: '“No probability change yet” does not mean “no effect.” Phase controls later interference.', check: 'Why do phase gates matter if a direct measurement cannot see their phase?' },
  interference: { meaning: 'Interference is amplitude arithmetic. Paths with matching signs reinforce, while paths with opposite phases cancel.', mechanics: 'Quantum algorithms arrange gates so wrong answers cancel and useful answers grow before measurement. This is the central resource behind many speedup claims.', example: 'H → H returns |0⟩ because the |1⟩ contributions cancel. H → Z → H instead maps |0⟩ to |1⟩.', misconception: 'Interference does not mean a detector sees two answers at once; it changes the final probabilities.', check: 'What must happen to amplitudes for an outcome to become less likely?' },
  entanglement: { meaning: 'Entanglement is a joint state that cannot be factored into one independent state per qubit. The relationship between qubits is part of the information.', mechanics: 'H on q0 followed by CNOT creates a Bell state. Measuring q0 and q1 then gives correlated results, 00 or 11.', example: '(|00⟩ + |11⟩)/√2 has no amplitude for 01 or 10, but neither qubit had a predetermined classical value before measurement.', misconception: 'Entanglement creates correlations; it does not send a usable message faster than light.', check: 'Which two bitstrings can appear when measuring the Bell state above?' },
  'controlled-gates': { meaning: 'A controlled gate applies its target operation only when a control qubit is in the required state, usually |1⟩.', mechanics: 'The control and target remain part of one reversible operation. CNOT flips the target; CZ changes the phase of |11⟩.', example: 'Start with |10⟩ and apply CNOT with the first qubit as control: the target flips, producing |11⟩.', misconception: 'A control does not measure and copy the control qubit. It conditionally changes the joint state.', check: 'What condition causes a CNOT target to flip?' },
  'quantum-circuits': { meaning: 'A circuit is a visual program: wires hold qubits, columns mark time steps, gates transform states, and measurement produces classical bits.', mechanics: 'Read left to right. Every gate acts on selected wires, and the full circuit is the ordered product of its operations.', example: 'H on q0 followed by CNOT(q0, q1) is the standard two-step Bell-state circuit.', misconception: 'A circuit diagram is not just a flowchart; its order and wire connections define the mathematics.', check: 'What does a measurement symbol connect the quantum part of a circuit to?' },
  'tensor-products': { meaning: 'Tensor products combine systems. Two qubits need four basis amplitudes; n qubits need 2ⁿ amplitudes.', mechanics: 'The tensor product preserves local information while allowing joint states, including entangled states that cannot be split into separate vectors.', example: '|0⟩ ⊗ |1⟩ is |01⟩. Combining two equal superpositions creates four basis states with equal amplitudes.', misconception: 'The exponential state space is not simply “more bits”; it has amplitudes and phase relationships across joint basis states.', check: 'How many basis amplitudes are needed for three qubits?' },
  'noise-errors': { meaning: 'Noise is unwanted interaction with the environment or imperfect control. It can change amplitudes, destroy phase, or corrupt readout.', mechanics: 'Decoherence reduces the time a state remains useful. Gate errors accumulate during a circuit, while measurement errors affect the recorded classical result.', example: 'An ideal H experiment predicts a 50/50 distribution, but finite shots and hardware noise can move the observed counts away from exactly 50/50.', misconception: 'A noisy result is not automatically evidence that the algorithm is wrong; compare it with an ideal baseline.', check: 'Which kind of error can erase relative phase information?' },
  'error-correction': { meaning: 'Quantum error correction protects a logical qubit by distributing information across physical qubits and measuring error syndromes rather than the state itself.', mechanics: 'Redundant parity checks reveal which error occurred. A recovery operation corrects the error while preserving the encoded information.', example: 'A repetition-style code can detect a bit flip using parity checks, but phase errors require checks in a different basis.', misconception: 'Error correction does not clone an unknown state. It encodes relationships that can be checked safely.', check: 'Why can’t an error-correction code simply copy the unknown qubit three times?' },
  'quantum-hardware': { meaning: 'A quantum computer is a physical device that must initialize, control, connect, and measure fragile quantum systems.', mechanics: 'Platforms trade off coherence time, gate speed, connectivity, calibration, cooling or vacuum requirements, and scalability.', example: 'Superconducting qubits are fast but need cryogenic hardware; trapped ions have strong coherence but often use slower laser controls.', misconception: 'There is no universal hardware winner. The right platform depends on the workload and engineering constraints.', check: 'Name one tradeoff that hardware designers must manage.' },
  'qiskit-python': { meaning: 'Qiskit turns the circuit model into Python objects that can be simulated or sent to compatible quantum backends.', mechanics: 'You create a circuit, append gates in order, add measurements, run it for many shots, and inspect counts.', example: 'QuantumCircuit(1, 1), qc.h(0), qc.measure(0, 0) models an H experiment whose counts should be near 50/50.', misconception: 'The simulator output is sampled data, not a promise that every run gives the average distribution exactly.', check: 'Why do we run many shots instead of trusting one measurement?' },
  'quantum-complexity': { meaning: 'Quantum complexity studies the resources needed to solve a problem: queries, time, memory, circuit depth, and error tolerance.', mechanics: 'A quantum advantage is meaningful only relative to a clear classical baseline and a fair accounting of input preparation and output readout.', example: 'Grover reduces unstructured search queries from roughly N to √N, but still needs repeated amplification and measurement.', misconception: 'A lower query count does not automatically mean a faster end-to-end application.', check: 'What costs besides gate count should be included when comparing algorithms?' },
  'grover-intuition': { meaning: 'Grover search amplifies a marked answer in an unstructured search space rather than checking every item directly.', mechanics: 'Hadamards spread amplitude, the oracle flips the target phase, and diffusion reflects amplitudes around their mean. Repeating this rotates probability toward the target.', example: 'For four candidates, one oracle-plus-diffusion round can make the marked state dominant in an ideal circuit.', misconception: 'Grover does not reveal all database entries in parallel. Measurement still returns one result.', check: 'Which two operations make up one Grover iteration?' },
  'quantum-teleportation': { meaning: 'Teleportation transfers an unknown quantum state using shared entanglement and two classical bits. The original state is consumed.', mechanics: 'Create a Bell pair, entangle the sender’s state with one half, measure two sender qubits, then apply corrections based on the classical results.', example: 'The receiver can reconstruct the sender’s state without the state itself traveling, but the two classical correction bits must arrive first.', misconception: 'Teleportation moves information, not matter, and it cannot transmit information faster than light.', check: 'What two resources does teleportation require besides the unknown state?' },
  'deutsch-jozsa': { meaning: 'Deutsch–Jozsa uses interference to distinguish a promised constant function from a balanced function with one oracle query.', mechanics: 'Hadamards create a phase pattern, the oracle encodes the function, and final Hadamards concentrate the answer in the all-zero state or elsewhere.', example: 'For a constant oracle the final measurement is 00...0; for a balanced oracle it cannot be all zero under the promise.', misconception: 'The speedup relies on the promise about the function. Without that promise, the task is different.', check: 'What measurement pattern identifies a constant function?' },
  'quantum-applications': { meaning: 'Quantum applications are specific problem areas where controlled quantum dynamics may offer a useful resource, not a general replacement for classical computing.', mechanics: 'Evaluate the quantum subroutine, data loading, error correction, measurement, and the best classical baseline together.', example: 'Molecular simulation maps energy states to qubits, then estimates expectation values through repeated measurements.', misconception: 'A quantum label alone does not prove advantage. The full workflow must outperform a realistic alternative.', check: 'What should you compare before calling an application a quantum advantage?' },
};
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
        <div className="mt-4 flex items-center gap-2"><div className="ql-progress flex-1 !bg-[hsl(231_20%_30%)]"><span style={{ width: `${Math.min(100, learner.completed.length / topics.length * 100)}%`, background: 'hsl(var(--secondary))' }} /></div><span className="ql-mono text-[10px]">{learner.completed.length}/{topics.length}</span></div>
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

function LegacyLearn({ learner }: { learner: Learner }) {
  return <div className="ql-rise"><PageTitle kicker="Fundamentals" title="Build the mental model first." copy="Short, visual lessons that make each new gate feel less mysterious." action={<div className="flex flex-wrap items-center gap-2"><Link href="/qubit-explorer" className="ql-button ql-button-coral" data-testid="link-learn-qubit-explorer"><CircleDot size={15} /> Try prediction lab</Link><div className="flex items-center gap-2 rounded-full bg-[hsl(var(--secondary)/.35)] px-3 py-2 text-xs font-bold"><GraduationCap size={15} /> {learner.completed.length}/7 concepts explored</div></div>} /><div className="grid gap-4 md:grid-cols-2">{topics.map((topic, index) => { const done = learner.completed.includes(topic.id); return <Link href={`/learn/${topic.id}`} key={topic.id} className={`ql-card group relative overflow-hidden p-6 transition-transform hover:-translate-y-1 ${index === 0 ? 'md:col-span-2 md:flex md:items-end md:justify-between md:p-8' : ''}`} data-testid={`card-lesson-${topic.id}`}><div className={`absolute right-0 top-0 size-32 rounded-full ${index % 2 ? 'bg-[hsl(var(--secondary)/.24)]' : 'bg-[hsl(var(--primary)/.08)]'} -translate-y-1/2 translate-x-1/2`} /><div className="relative"><div className="flex items-center gap-2"><span className="ql-kicker">{topic.tag}</span>{done && <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--primary)/.12)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--primary))]"><Check size={11} /> Done</span>}</div><h2 className={`mt-4 max-w-lg font-black tracking-[-.03em] ${index === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>{topic.title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{topic.copy}</p></div><div className="relative mt-6 flex items-center justify-between gap-5 text-xs font-bold text-[hsl(var(--muted-foreground))] md:mt-0"><span>{topic.time} read</span><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--primary))] transition-colors group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))]"><ArrowRight size={16} /></span></div></Link>; })}</div><div className="mt-8 rounded-2xl border border-dashed border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary)/.05)] p-5 text-sm text-[hsl(var(--muted-foreground))]"><Lightbulb className="mb-3 text-[hsl(var(--primary))]" size={19} /><p><strong className="text-[hsl(var(--foreground))]">Suggested rhythm:</strong> read one lesson, then open the lab and reproduce one idea yourself. The memory sticks when your hands get involved.</p></div></div>;
}

function Learn({ learner }: { learner: Learner }) {
  return <div><PageTitle kicker="Quantum computing syllabus" title="Build the mental model, then build the machine." copy="A complete path from qubits and linear algebra to circuits, algorithms, hardware, and Python." action={<div className="flex flex-wrap items-center gap-2"><Link href="/qubit-explorer" className="ql-button ql-button-coral" data-testid="link-learn-qubit-explorer"><CircleDot size={15} /> Try prediction lab</Link><div className="flex items-center gap-2 rounded-full bg-[hsl(var(--secondary)/.35)] px-3 py-2 text-xs font-bold"><GraduationCap size={15} /> {learner.completed.length}/{topics.length} concepts explored</div></div>} /><LegacyLearn learner={learner} /></div>;
}

function LegacyLearnDetail({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const { topic } = useParams<{ topic: string }>();
  const current = topics.find((item) => item.id === topic) || topics[0];
  const [location, setLocation] = useLocation();
  const done = learner.completed.includes(current.id);
  const markDone = () => { if (!done) setLearner({ ...learner, completed: [...learner.completed, current.id] }); };
  return <div className="ql-rise mx-auto max-w-4xl"><Link href="/learn" className="mb-8 inline-flex items-center gap-2 text-xs font-black text-[hsl(var(--muted-foreground))]" data-testid="link-back-lessons">← All fundamentals</Link><div className="mb-8"><p className="ql-kicker">{current.tag} · {current.time}</p><h1 className="ql-serif mt-3 text-5xl leading-[.98] tracking-[-.05em] md:text-7xl">{current.title}</h1></div><div className="ql-card overflow-hidden"><div className="ql-grid flex min-h-[240px] items-center justify-center bg-[hsl(174_58%_35%/.06)] p-8"><div className="relative flex size-36 items-center justify-center rounded-full border border-dashed border-[hsl(var(--primary)/.6)] bg-[hsl(var(--card))] shadow-[0_0_0_18px_hsl(var(--primary)/.06),0_0_0_36px_hsl(var(--primary)/.04)]"><span className="ql-serif text-5xl text-[hsl(var(--primary))]">ψ</span><span className="absolute -right-14 top-2 rounded-lg bg-[hsl(var(--accent))] px-2 py-1 text-xs font-black text-[hsl(var(--accent-foreground))]">possible</span><span className="absolute -bottom-3 -left-14 rounded-lg bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-black">not certain</span></div></div><div className="p-6 md:p-10"><p className="text-lg leading-8 text-[hsl(var(--foreground))]">{current.id === 'qubits' ? 'A qubit is not simply a tiny version of a bit. Before measurement, its state can be a carefully weighted combination of 0 and 1. The weights are called amplitudes.' : current.id === 'measurement' ? 'Measurement is the moment a quantum state becomes an ordinary result. Squaring an amplitude gives the chance of seeing its matching bitstring. The simulator below does exactly that.' : current.id === 'entanglement' ? 'Entanglement links the description of two qubits so tightly that measuring one gives information about the other. It is a relationship, not a faster-than-light message.' : 'Quantum computers work with quantum states, then use gates to shape those states before measuring them. The trick is not magic: it is linear algebra made programmable.'}</p><div className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-[hsl(var(--muted))] p-4"><p className="ql-kicker">Keep this picture</p><p className="mt-2 text-sm leading-6">A circuit is a recipe. Gates change the recipe’s state. Measurement checks the finished dish.</p></div><div className="rounded-xl bg-[hsl(var(--secondary)/.35)] p-4"><p className="ql-kicker">Try it with your hands</p><p className="mt-2 text-sm leading-6">Open the lab, place an H gate on q₀, and run it. You should see two equally likely outcomes.</p></div></div><div className="mt-9 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">{done ? 'Lesson saved to your notebook.' : 'A two-minute experiment is waiting.'}</span><div className="flex gap-2"><button onClick={markDone} className={`ql-button ${done ? 'ql-button-quiet' : 'ql-button-primary'}`} data-testid="button-complete-lesson">{done ? <Check size={16} /> : <Award size={16} />}{done ? 'Completed' : 'Mark complete'}</button><Link href="/quantum-lab" className="ql-button ql-button-coral" data-testid="link-lesson-lab">Open lab <ArrowRight size={16} /></Link></div></div></div></div></div>;
}

function LearnDetail({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const { topic } = useParams<{ topic: string }>();
  const current = topics.find((item) => item.id === topic) || topics[0];
  const content = lessonContent[current.id];
  const deepDive = lessonDeepDive[current.id];
  const [, setLocation] = useLocation();
  const done = learner.completed.includes(current.id);
  const currentIndex = topics.findIndex((item) => item.id === current.id);
  const nextTopic = topics[currentIndex + 1];
  const markDone = () => {
    if (done) return;
    setLearner({ ...learner, completed: [...learner.completed, current.id] });
  };
  const goNext = () => setLocation(nextTopic ? `/learn/${nextTopic.id}` : '/learn');
  return <div className="ql-rise mx-auto max-w-5xl"><Link href="/learn" className="mb-8 inline-flex items-center gap-2 text-xs font-black text-[hsl(var(--muted-foreground))]" data-testid="link-back-lessons">← All lessons</Link><div className="mb-8"><p className="ql-kicker">{current.tag} · {current.time}</p><h1 className="ql-serif mt-3 max-w-4xl text-5xl leading-[.98] tracking-[-.05em] md:text-7xl">{current.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">{current.copy}</p></div><div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><article className="ql-card overflow-hidden"><div className="ql-grid flex min-h-[170px] items-center justify-center bg-[hsl(174_58%_35%/.06)] p-8"><div className="flex size-32 items-center justify-center rounded-full border border-dashed border-[hsl(var(--primary)/.6)] bg-[hsl(var(--card))] shadow-[0_0_0_18px_hsl(var(--primary)/.06),0_0_0_36px_hsl(var(--primary)/.04)]"><span className="ql-serif text-5xl text-[hsl(var(--primary))]">ψ</span></div></div><div className="p-6 md:p-9"><div className="rounded-2xl border border-[hsl(var(--primary)/.2)] bg-[hsl(var(--primary)/.06)] p-5"><p className="ql-kicker">The concept</p><p className="mt-2 text-lg leading-8">{deepDive.meaning}</p></div><div className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-[hsl(var(--muted))] p-5"><p className="ql-kicker">How it works</p><p className="mt-2 text-sm leading-6">{deepDive.mechanics}</p></div><div className="rounded-2xl bg-[hsl(var(--secondary)/.28)] p-5"><p className="ql-kicker">Concrete example</p><p className="mt-2 text-sm leading-6">{deepDive.example}</p></div></div><div className="mt-8 rounded-2xl border-l-4 border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.08)] p-5"><p className="ql-kicker !text-[hsl(var(--accent))]">Watch for this misconception</p><p className="mt-2 text-sm leading-6">{deepDive.misconception}</p></div><div className="mt-8 rounded-2xl bg-[hsl(231_26%_18%)] p-5 text-[hsl(var(--primary-foreground))]"><p className="ql-kicker !text-[hsl(var(--secondary))]">Check your understanding</p><p className="mt-2 text-base leading-7">{deepDive.check}</p><p className="mt-3 text-xs text-[hsl(43_43%_78%)]">Try answering before opening the tutor or simulator.</p></div><div className="mt-8 rounded-2xl border border-[hsl(var(--border))] p-5"><p className="ql-kicker">Key idea to remember</p><p className="mt-2 text-sm leading-6">{content.key}</p></div><div className="mt-8 border-t border-[hsl(var(--border))] pt-6"><p className="ql-kicker">Turn knowledge into evidence</p><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{content.practice}</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/quantum-lab" className="ql-button ql-button-primary" data-testid="link-lesson-lab"><FlaskConical size={16} /> Open lab</Link><Link href="/ai-tutor" className="ql-button ql-button-quiet" data-testid="link-lesson-tutor"><MessageCircle size={16} /> Ask tutor</Link></div></div></div></article><aside className="space-y-5"><div className="ql-card p-6"><p className="ql-kicker">Learning path</p><p className="mt-2 text-3xl font-black">{currentIndex + 1}<span className="text-base text-[hsl(var(--muted-foreground))]"> / {topics.length}</span></p><div className="ql-progress mt-4"><span style={{ width: `${((currentIndex + 1) / topics.length) * 100}%` }} /></div><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">Follow the lessons in order, then revisit any concept from the syllabus.</p></div><div className="ql-card p-6"><p className="ql-kicker">Notebook</p><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{done ? 'This concept is saved as completed.' : 'Mark this lesson read after you can explain the key idea in your own words.'}</p><div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col"><button onClick={markDone} className={`ql-button w-full ${done ? 'ql-button-quiet' : 'ql-button-primary'}`} data-testid="button-complete-lesson">{done ? <Check size={16} /> : <Award size={16} />}{done ? 'Read' : 'Mark as read'}</button><button onClick={goNext} className="ql-button ql-button-coral w-full" data-testid="button-next-lesson"><ArrowRight size={16} />{nextTopic ? 'Next lesson' : 'Back to lessons'}</button></div></div></aside></div></div>;
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

function PythonCodePanel({ code }: { code: string }) {
  return <section className="ql-card overflow-hidden" data-testid="python-simulation-code"><div className="flex items-center gap-3 border-b border-[hsl(var(--border))] p-5"><div className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--secondary))]"><Code2 size={17} /></div><div><p className="ql-kicker">Executable Python</p><h2 className="mt-1 text-xl font-black">Reproduce this simulation</h2></div></div><div className="overflow-x-auto bg-[hsl(231_26%_18%)] p-5"><pre className="ql-mono whitespace-pre text-[11px] leading-5 text-[hsl(43_43%_88%)]"><code>{code}</code></pre></div><p className="border-t border-[hsl(var(--border))] px-5 py-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Run with <span className="ql-mono">pip install qiskit qiskit-aer matplotlib</span>. The script executes the same gate sequence and plots measured probabilities.</p></section>;
}

function singleQubitPython(gate: SingleGate) {
  const operation = gate === 'H' ? 'qc.h(0)' : gate === 'X' ? 'qc.x(0)' : gate === 'Y' ? 'qc.y(0)' : gate === 'Z' ? 'qc.z(0)' : gate === 'S' ? 'qc.s(0)' : 'qc.t(0)';
  return `from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import matplotlib.pyplot as plt

qc = QuantumCircuit(1, 1)
${operation}
qc.measure(0, 0)

result = AerSimulator().run(qc, shots=1024).result()
counts = result.get_counts()
labels = ['0', '1']
values = [counts.get(label, 0) / 1024 for label in labels]
plt.bar(labels, values, color=['#16877d', '#e36f52'])
plt.ylabel('Measurement probability')
plt.xlabel('Measured state')
plt.ylim(0, 1)
plt.title('${gate} gate measurement')
plt.show()`;
}

function circuitPython(gates: Gate[]) {
  const operations = gates.map((gate) => {
    if (gate.name === 'CZ') return `qc.cz(${gate.qubit}, ${(gate.qubit + 1) % 3})`;
    if (gate.name === 'DIFF') return 'qc.h(range(3))\nqc.x(range(3))\nqc.h(2)\nqc.mcx([0, 1], 2)\nqc.h(2)\nqc.x(range(3))\nqc.h(range(3))';
    return `qc.${gate.name.toLowerCase()}(${gate.qubit})`;
  }).join('\n');
  return `from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import matplotlib.pyplot as plt

qc = QuantumCircuit(3, 3)
${operations || '# Add gates in the QuantumLearn lab'}
qc.measure(range(3), range(3))

result = AerSimulator().run(qc, shots=1024).result()
counts = result.get_counts()
labels = [format(index, '03b') for index in range(8)]
values = [counts.get(label, 0) / 1024 for label in labels]
plt.bar(labels, values, color='#16877d')
plt.ylabel('Measurement probability')
plt.xlabel('Measured state')
plt.ylim(0, 1)
plt.title('QuantumLearn circuit simulation')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`;
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
        {ran && <PythonCodePanel code={singleQubitPython(selectedGate)} />}
      </section>
    </div>
    <div className="mt-5 rounded-2xl border border-dashed border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.05)] p-5"><div className="flex items-start gap-3"><CircleHelp size={18} className="mt-0.5 text-[hsl(var(--primary))]" /><p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]"><strong className="text-[hsl(var(--foreground))]">Mini-experiment loop:</strong> Choose a gate → predict → run → observe the amplitudes and Bloch vector → ask why. Try H, then T: phase becomes visible when you create a superposition first.</p></div></div>
  </div>;
}

function QuantumLabView({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
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

function QuantumLab({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  return <div><QuantumLabView learner={learner} setLearner={setLearner} /><div className="mx-auto mt-5 max-w-[1380px] px-5 md:px-9"><PythonCodePanel code={circuitPython([])} /></div></div>;
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
  const total = topics.length;
  const predictionAccuracy = learner.predictionAttempts ? Math.round(learner.predictionCorrect / learner.predictionAttempts * 100) : null;
  return <div className="ql-rise"><PageTitle kicker="Your progress" title="Notice the pattern, not the score." copy="Progress is the trail of experiments you have already made." action={<Link href="/quiz" className="ql-button ql-button-primary" data-testid="link-progress-practice"><Target size={16} /> Practice now</Link>} /><section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><div className="ql-card p-6"><p className="ql-kicker">Foundations</p><p className="mt-4 ql-serif text-5xl">{Math.round(learner.completed.length / total * 100)}<span className="text-2xl">%</span></p><div className="ql-progress mt-5"><span style={{ width: `${Math.max(4, learner.completed.length / total * 100)}%` }} /></div><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{learner.completed.length} of {total} concepts explored</p></div><div className="ql-card p-6"><p className="ql-kicker">Lab notebook</p><p className="mt-4 ql-serif text-5xl">{learner.runs}</p><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">circuits simulated locally</p></div><div className="ql-card border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.05)] p-6"><p className="ql-kicker">Prediction signal</p><p className="mt-4 ql-serif text-5xl">{predictionAccuracy === null ? '—' : predictionAccuracy}<span className="text-2xl">{predictionAccuracy === null ? '' : '%'}</span></p><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{learner.predictionAttempts ? `${learner.predictionCorrect} of ${learner.predictionAttempts} calls matched` : 'Make a call before the run'}</p></div><div className="ql-card bg-[hsl(33_69%_78%/.28)] p-6"><p className="ql-kicker">Practice signal</p><p className="mt-4 ql-serif text-5xl">{learner.quizScore || '—'}<span className="text-2xl">{learner.quizScore ? '%' : ''}</span></p><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{learner.quizScore ? 'Last challenge result' : 'Your first challenge is waiting'}</p></div></section><section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="ql-card p-6"><div className="flex items-center justify-between"><div><p className="ql-kicker">Concept trail</p><h2 className="mt-2 text-xl font-black">Your notebook</h2></div><BookOpen size={18} className="text-[hsl(var(--primary))]" /></div><div className="mt-6 space-y-3">{topics.map((topic, index) => { const done = learner.completed.includes(topic.id); return <div key={topic.id} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/.6)] p-3"><span className={`flex size-7 items-center justify-center rounded-full ${done ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>{done ? <Check size={14} /> : <span className="ql-mono text-[10px]">0{index + 1}</span>}</span><span className={`text-sm font-bold ${done ? '' : 'text-[hsl(var(--muted-foreground))]'}`}>{topic.title}</span><span className="ml-auto text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{done ? 'explored' : 'up next'}</span></div>; })}</div></div><div className="rounded-[1.25rem] bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--primary-foreground))]"><Award className="text-[hsl(var(--secondary))]" size={22} /><h2 className="ql-serif mt-8 text-3xl">Every run is evidence.</h2><p className="mt-3 text-sm leading-6 text-[hsl(43_43%_80%)]">You are building intuition by making predictions and checking them. That is the real skill behind the numbers.</p><Link href="/qubit-explorer" className="ql-button ql-button-coral mt-8" data-testid="link-progress-lab">Make another prediction <ArrowRight size={15} /></Link></div></section></div>;
}

type TutorMode = 'explain' | 'steps' | 'hint' | 'math' | 'circuit' | 'quiz';
type TutorMessage = { from: 'tutor' | 'you'; text: string; mode?: TutorMode };

const tutorModes: Array<{ id: TutorMode; label: string; prompt: string }> = [
  { id: 'explain', label: 'Explain simply', prompt: 'Explain this simply' },
  { id: 'steps', label: 'Step-by-step', prompt: 'Break this down step by step' },
  { id: 'hint', label: 'Give me a hint', prompt: 'Give me a hint about' },
  { id: 'math', label: 'Show the math', prompt: 'Show me the math for' },
  { id: 'circuit', label: 'Explain my circuit', prompt: 'Explain my circuit' },
  { id: 'quiz', label: 'Quiz me', prompt: 'Quiz me on' },
];

function answerQuantumQuestion(question: string, mode: TutorMode = 'explain') {
  const lower = question.toLowerCase();
  if (mode === 'hint') return 'Start with the state before the gate. Then ask: which amplitudes changed, and what will squaring their magnitudes tell you? Try a prediction before looking at the answer.';
  if (mode === 'quiz') return 'Quick check: if you apply H to |0⟩, what probabilities should you expect when measuring? Reply with your prediction and I will check it.';
  if (mode === 'circuit') return 'Read the circuit left to right: identify the starting state, name each gate, then predict the measurement distribution. Share the gate sequence, such as H → Z → H, and I will trace each state.';
  if (/\b(hello|hi|hey)\b/.test(lower)) return 'Hi. Ask me about a qubit, gate, circuit, measurement, algorithm, or Qiskit code. I can explain it simply, mathematically, or step by step.';
  if (lower.includes('superposition') || lower.includes('both 0') || lower.includes('both zero')) return mode === 'math' ? 'For |0⟩, the Hadamard matrix gives H[1, 0]ᵀ = [1/√2, 1/√2]ᵀ. Squaring each magnitude gives P(0) = P(1) = 1/2.' : mode === 'steps' ? '1. Start with |0⟩. 2. Apply H. 3. The amplitudes become 1/√2 for |0⟩ and |1⟩. 4. Measure: each result appears with 50% probability. The state is not two readable classical copies.' : 'Superposition means a qubit has amplitudes for |0⟩ and |1⟩ at the same time before measurement. For example, H|0⟩ = (|0⟩ + |1⟩)/√2, so measuring it gives 0 or 1 with 50% probability each. It is not two classical values you can read simultaneously.';
  if (lower.includes('entangl')) return mode === 'math' ? 'The Bell state is |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Its amplitudes have squared magnitudes 1/2, while |01⟩ and |10⟩ have amplitude 0.' : 'Entanglement is a joint quantum state whose outcomes are correlated more strongly than separate classical descriptions allow. A common circuit is H on q0 followed by CX(q0, q1), which creates (|00⟩ + |11⟩)/√2. Measuring one qubit predicts the matching result of the other.';
  if (lower.includes('interfer') || lower.includes('phase')) return mode === 'steps' ? '1. A gate changes an amplitude’s phase. 2. A later gate makes paths meet. 3. Matching phases reinforce; opposite phases cancel. 4. Measurement samples the final squared magnitudes.' : 'Phase is the sign or complex angle of an amplitude. It may not change a direct measurement probability, but later gates can make amplitudes add or cancel. That constructive and destructive interference is how quantum algorithms shape outcomes.';
  if (lower.includes('measure') || lower.includes('probabilit') || lower.includes('collapse')) return mode === 'math' ? 'For amplitude a, the Born rule is P = |a|² = a* a. The probabilities across all basis states must sum to 1.' : 'Measurement converts amplitudes into a classical result. For a basis state with amplitude a, the probability is |a|². All probabilities add to 1, and the state is projected onto the result that was observed.';
  const gate = ['hadamard', 'h gate', 'pauli-x', 'x gate', 'pauli-y', 'y gate', 'pauli-z', 'z gate', 's gate', 't gate', 'cnot', 'cx gate', 'cz gate'].find((name) => lower.includes(name));
  if (gate) {
    if (gate.includes('hadamard') || gate === 'h gate') return mode === 'steps' ? '1. H takes |0⟩ to an equal superposition. 2. It changes the relative phase for |1⟩. 3. Applying H again reverses the transformation because H² = I.' : 'The H, or Hadamard, gate creates and removes equal superpositions: H|0⟩ = (|0⟩ + |1⟩)/√2 and H|1⟩ = (|0⟩ − |1⟩)/√2.';
    if (gate.includes('pauli-x') || gate === 'x gate') return 'The X gate is a quantum bit flip. It maps |0⟩ to |1⟩ and |1⟩ to |0⟩, like a NOT gate.';
    if (gate.includes('pauli-y') || gate === 'y gate') return 'The Y gate flips |0⟩ and |1⟩ while adding an imaginary phase: Y|0⟩ = i|1⟩ and Y|1⟩ = −i|0⟩.';
    if (gate.includes('pauli-z') || gate === 'z gate') return 'The Z gate leaves |0⟩ unchanged and adds a minus phase to |1⟩. It changes no probability by itself, but the phase becomes visible after interference.';
    if (gate === 's gate') return 'The S gate is a quarter-turn phase gate. It leaves |0⟩ unchanged and maps |1⟩ to i|1⟩.';
    if (gate === 't gate') return 'The T gate adds a π/4 phase to |1⟩. It is useful for building universal quantum circuits.';
    return 'A controlled gate applies an operation only when the control condition is met. CNOT flips the target when the control is |1⟩; CZ applies a phase flip to |11⟩.';
  }
  if (lower.includes('grover') || lower.includes('search')) return "Grover's algorithm searches an unstructured space in roughly √N queries. Its recipe is: create a superposition, mark the target with an oracle, then apply diffusion to amplify the target's amplitude before measurement.";
  if (lower.includes('qiskit') || lower.includes('python') || lower.includes('code')) return 'A minimal Qiskit simulation is: `from qiskit import QuantumCircuit`; create `qc = QuantumCircuit(1, 1)`, apply `qc.h(0)`, then `qc.measure(0, 0)`. Run it with `AerSimulator().run(qc, shots=1024)` and read `result.get_counts()` for measured frequencies.';
  if (lower.includes('amplitude')) return 'An amplitude is a real or complex number attached to a basis state. The measurement probability is its squared magnitude, |amplitude|². Amplitudes can be negative or complex because their phase controls interference.';
  if (lower.includes('classical') || lower.includes('normal computer')) return 'A classical bit is either 0 or 1. A qubit can use amplitudes for both basis states, but measurement still returns one classical bit. Quantum advantage comes from controlled interference, not from reading every possibility at once.';
  if (lower.includes('algorithm') || lower.includes('deutsch') || lower.includes('teleport')) return 'A quantum algorithm is a sequence of state preparations, gates, and measurements designed so useful amplitudes interfere constructively. Tell me the algorithm name and I can break down its circuit and intuition.';
  if (lower.includes('why') || lower.includes('help') || lower.includes('explain') || lower.includes('confus')) return 'Let’s make it concrete. Name the exact gate, equation, circuit step, or result that feels unclear. I can explain it in plain language, step by step, or with the corresponding Qiskit code.';
  return 'I can help with quantum learning questions about qubits, superposition, amplitudes, phase, measurement, H/X/Y/Z/S/T gates, controlled gates, entanglement, interference, Grover, circuits, Python, and Qiskit. What topic should we unpack?';
}

function AiTutor({ learner }: { learner: Learner }) {
  const levelLabel = learner.learningLevel === 'beginner' ? 'beginner' : learner.learningLevel === 'intermediate' ? 'intermediate' : 'new learner';
  const [messages, setMessages] = useState<TutorMessage[]>([{ from: 'tutor', text: `Welcome back${learner.name ? `, ${learner.name.split(' ')[0]}` : ''}. I am tuned for a ${levelLabel}. Pick a mode or ask me about the idea you are working on.` }]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<TutorMode>('explain');
  const [thinking, setThinking] = useState(false);
  const send = (prompt = input.trim()) => { const question = prompt.trim(); if (!question || thinking) return; setMessages((current) => [...current, { from: 'you', text: question, mode }]); setInput(''); setThinking(true); window.setTimeout(() => { setMessages((current) => [...current, { from: 'tutor', text: answerQuantumQuestion(question, mode), mode }]); setThinking(false); }, 350); };
  const clear = () => { setMessages([{ from: 'tutor', text: 'Fresh page. What quantum idea should we make visible?' }]); setInput(''); };
  const setTutorMode = (nextMode: TutorMode) => { setMode(nextMode); setInput(`${tutorModes.find((item) => item.id === nextMode)?.prompt || ''} `); };
  return <div className="ql-rise mx-auto max-w-5xl"><PageTitle kicker="Personal AI tutor" title="Ask the question you almost asked." copy="A focused study partner for your current path. Choose how you want the idea explained, then keep the conversation moving." action={<div className="flex items-center gap-2 rounded-full bg-[hsl(var(--primary)/.1)] px-3 py-2 text-xs font-bold text-[hsl(var(--primary))]"><Sparkles size={15} /> {levelLabel} mode</div>} /><div className="grid gap-5 lg:grid-cols-[1fr_280px]"><div className="ql-card overflow-hidden"><div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.45)] p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><BrainCircuit size={19} /></div><div><p className="text-sm font-black">QuantumLearn tutor</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Explains, checks, and points you to the next experiment</p></div><span className="ml-auto size-2 rounded-full bg-[hsl(var(--primary))]" /></div></div><div className="min-h-[330px] space-y-4 p-5 md:p-7" data-testid="tutor-message-list">{messages.map((message, index) => <div key={`${message.from}-${index}`} className={`flex ${message.from === 'you' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.from === 'you' ? 'rounded-br-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'rounded-bl-sm bg-[hsl(var(--muted))]'}`} data-testid={`text-tutor-message-${index}`}>{message.text}</div></div>)}{thinking && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-sm bg-[hsl(var(--muted))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]" data-testid="tutor-thinking">Thinking through the amplitudes<span className="ql-tutor-dots">...</span></div></div>}</div><div className="border-t border-[hsl(var(--border))] p-4"><div className="flex items-center justify-between gap-3"><p className="ql-label mb-0">Tutor mode</p><button onClick={clear} className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" data-testid="button-clear-tutor">Clear chat</button></div><div className="mt-2 flex flex-wrap gap-2" data-testid="tutor-mode-chips">{tutorModes.map((item) => <button key={item.id} onClick={() => setTutorMode(item.id)} className={`ql-chip ${mode === item.id ? '!border-[hsl(var(--primary))] !bg-[hsl(var(--primary)/.1)] !text-[hsl(var(--primary))]' : ''}`} data-testid={`button-tutor-mode-${item.id}`}>{item.label}</button>)}</div><div className="mt-3 flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), send())} className="ql-input" placeholder="Try: what does an H gate do?" data-testid="input-tutor-question" /><button onClick={() => send()} disabled={thinking} className="ql-button ql-button-primary px-4 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send question" data-testid="button-send-tutor"><Send size={16} /></button></div><p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">Try a concept, a gate sequence, or a result from the lab.</p></div></div><aside className="space-y-5"><div className="ql-card p-5"><p className="ql-kicker">Start here</p><p className="mt-2 text-lg font-black">Make the next question easy.</p><div className="mt-4 space-y-2">{['Why does H create superposition?', 'Explain measurement', 'Quiz me on Grover'].map((prompt) => <button key={prompt} onClick={() => send(prompt)} className="w-full rounded-xl border border-[hsl(var(--border))] p-3 text-left text-xs font-bold hover:border-[hsl(var(--primary)/.5)] hover:bg-[hsl(var(--muted))]" data-testid={`button-tutor-starter-${prompt.slice(0, 8).replaceAll(' ', '-').toLowerCase()}`}>{prompt}<ChevronRight size={14} className="float-right mt-0.5 text-[hsl(var(--primary))]" /></button>)}</div></div><div className="ql-card p-5"><p className="ql-kicker">Continue learning</p><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Turn an explanation into an experiment or a quick retrieval check.</p><div className="mt-4 flex flex-col gap-2"><Link href="/learn/qubits" className="ql-button ql-button-quiet justify-between" data-testid="link-tutor-qubits">Review qubits <ArrowRight size={15} /></Link><Link href="/quantum-lab" className="ql-button ql-button-coral justify-between" data-testid="link-tutor-lab">Open the lab <FlaskConical size={15} /></Link><Link href="/quiz" className="ql-button ql-button-quiet justify-between" data-testid="link-tutor-practice">Practice recall <Target size={15} /></Link></div></div></aside></div></div>;
}

function NotFoundPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center p-6"><div className="text-center"><p className="ql-kicker">404 / Empty state</p><h1 className="ql-serif mt-3 text-5xl">This path decohered.</h1><Link href="/dashboard" className="ql-button ql-button-primary mt-6" data-testid="link-404-dashboard">Back to the lab <ArrowRight size={16} /></Link></div></div>;
}

function Router({ learner, setLearner }: { learner: Learner; setLearner: (value: Learner) => void }) {
  const [location] = useLocation();
  return <Shell learner={learner}><ErrorBoundary resetKey={location}><Switch><Route path="/dashboard"><Dashboard learner={learner} setLearner={setLearner} /></Route><Route path="/onboarding"><Onboarding learner={learner} setLearner={setLearner} /></Route><Route path="/learn"><Learn learner={learner} /></Route><Route path="/learn/:topic"><LearnDetail learner={learner} setLearner={setLearner} /></Route><Route path="/algorithms"><Algorithms /></Route><Route path="/algorithms/:algorithm"><AlgorithmDetail /></Route><Route path="/quantum-lab"><QuantumLab learner={learner} setLearner={setLearner} /></Route><Route path="/qubit-explorer"><QubitExplorer learner={learner} setLearner={setLearner} /></Route><Route path="/quiz"><Quiz learner={learner} setLearner={setLearner} /></Route><Route path="/progress"><Progress learner={learner} /></Route><Route path="/ai-tutor"><AiTutor learner={learner} /></Route><Route path="/profile"><ProfilePage learner={learner} setLearner={setLearner} /></Route><Route path="/settings"><ProfilePage learner={learner} setLearner={setLearner} /></Route><Route component={NotFoundPage} /></Switch></ErrorBoundary></Shell>;
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

function LocalAuthFallback() {
  return <div className="ql-noise flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] p-6">
    <div className="ql-card max-w-lg p-8 text-center">
      <p className="ql-kicker">Local mode</p>
      <h1 className="ql-serif mt-3 text-4xl">Authentication is off.</h1>
      <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
        Add VITE_CLERK_PUBLISHABLE_KEY to your local environment to enable sign-in and protected routes.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="ql-button ql-button-primary">Back to home</Link>
      </div>
    </div>
  </div>;
}

function LocalModeApp() {
  return <Switch>
    <Route path="/" component={Landing} />
    <Route path="/sign-in/*?" component={LocalAuthFallback} />
    <Route path="/sign-up/*?" component={LocalAuthFallback} />
    <Route component={NotFoundPage} />
  </Switch>;
}

function App() {
  if (!hasClerkKey) {
    return <WouterRouter base={basePath}><LocalModeApp /></WouterRouter>;
  }
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;