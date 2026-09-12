export type CurriculumStage = 'Prerequisite' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Research';

export type CurriculumLevel = {
  number: number;
  title: string;
  stage: CurriculumStage;
  description: string;
  topics: string[];
  labs?: string[];
};

const levelData: Array<[string, CurriculumStage, string, string[], string[]?]> = [
  ['Prerequisites', 'Prerequisite', 'Build the computing, mathematics, and Python vocabulary that makes quantum ideas easier to hold.', ['Binary and Boolean logic', 'Probability distributions', 'Vectors and matrices', 'Complex numbers', 'Python foundations'], ['Math warm-up']],
  ['Introduction to Quantum Computing', 'Beginner', 'See why quantum computing is different without starting with a wall of notation.', ['Quantum information', 'Quantum advantage', 'NISQ era', 'Physics intuition', 'Limitations']],
  ['Qubits and Quantum States', 'Beginner', 'Move from classical bits to state vectors, amplitudes, and the Bloch sphere.', ['|0⟩ and |1⟩', 'Superposition', 'Normalization', 'Amplitudes', 'Bloch sphere'], ['Qubit explorer']],
  ['Quantum Measurement', 'Beginner', 'Understand collapse, repeated shots, histograms, and the difference between state and outcome.', ['Measurement probabilities', 'State collapse', 'Shots', 'Histograms', 'Expectation values'], ['Measurement lab']],
  ['Single-Qubit Gates', 'Beginner', 'Use unitary operations to change a state and make phase visible through interference.', ['X, Y, Z', 'Hadamard', 'S, T, and phase', 'Rotations', 'Gate composition'], ['Gate playground']],
  ['Quantum Circuits', 'Beginner', 'Read and build circuits with wires, depth, ordering, measurement, and executable code.', ['Circuit width', 'Circuit depth', 'Gate ordering', 'Controlled operations', 'Qiskit QuantumCircuit'], ['Circuit builder']],
  ['Multi-Qubit Systems', 'Intermediate', 'Describe joint states with tensor products and controlled operations.', ['Tensor products', 'Joint probabilities', 'CNOT', 'CZ', 'SWAP']],
  ['Entanglement', 'Intermediate', 'Distinguish product states from correlations that belong to the whole system.', ['Bell states', 'Quantum correlations', 'Teleportation', 'Superdense coding', 'Bell inequalities'], ['Bell state lab', 'Teleportation lab']],
  ['Quantum Phenomena', 'Intermediate', 'Use relative phase and interference as computational resources.', ['Global phase', 'Relative phase', 'Constructive interference', 'Destructive interference', 'Amplitude interference'], ['Interference lab']],
  ['Quantum Information', 'Intermediate', 'Introduce density matrices, mixed states, channels, and noise.', ['Pure and mixed states', 'Density matrices', 'Trace', 'Reduced states', 'Quantum channels'], ['Density matrix explorer']],
  ['Algorithm Foundations', 'Intermediate', 'Learn the oracle, query, and amplitude-amplification vocabulary behind quantum algorithms.', ['Quantum parallelism', 'Oracle concept', 'Query complexity', 'Interference computation', 'Amplitude amplification']],
  ['Quantum Algorithms', 'Intermediate', 'Compare classical and quantum recipes through small, inspectable experiments.', ['Deutsch', 'Deutsch–Jozsa', 'Bernstein–Vazirani', 'Simon’s algorithm', 'Grover’s algorithm'], ['Grover explorer']],
  ['Quantum Fourier Transform', 'Advanced', 'Build intuition for Fourier structure, controlled phases, and inverse transforms.', ['Fourier intuition', 'QFT circuit', 'Controlled phase', 'SWAP operations', 'Inverse QFT'], ['QFT lab']],
  ['Quantum Phase Estimation', 'Advanced', 'Connect eigenvalues, phase, controlled operations, and inverse QFT.', ['Eigenstates', 'Eigenvalues', 'Phase', 'QPE circuit', 'Applications'], ['QPE lab']],
  ['Shor’s Algorithm', 'Advanced', 'Understand factoring through period finding before touching a full implementation.', ['Factoring', 'Modular arithmetic', 'Period finding', 'QFT connection', 'Cryptography implications']],
  ['Quantum Error and Noise', 'Advanced', 'See how decoherence and imperfect gates change the result of an ideal circuit.', ['Decoherence', 'Relaxation', 'Dephasing', 'Readout errors', 'Noise models'], ['Noise lab']],
  ['Quantum Hardware', 'Advanced', 'Compare physical platforms and the constraints they place on circuit design.', ['Superconducting qubits', 'Trapped ions', 'Neutral atoms', 'Fidelity', 'Connectivity']],
  ['Quantum Compilation', 'Advanced', 'Turn abstract circuits into hardware-aware programs with fewer costly operations.', ['Transpilation', 'Native gates', 'Qubit mapping', 'Routing', 'Optimization'], ['Optimization lab']],
  ['Variational Quantum Computing', 'Advanced', 'Explore hybrid loops where classical optimizers tune parameterized quantum circuits.', ['Parameterized circuits', 'Cost functions', 'VQE', 'QAOA', 'Energy expectation'], ['VQE lab', 'QAOA lab']],
  ['Quantum Machine Learning', 'Advanced', 'Understand data encoding, feature maps, kernels, and hybrid models.', ['Quantum data', 'Feature maps', 'Variational classifiers', 'Quantum kernels', 'Hybrid ML']],
  ['Quantum Cryptography', 'Advanced', 'Use measurement and no-cloning to reason about secure key distribution.', ['BB84', 'E91', 'No-cloning theorem', 'Eavesdropping detection', 'Post-quantum cryptography'], ['BB84 simulator']],
  ['Quantum Communication', 'Advanced', 'Connect Bell states, classical bits, and quantum network primitives.', ['Teleportation', 'Superdense coding', 'Quantum networks', 'Repeaters', 'Communication limits'], ['Teleportation lab']],
  ['Quantum Complexity', 'Advanced', 'Place quantum speedups and limitations inside complexity theory.', ['P, NP, BQP', 'Query complexity', 'Polynomial vs exponential', 'Speedups', 'Limits']],
  ['Quantum Simulation', 'Advanced', 'Model dynamics, Hamiltonians, chemistry, and many-body systems.', ['Hamiltonians', 'Time evolution', 'Schrödinger intuition', 'Variational simulation', 'Quantum chemistry']],
  ['Advanced Quantum Theory', 'Research', 'Work with operators, Hilbert spaces, spectra, and quantum information metrics.', ['Hilbert spaces', 'Hermitian operators', 'Spectral decomposition', 'Fidelity', 'Von Neumann entropy']],
  ['Advanced Quantum Algorithms', 'Research', 'Survey amplitude estimation, walks, hidden subgroups, and linear systems.', ['Amplitude estimation', 'Quantum walks', 'Quantum counting', 'HHL', 'Quantum Monte Carlo']],
  ['Error Correction and Fault Tolerance', 'Research', 'Reason about logical qubits, syndrome measurement, and fault-tolerant architectures.', ['Stabilizer formalism', 'Surface codes', 'Syndromes', 'Threshold theorem', 'Magic states']],
  ['Quantum Software Development', 'Research', 'Write, run, inspect, and transpile quantum programs with Qiskit.', ['QuantumCircuit', 'Backends', 'Simulation', 'Visualization', 'Experiments and results']],
  ['Real Quantum Hardware', 'Research', 'Prepare for device execution with calibration, queues, properties, and real noise.', ['Backends', 'Calibration', 'Queueing', 'Shots', 'Hardware-aware design']],
  ['Quantum Applications', 'Research', 'Connect quantum techniques to chemistry, optimization, cryptography, and ML.', ['Chemistry', 'Optimization', 'Cryptography', 'Machine learning', 'Quantum simulation']],
  ['Projects and Capstone', 'Research', 'Turn the learning loop into an experiment you can explain, test, and share.', ['Bell-state generator', 'Grover search', 'Teleportation', 'VQE or QAOA', 'Research project'], ['Capstone studio']],
];

