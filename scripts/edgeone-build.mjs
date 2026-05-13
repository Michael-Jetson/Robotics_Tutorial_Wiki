import { spawnSync } from "node:child_process";

const findPython = () => {
  const candidates = process.env.PYTHON
    ? [process.env.PYTHON]
    : [".venv/bin/python", "python3", "python"];

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["--version"], { stdio: "ignore" });
    if (!result.error && result.status === 0) {
      return candidate;
    }
  }

  console.error("No Python executable found. Set PYTHON or use a build image with python3.");
  process.exit(1);
};

const run = (command, args) => {
  console.log(`> ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit" });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const python = findPython();

if (process.env.EDGEONE_SKIP_PIP_INSTALL !== "1") {
  run(python, ["-m", "pip", "install", "-r", "requirements.txt"]);
}

run(python, ["scripts/sync_docs.py"]);
run(python, ["-m", "mkdocs", "build", "-f", "mkdocs.generated.yml"]);
