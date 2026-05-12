from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / ".generated" / "docs"
CACHE_DIR = ROOT / ".cache-docs"
LOCAL_SOURCE = Path("/home/gpf/Nutstore Files/Robotics_Tutorial")
DEFAULT_REPO = "https://github.com/Michael-Jetson/Robotics_Tutorial.git"

INCLUDE_ROOT_FILES = {"README.md", "LICENSE"}
INCLUDE_TOP_DIRS = {
    "00_项目导航",
    "01_数学",
    "02_基础",
    "03_SLAM",
    "04_移动机器人规控",
    "05_运动控制",
    "06_具身智能",
    "media",
    "media_足式RL",
    "media_足式控制",
}
EXCLUDE_PARTS = {
    ".git",
    ".github",
    ".agents",
    ".claude",
    ".codex",
    "_archive",
    "__pycache__",
}
COPY_EXTENSIONS = {
    ".md",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".pdf",
}
SITE_ASSET_DIRS = ("stylesheets", "javascripts")


def repo_url() -> str:
    url = os.environ.get("DOCS_REPO_URL", DEFAULT_REPO)
    token = os.environ.get("DOCS_REPO_TOKEN")

    if token and url.startswith("https://github.com/"):
        return url.replace(
            "https://github.com/",
            f"https://x-access-token:{token}@github.com/",
            1,
        )

    return url


def source_dir() -> Path:
    configured = os.environ.get("DOCS_SOURCE_PATH")
    if configured:
        path = Path(configured).expanduser()
        if not path.exists():
            raise FileNotFoundError(f"DOCS_SOURCE_PATH does not exist: {path}")
        return path

    if LOCAL_SOURCE.exists():
        return LOCAL_SOURCE

    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)

    subprocess.run(
        ["git", "clone", "--depth=1", repo_url(), str(CACHE_DIR)],
        check=True,
    )
    return CACHE_DIR


def should_copy(relative_path: Path) -> bool:
    parts = set(relative_path.parts)
    if parts & EXCLUDE_PARTS:
        return False

    if relative_path.name.endswith(".bak"):
        return False

    if "复制版本" in relative_path.name:
        return False

    if relative_path.parent == Path("."):
        return relative_path.name in INCLUDE_ROOT_FILES

    if relative_path.parts[0] not in INCLUDE_TOP_DIRS:
        return False

    return relative_path.suffix.lower() in COPY_EXTENSIONS


def copy_docs(source: Path) -> tuple[int, int]:
    if DOCS_DIR.exists():
        shutil.rmtree(DOCS_DIR)
    DOCS_DIR.mkdir(parents=True)

    markdown_count = 0
    asset_count = 0

    for item in source.rglob("*"):
        if not item.is_file():
            continue

        relative = item.relative_to(source)
        if not should_copy(relative):
            continue

        target = DOCS_DIR / ("project.md" if relative == Path("README.md") else relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, target)

        if relative.suffix.lower() == ".md":
            markdown_count += 1
        else:
            asset_count += 1

    return markdown_count, asset_count


def copy_site_assets() -> None:
    for dirname in SITE_ASSET_DIRS:
        source = ROOT / dirname
        if not source.exists():
            continue

        target = DOCS_DIR / dirname
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(source, target)


def write_home(markdown_count: int, asset_count: int) -> None:
    (DOCS_DIR / "index.md").write_text(
        f"""---
hide:
  - navigation
  - toc
---

# Robotics Tutorial

系统化机器人学教学文档，覆盖从数学基础、工程实现到 SLAM、规划控制、运动控制与具身智能的完整学习路径。

[开始学习](project.md){{ .md-button .md-button--primary }}
[查看目录](catalog.md){{ .md-button }}
[GitHub](https://github.com/Michael-Jetson/Robotics_Tutorial){{ .md-button }}

<div class="grid cards" markdown>

-   :material-function-variant: **数学基础**

    流形、李群、凸优化、最优控制、状态估计、强化学习理论。

    [进入模块](01_数学/数学方向总大纲.md)

-   :material-code-braces: **工程基础**

    C++ 进阶、并发、ROS2、CMake、工程化与机器人软件栈。

    [进入模块](02_基础/C++基础方向_总大纲.md)

-   :material-map-marker-path: **SLAM**

    SLAM 理论、核心库、系统精读、架构与工程化实践。

    [进入模块](03_SLAM/slam理论.md)

-   :material-routes: **移动机器人规控**

    规划、控制、TAMP、不确定性、多机器人与横切专题。

    [进入模块](04_移动机器人规控/移动机器人规控方向_总大纲.md)

-   :material-robot-industrial: **运动控制**

    足式、机械臂、复合机器人、仿真与实时控制工程。

    [进入模块](05_运动控制/运动控制方向_总大纲.md)

-   :material-brain: **具身智能**

    大模型、世界模型、VLA、动作模仿与强化学习。

    [进入模块](06_具身智能/具身智能方向_总大纲.md)

</div>

## 构建统计

- 文档页：{markdown_count}
- 媒体资源：{asset_count}

""",
        encoding="utf-8",
    )


