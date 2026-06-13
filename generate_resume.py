#!/usr/bin/env python3
"""Resume agent CLI.

Pipeline: structured JSON -> validate -> render LaTeX -> compile PDF -> reflect.

Usage:
    python generate_resume.py
    python generate_resume.py --from-json data/resume.json
    python generate_resume.py --no-reflect
    python generate_resume.py --job job.txt

Outputs land in output/ (resume.tex, resume.pdf). The resume data is read from
data/resume.json by default so it can be edited by hand or through the web UI.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src import reflect  # noqa: E402
from src.compile import compile_tex, pdf_page_count, pdf_text  # noqa: E402
from src.render import render_resume  # noqa: E402
from src.schema import Resume  # noqa: E402

MAX_FIX_ATTEMPTS = 2


def load_config() -> dict:
    with open(ROOT / "config.yaml") as f:
        return yaml.safe_load(f)


def get_resume(args, config) -> Resume:
    source = Path(args.from_json) if args.from_json else ROOT / "data" / "resume.json"
    if not source.exists():
        raise FileNotFoundError(
            f"Resume data not found: {source}. Create it in the web editor or pass --from-json."
        )
    data = json.loads(source.read_text())
    return Resume.model_validate(data)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a LaTeX/PDF resume from structured JSON.")
    parser.add_argument("--from-json", help="Load resume data from a JSON file.")
    parser.add_argument("--job", help="Path to a job description to tailor to.")
    parser.add_argument("--no-reflect", action="store_true", help="Skip the LLM auto-fix loop.")
    parser.add_argument("--out", help="Output directory (default: output/).")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    config = load_config()
    out_dir = Path(args.out) if args.out else ROOT / "output"
    out_dir.mkdir(parents=True, exist_ok=True)
    basename = config["render"]["output_basename"]
    max_pages = config["render"]["max_pages"]

    # 1) data
    resume = get_resume(args, config)
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "resume.json").write_text(resume.model_dump_json(indent=2))
    print(f"   data: {resume.section_summary()}")

    if args.job:
        from src.tailor import can_tailor, tailor_resume

        if not can_tailor():
            print("✗ --job requires ANTHROPIC_API_KEY in .env")
            return 1
        jd = Path(args.job).read_text()
        print(f"→ Tailoring resume to job description ({len(jd)} chars) …")
        result = tailor_resume(resume, jd, config["models"]["tailor"])
        resume = result.resume
        tailored_path = ROOT / "data" / "resume-tailored.json"
        tailored_path.write_text(resume.model_dump_json(indent=2))
        print(f"   focus: {result.summary.job_focus}")
        print(f"   notes: {result.summary.notes}")

    # 2) render
    tex = render_resume(resume, ROOT / "templates", config["render"]["template"])
    tex_path = out_dir / f"{basename}.tex"
    tex_path.write_text(tex)
    print(f"→ Rendered LaTeX: {tex_path}")

    # 3) compile (+ optional reflective auto-fix)
    result = compile_tex(tex_path, out_dir)
    attempt = 0
    while not result.ok and not args.no_reflect and reflect.can_use_llm() and attempt < MAX_FIX_ATTEMPTS:
        attempt += 1
        print(f"→ Compile failed; asking Claude to fix LaTeX (attempt {attempt}) …")
        fixed = reflect.fix_latex_with_llm(tex, result.log, config["models"]["reflect"])
        tex = fixed
        tex_path.write_text(tex)
        result = compile_tex(tex_path, out_dir)

    if not result.ok:
        print("✗ Compilation failed. Tail of log:\n" + result.log[-1500:])
        return 1
    print(f"✓ Compiled PDF: {result.pdf_path}")

    # 4) reflect: layout + content survival check
    pages = pdf_page_count(result.pdf_path)
    text = pdf_text(result.pdf_path)
    report = reflect.check_layout(resume, pages, text, max_pages)
    print("\n── Reflection report ──")
    print(report.render())

    print(f"\nDone. Open: {result.pdf_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
