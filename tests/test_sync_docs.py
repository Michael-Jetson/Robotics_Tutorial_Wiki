from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "sync_docs.py"

spec = importlib.util.spec_from_file_location("sync_docs", MODULE_PATH)
assert spec and spec.loader
sync_docs = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = sync_docs
spec.loader.exec_module(sync_docs)


def leaf_titles(items):
    titles = []
    for item in items:
        if item.children:
            titles.extend(leaf_titles(item.children))
        elif item.target:
            titles.append(item.title)
    return titles


class SelectCatalogTests(unittest.TestCase):
    def test_public_page_url_uses_built_page_paths(self):
        self.assertEqual(
            "01_数学/数学方向_总大纲/",
            sync_docs.public_page_url("01_数学/数学方向_总大纲.md"),
        )
        self.assertEqual(
            "04_移动机器人规控/",
            sync_docs.public_page_url("04_移动机器人规控/README.md"),
        )
        self.assertEqual("project/", sync_docs.public_page_url("project.md"))
        self.assertEqual("catalog/", sync_docs.public_page_url("catalog/"))

    def test_catalog_marks_group_when_all_child_pages_are_missing(self):
        catalog = [
            sync_docs.SummaryNode(
                title="运动控制",
                children=[
                    sync_docs.SummaryNode(
                        title="20_机械臂",
                        children=[
                            sync_docs.SummaryNode("P01", target="missing/P01.md", missing=True),
                            sync_docs.SummaryNode("M01", target="missing/M01.md", missing=True),
                        ],
                    )
                ],
            )
        ]

        rendered = "\n".join(sync_docs.render_catalog_items(catalog))

        self.assertIn(
            '<summary><span class="robotics-catalog-missing">20_机械臂'
            ' <span class="robotics-catalog-badge">敬请期待</span></span></summary>',
            rendered,
        )

    def test_catalog_does_not_mark_group_when_any_child_page_exists(self):
        catalog = [
            sync_docs.SummaryNode(
                title="运动控制",
                children=[
                    sync_docs.SummaryNode(
                        title="20_机械臂",
                        children=[
                            sync_docs.SummaryNode("P01", target="missing/P01.md", missing=True),
                            sync_docs.SummaryNode("M01", target="exists/M01.md", missing=False),
                        ],
                    )
                ],
            )
        ]

        rendered = "\n".join(sync_docs.render_catalog_items(catalog))

        self.assertIn("<summary>20_机械臂</summary>", rendered)
        self.assertNotIn(
            '<summary><span class="robotics-catalog-missing">20_机械臂',
            rendered,
        )

    def test_preserves_summary_order_when_many_targets_are_missing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "source"
            docs = root / "docs"
            source.mkdir()
            docs.mkdir()

            (source / "SUMMARY.md").write_text(
                "\n".join(
                    [
                        "## 运动控制",
                        "",
                        "* 20_机械臂",
                        "  * [P01_URDF_Xacro建模_教学版](old/P01_URDF_Xacro建模_教学版.md)",
                        "  * [M01_Pinocchio深度精读](old/M01_Pinocchio深度精读.md)",
                        "  * [F01_导论_阻抗导纳二分法](old/F01_导论_阻抗导纳二分法.md)",
                        "  * [D01_导论_双臂任务分类](old/D01_导论_双臂任务分类.md)",
                    ]
                ),
                encoding="utf-8",
            )

            manipulator = docs / "05_运动控制" / "20_机械臂"
            manipulator.mkdir(parents=True)
            for filename in [
                "D01_导论_双臂任务分类.md",
                "F01_导论_阻抗导纳二分法.md",
                "M01_Pinocchio深度精读.md",
                "P01_URDF_Xacro建模_教学版.md",
            ]:
                (manipulator / filename).write_text("# Test\n", encoding="utf-8")

            original_docs_dir = sync_docs.DOCS_DIR
            sync_docs.DOCS_DIR = docs
            try:
                catalog = sync_docs.select_catalog(source)
            finally:
                sync_docs.DOCS_DIR = original_docs_dir

        self.assertEqual(
            [
                "P01_URDF_Xacro建模_教学版",
                "M01_Pinocchio深度精读",
                "F01_导论_阻抗导纳二分法",
                "D01_导论_双臂任务分类",
            ],
            leaf_titles(catalog),
        )


if __name__ == "__main__":
    unittest.main()
