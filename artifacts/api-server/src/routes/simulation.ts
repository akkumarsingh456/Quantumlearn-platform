import { Router, type IRouter } from "express";
import { spawn } from "node:child_process";
import path from "node:path";

const router: IRouter = Router();

type CircuitPayload = {
  numQubits?: number;
  num_qubits?: number;
  gates?: unknown;
  measure?: boolean;
  shots?: number;
};

function runExecutor(payload: CircuitPayload): Promise<unknown> {
  const workspace = process.cwd();
  const child = spawn("uv", ["run", "--project", workspace, "python", path.join(workspace, "scripts", "quantum_executor.py")], {
    cwd: workspace,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
    stdio: ["pipe", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Quantum executor exited with code ${code ?? "unknown"}.`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(stderr || "Quantum executor returned invalid output."));
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

router.post("/simulate", async (req, res) => {
  if (!req.auth?.userId) {
    res.status(401).json({ error: "Sign in to run a saved quantum experiment." });
    return;
  }
  try {
    const result = await runExecutor(req.body as CircuitPayload);
    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "quantum simulation failed");
    res.status(400).json({ ok: false, errors: [error instanceof Error ? error.message : "Simulation failed."] });
  }
});

export default router;