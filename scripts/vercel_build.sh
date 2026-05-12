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

python scripts/sync_docs.py
python -m mkdocs build -f mkdocs.generated.yml
