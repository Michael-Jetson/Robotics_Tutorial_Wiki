#!/usr/bin/env bash
set -euo pipefail

echo "Vercel source:"
echo "  repo: ${VERCEL_GIT_REPO_OWNER:-unknown}/${VERCEL_GIT_REPO_SLUG:-unknown}"
echo "  branch: ${VERCEL_GIT_COMMIT_REF:-unknown}"
echo "  commit: ${VERCEL_GIT_COMMIT_SHA:-unknown}"
echo "  cwd: $(pwd)"

if [ -e src/__init__.py ] || [ -e pyproject.toml ] || [ -e package.json ]; then
  echo "Unexpected legacy framework files are present in the Vercel build source:"
  find . -maxdepth 2 \( -path "./src/*" -o -name "pyproject.toml" -o -name "package.json" \) -print
  exit 1
fi

PYTHON_BIN="${PYTHON_BIN:-python}"
if [ -x ".venv/bin/python" ]; then
  PYTHON_BIN=".venv/bin/python"
fi

"$PYTHON_BIN" scripts/sync_docs.py
"$PYTHON_BIN" -m mkdocs build -f mkdocs.generated.yml