export const curriculum: CurriculumLevel[] = levelData.map(([title, stage, description, topics, labs], number) => ({
  number,
  title,
  stage,
  description,
  topics,
  labs,
}));

export const classroomLessons = [
  { id: 'what-is-quantum', title: 'What is quantum computing?', level: 1, objective: 'Explain what makes quantum information different from classical information.', duration: '6 min', lab: 'Qubit explorer' },
  { id: 'qubits', title: 'Qubits & superposition', level: 2, objective: 'Read a qubit as a normalized combination of |0⟩ and |1⟩.', duration: '8 min', lab: 'Qubit explorer' },
  { id: 'measurement', title: 'Measurement & probability', level: 3, objective: 'Connect amplitudes to the probabilities observed across repeated shots.', duration: '7 min', lab: 'Measurement lab' },
  { id: 'entanglement', title: 'Entanglement', level: 7, objective: 'Recognize when a two-qubit state cannot be described independently.', duration: '10 min', lab: 'Bell state lab' },
  { id: 'interference', title: 'Interference', level: 8, objective: 'Use phase to explain why some outcomes amplify and others cancel.', duration: '9 min', lab: 'Interference lab' },
];

export const challengeCatalog = [
  { id: 'predict-h', type: 'Prediction', title: 'Predict the Hadamard', copy: 'Call the measurement pattern before the simulator reveals it.', href: '/qubit-explorer', difficulty: 'Beginner' },
  { id: 'bell-state', type: 'Circuit', title: 'Build a Bell state', copy: 'Prepare two qubits, entangle them, and explain the correlated counts.', href: '/labs/bell-state', difficulty: 'Intermediate' },
  { id: 'grover-target', type: 'Algorithm', title: 'Find the marked state', copy: 'Choose a target, amplify it, and compare the quantum and classical paths.', href: '/algorithms/grover', difficulty: 'Intermediate' },
  { id: 'phase-debug', type: 'Debug', title: 'Make phase visible', copy: 'Modify a circuit so a phase gate changes measurement probabilities.', href: '/quantum-lab', difficulty: 'Intermediate' },
];

export const labCatalog = [
  { id: 'qubit', title: 'Qubit explorer', description: 'Predict a gate, inspect amplitudes, and move the Bloch vector.', href: '/qubit-explorer', level: 'Beginner', accent: 'teal' },
  { id: 'bell', title: 'Bell state lab', description: 'Build entanglement, run real Aer counts, and compare removing H.', href: '/labs/bell-state', level: 'Intermediate', accent: 'coral' },
  { id: 'grover', title: 'Grover explorer', description: 'Select a target and watch amplitude amplification change the distribution.', href: '/algorithms/grover', level: 'Intermediate', accent: 'gold' },
  { id: 'circuit', title: 'Circuit builder', description: 'Compose gates, inspect generated Qiskit, and compare runs.', href: '/quantum-lab', level: 'Beginner', accent: 'teal' },
];