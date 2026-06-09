#!/usr/bin/env python3
"""Code-based evals for the resume agent.

For each resume JSON, render -> compile -> read back, then score objective checks:
  - compiles            (PDF produced)
  - single_page         (<= configured max_pages)
  - all_entries_present (every school/company/project/cert appears in PDF text)

Usage:
    python evals/run_evals.py                      # evaluate data/resume.json
    python evals/run_evals.py path/to/other.json   # evaluate specific file(s)

Exit code is non-zero if any case fails — handy for CI.
"""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import yaml  # noqa: E402

from src.compile import compile_tex, pdf_page_count, pdf_text  # noqa: E402
from src.reflect import check_layout  # noqa: E402
from src.render import render_resume  # noqa: E402
from src.schema import Resume  # noqa: E402


def evaluate(json_path: Path, config: dict) -> dict:
    resume = Resume.model_validate(json.loads(json_path.read_text()))
    max_pages = config["render"]["max_pages"]
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        tex = render_resume(resume, ROOT / "templates", config["render"]["template"])
        tex_path = tmp_dir / "resume.tex"
        tex_path.write_text(tex)
        result = compile_tex(tex_path, tmp_dir)
        if not result.ok:
            return {"case": json_path.name, "compiles": False, "single_page": False,
                    "all_entries_present": False}
        pages = pdf_page_count(result.pdf_path)
        report = check_layout(resume, pages, pdf_text(result.pdf_path), max_pages)
        return {
            "case": json_path.name,
            "compiles": True,
            "single_page": 0 < pages <= max_pages,
            "all_entries_present": not report.missing_entries,
        }


def main() -> int:
    with open(ROOT / "config.yaml") as f:
        config = yaml.safe_load(f)

    paths = [Path(p) for p in sys.argv[1:]] or [ROOT / "data" / "resume.json"]
    checks = ("compiles", "single_page", "all_entries_present")

    print(f"{'case':30} " + " ".join(f"{c:20}" for c in checks))
    all_pass = True
    for path in paths:
        if not path.exists():
            print(f"{path.name:30} (missing)")
            all_pass = False
            continue
        r = evaluate(path, config)
        cells = " ".join(f"{('PASS' if r[c] else 'FAIL'):20}" for c in checks)
        print(f"{r['case']:30} {cells}")
        all_pass = all_pass and all(r[c] for c in checks)

    print("\nALL PASS ✅" if all_pass else "\nSOME FAILURES ❌")
    return 0 if all_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
