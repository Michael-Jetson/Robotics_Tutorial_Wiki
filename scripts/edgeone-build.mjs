import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import https from "node:https";

const venvDir = process.env.EDGEONE_VENV_DIR || ".edgeone-venv";
const venvPython = `${venvDir}/bin/python`;

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

const commandText = (command, args) => [command, ...args].join(" ");

const tryRun = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: options.stdio || "ignore",
    env: {
      ...process.env,
      PIP_DISABLE_PIP_VERSION_CHECK: "1",
      PIP_NO_INPUT: "1",
      ...options.env,
    },
  });

  return !result.error && result.status === 0;
};

const run = (command, args) => {
  console.log(`> ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      PIP_DISABLE_PIP_VERSION_CHECK: "1",
      PIP_NO_INPUT: "1",
    },
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const download = (url, target) => new Promise((resolve, reject) => {
  const request = https.get(url, (response) => {
    if (
      response.statusCode >= 300
      && response.statusCode < 400
      && response.headers.location
    ) {
      response.resume();
      download(response.headers.location, target).then(resolve, reject);
      return;
    }

    if (response.statusCode !== 200) {
      response.resume();
      reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      return;
    }

    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", () => {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, Buffer.concat(chunks));
      resolve();
    });
  });

  request.on("error", reject);
});

const hasPip = (python) => tryRun(python, ["-m", "pip", "--version"]);

const ensurePip = async (python) => {
  if (hasPip(python)) {
    return;
  }

  console.log(`Python at ${python} has no pip module. Trying ensurepip...`);
  tryRun(python, ["-m", "ensurepip", "--upgrade"], { stdio: "inherit" });

  if (hasPip(python)) {
    return;
  }

  const getPip = ".edgeone-cache/get-pip.py";
  console.log("ensurepip is unavailable. Downloading get-pip.py...");
  await download("https://bootstrap.pypa.io/get-pip.py", getPip);
  run(python, [getPip]);

  if (!hasPip(python)) {
    console.error(`Unable to bootstrap pip for ${python}.`);
    process.exit(1);
  }
};

const createVenv = (basePython) => {
  if (existsSync(venvPython)) {
    return venvPython;
  }

  console.log(`> ${commandText(basePython, ["-m", "venv", "--without-pip", venvDir])}`);
  if (tryRun(basePython, ["-m", "venv", "--without-pip", venvDir], { stdio: "inherit" })) {
    return venvPython;
  }

  console.warn("Python venv module is unavailable. Falling back to the system Python.");
  return basePython;
};

const basePython = findPython();
let python = basePython;

if (process.env.EDGEONE_SKIP_PIP_INSTALL !== "1") {
  python = createVenv(basePython);
  await ensurePip(python);
  run(python, ["-m", "pip", "install", "-r", "requirements.txt"]);
}

run(python, ["scripts/sync_docs.py"]);
run(python, ["-m", "mkdocs", "build", "-f", "mkdocs.generated.yml"]);
