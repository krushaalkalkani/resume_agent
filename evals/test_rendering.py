from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from src.compile import compile_tex
from src.render import render_resume
from src.schema import Profile, ProjectItem, Resume


ROOT = Path(__file__).resolve().parent.parent


@unittest.skipIf(shutil.which("tectonic") is None, "tectonic is not installed")
class RenderResumeTests(unittest.TestCase):
    def test_urls_with_latex_special_chars_compile(self) -> None:
        resume = Resume(
            profile=Profile(
                first_name="URL",
                last_name="Case",
                email="first_last@example.com",
                github="github.com/user/repo_with_under_score?x=1&y=two%20words#readme",
            ),
            projects=[
                ProjectItem(
                    name="URL Test",
                    github="github.com/user/repo_with_under_score?x=1&y=two%20words#readme",
                    demo="example.com/demo_path?utm_source=a&tag=100%25#section",
                )
            ],
        )

        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            tex_path = tmp_dir / "resume.tex"
            tex_path.write_text(render_resume(resume, ROOT / "templates", "resume.tex.j2"))

            result = compile_tex(tex_path, tmp_dir)

        self.assertTrue(result.ok, result.log[-1500:])


if __name__ == "__main__":
    unittest.main()