SUMMARY_HEADING = re.compile(r"^##\s+(.+?)\s*$")
SUMMARY_ITEM = re.compile(r"^(\s*)\*\s+(?:\[([^\]]+)\]\(([^)]+)\)|(.+?))\s*$")


def nav_item(title: str, target: str | None) -> dict[str, str] | dict[str, list]:
    title = title.strip()
    if target:
        return {title: target.strip()}
    return {title: []}


def parse_summary(source: Path) -> list[dict[str, object]]:
    summary = source / "SUMMARY.md"
    if not summary.exists():
        return []

    nav: list[dict[str, object]] = []
    stack: list[tuple[int, list]] = []
    missing: list[str] = []

    for line in summary.read_text(encoding="utf-8").splitlines():
        heading = SUMMARY_HEADING.match(line)
        if heading:
            children: list = []
            nav.append({heading.group(1).strip(): children})
            stack = [(-1, children)]
            continue

        item = SUMMARY_ITEM.match(line)
        if not item or not stack:
            continue

        indent = len(item.group(1).replace("\t", "  "))
        title = item.group(2) or item.group(4) or ""
        target = item.group(3)

        if target == "README.md" and indent == 0:
            continue

        if target and not (DOCS_DIR / target).exists():
            missing.append(target)
            continue

        while stack and indent <= stack[-1][0]:
            stack.pop()

        parent = stack[-1][1] if stack else nav
        node = nav_item(title, target)
        parent.append(node)

        if target is None:
            stack.append((indent, next(iter(node.values()))))

    if missing:
        print("Skipped missing SUMMARY.md targets:")
        for target in missing[:50]:
            print(f"  - {target}")
        if len(missing) > 50:
            print(f"  ... {len(missing) - 50} more")

    return nav


def link_target(target: str) -> str:
    if target == "README.md":
        return "project.md"
    return target


def render_catalog_items(items: list[dict[str, object]], level: int = 0) -> list[str]:
    lines: list[str] = []
    details_class = "robotics-catalog-section" if level == 0 else "robotics-catalog-group"

    for item in items:
        title, value = next(iter(item.items()))
        if isinstance(value, list):
            details_attrs = f'class="{details_class}" markdown'
            if level == 0:
                details_attrs += " open"
            lines.extend(
                [
                    f"<details {details_attrs}>",
                    f"<summary>{title}</summary>",
                    "",
                ]
            )
            lines.extend(render_catalog_items(value, level + 1))
            lines.extend(["", "</details>", ""])
            continue

        lines.append(f"- [{title}]({link_target(str(value))})")

    return lines


def write_catalog(nav: list[dict[str, object]]) -> None:
    lines = [
        "# 目录索引",
        "",
        "按课程模块折叠展示，展开模块后进入对应章节。",
        "",
        *render_catalog_items(nav),
    ]
    (DOCS_DIR / "catalog.md").write_text("\n".join(lines), encoding="utf-8")


def generate_config(nav: list[dict[str, object]]) -> None:
    base = yaml.load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"), Loader=yaml.Loader)
    base["nav"] = [{"首页": "index.md"}, {"项目说明": "project.md"}, {"目录索引": "catalog.md"}, *nav]
    (ROOT / "mkdocs.generated.yml").write_text(
        yaml.dump(base, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )


def main() -> None:
    source = source_dir()
    markdown_count, asset_count = copy_docs(source)
    copy_site_assets()
    write_home(markdown_count, asset_count)
    nav = parse_summary(source)
    write_catalog(nav)
    generate_config(nav)
    print(f"Synced {markdown_count} markdown files and {asset_count} assets from {source}")


if __name__ == "__main__":
    main()
