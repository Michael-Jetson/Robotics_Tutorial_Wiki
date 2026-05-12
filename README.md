# Robotics Tutorial Wiki

MkDocs Material site wrapper for [Robotics_Tutorial](https://github.com/Michael-Jetson/Robotics_Tutorial).

The source documentation repository stays clean: Markdown and media are synced during build, then rendered as a Wiki-style static site.

## Local Preview

```bash
python -m pip install -r requirements.txt
DOCS_SOURCE_PATH="/home/gpf/Nutstore Files/Robotics_Tutorial" python scripts/sync_docs.py
python -m mkdocs serve -f mkdocs.generated.yml
```

## Vercel

Use the included `vercel.json`:

- Framework Preset: `Other`
- Install Command: `python -m pip install -r requirements.txt`
- Build Command: `bash scripts/vercel_build.sh`
- Output Directory: `site`

By default, the build script pulls:

```text
https://github.com/Michael-Jetson/Robotics_Tutorial.git
```

For a private source repository, add `DOCS_REPO_TOKEN` in Vercel project environment variables.
