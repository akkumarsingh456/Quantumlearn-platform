"""Safe, data-only Qiskit/Aer executor for the QuantumLearn lab.

The API never evaluates learner-provided Python. It accepts a small validated
circuit model and builds the Qiskit circuit itself.
"""

from __future__ import annotations

import json
import sys
import time
from typing import Any

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator


ALLOWED_GATES = {"H", "X", "Y", "Z", "S", "T", "CX", "CNOT", "CZ", "RX", "RY", "RZ"}
MAX_QUBITS = 5
MAX_SHOTS = 4096


def fail(message: str) -> None:
    print(json.dumps({"ok": False, "errors": [message]}))
    raise SystemExit(0)


def number(value: Any, default: float = 0.0) -> float:
    if isinstance(value, (int, float)) and value == value:
        return float(value)
    return default


def validate(payload: Any) -> tuple[int, list[dict[str, Any]], bool, int]:
    if not isinstance(payload, dict):
        fail("The request must contain a circuit object.")
    qubits = payload.get("numQubits", payload.get("num_qubits"))
    if not isinstance(qubits, int) or qubits < 1 or qubits > MAX_QUBITS:
        fail(f"numQubits must be an integer from 1 to {MAX_QUBITS}.")
    gates = payload.get("gates")
    if not isinstance(gates, list) or len(gates) > 32:
        fail("A circuit must contain 0 to 32 supported gates.")
    for gate in gates:
        if not isinstance(gate, dict) or gate.get("type") not in ALLOWED_GATES:
            fail("The circuit contains an unsupported gate.")
        gate_type = gate["type"]
        for key in ("qubit", "control", "target"):
            if key in gate and (not isinstance(gate[key], int) or gate[key] < 0 or gate[key] >= qubits):
                fail("A gate references a qubit outside the circuit.")
        if gate_type in {"CX", "CNOT", "CZ"} and (
            not isinstance(gate.get("control"), int)
            or not isinstance(gate.get("target"), int)
            or gate["control"] == gate["target"]
        ):
            fail("Controlled gates require different control and target qubits.")
        if gate_type in {"RX", "RY", "RZ"} and "qubit" not in gate:
            fail("Rotation gates require a target qubit.")
    measure = bool(payload.get("measure", True))
    shots = payload.get("shots", 512)
    if not isinstance(shots, int):
        shots = 512
    return qubits, gates, measure, max(16, min(MAX_SHOTS, shots))


def apply_gate(qc: QuantumCircuit, gate: dict[str, Any]) -> None:
    gate_type = gate["type"]
    qubit = gate.get("qubit", 0)
    if gate_type == "H":
        qc.h(qubit)
    elif gate_type == "X":
        qc.x(qubit)
    elif gate_type == "Y":
        qc.y(qubit)
    elif gate_type == "Z":
        qc.z(qubit)
    elif gate_type == "S":
        qc.s(qubit)
    elif gate_type == "T":
        qc.t(qubit)
    elif gate_type in {"CX", "CNOT"}:
        qc.cx(gate["control"], gate["target"])
    elif gate_type == "CZ":
        qc.cz(gate["control"], gate["target"])
    elif gate_type == "RX":
        qc.rx(number(gate.get("angle")), qubit)
    elif gate_type == "RY":
        qc.ry(number(gate.get("angle")), qubit)
    elif gate_type == "RZ":
        qc.rz(number(gate.get("angle")), qubit)


def qiskit_code(num_qubits: int, gates: list[dict[str, Any]], measure: bool, shots: int) -> str:
    lines = [
        "from qiskit import QuantumCircuit",
        "from qiskit_aer import AerSimulator",
        "",
        f"qc = QuantumCircuit({num_qubits}, {num_qubits if measure else 0})",
    ]
    for gate in gates:
        gate_type = gate["type"]
        if gate_type == "H":
            lines.append(f"qc.h({gate['qubit']})")
        elif gate_type == "X":
            lines.append(f"qc.x({gate['qubit']})")
        elif gate_type == "Y":
            lines.append(f"qc.y({gate['qubit']})")
        elif gate_type == "Z":
            lines.append(f"qc.z({gate['qubit']})")
        elif gate_type == "S":
            lines.append(f"qc.s({gate['qubit']})")
        elif gate_type == "T":
            lines.append(f"qc.t({gate['qubit']})")
        elif gate_type in {"CX", "CNOT"}:
            lines.append(f"qc.cx({gate['control']}, {gate['target']})")
        elif gate_type == "CZ":
            lines.append(f"qc.cz({gate['control']}, {gate['target']})")
        elif gate_type in {"RX", "RY", "RZ"}:
            lines.append(f"qc.{gate_type.lower()}({number(gate.get('angle'))}, {gate['qubit']})")
    if measure:
        lines.extend(["qc.measure_all()", "", f"simulator = AerSimulator()", f"result = simulator.run(qc, shots={shots}).result()", "counts = result.get_counts()", "print(counts)"])
    return "\n".join(lines)


def main() -> None:
    try:
        payload = json.loads(sys.stdin.read())
        num_qubits, gates, measure, shots = validate(payload)
        circuit = QuantumCircuit(num_qubits, num_qubits if measure else 0)
        for gate in gates:
            apply_gate(circuit, gate)
        statevector = Statevector.from_instruction(circuit)
        probabilities = {
            format(index, f"0{num_qubits}b"): round(float(abs(amplitude) ** 2), 8)
            for index, amplitude in enumerate(statevector.data)
            if abs(amplitude) ** 2 > 1e-8
        }
        counts: dict[str, int] = {}
        if measure:
            measured = circuit.copy()
            measured.measure_all()
            started = time.perf_counter()
            result = AerSimulator().run(measured, shots=shots, seed_simulator=7).result()
            counts = {key: int(value) for key, value in result.get_counts().items()}
            execution_ms = round((time.perf_counter() - started) * 1000, 2)
        else:
            execution_ms = 0.0
        print(json.dumps({
            "ok": True,
            "numQubits": num_qubits,
            "probabilities": probabilities,
            "counts": counts,
            "shots": shots if measure else 0,
            "statevector": [
                {
                    "basis": format(index, f"0{num_qubits}b"),
                    "re": round(float(amplitude.real), 8),
                    "im": round(float(amplitude.imag), 8),
                }
                for index, amplitude in enumerate(statevector.data)
                if abs(amplitude) > 1e-8
            ],
            "code": qiskit_code(num_qubits, gates, measure, shots),
            "circuit": circuit.draw(output="text").__str__(),
            "executionMs": execution_ms,
            "errors": [],
        }))
    except SystemExit:
        raise
    except Exception as error:
        fail(f"Simulation failed safely: {error}")


if __name__ == "__main__":
    main()