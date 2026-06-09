"""Reflection: critique the compiled PDF against clear criteria, then (optionally)
ask an LLM to fix problems.

Two kinds of feedback:
  1. Deterministic, code-based checks (always run, no API key needed):
        - does it compile?
        - is it within the page limit?
        - did every section's key entries actually make it into the PDF text?
  2. LLM-based auto-fix (only if ANTHROPIC_API_KEY is set):
        - given a LaTeX compile error + the .tex, return a corrected .tex.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

from .schema import Resume


def _norm(text: str) -> str:
    """Lowercase + strip non-alphanumerics, for forgiving substring matching."""
    return re.sub(r"[^a-z0-9]+", "", text.lower())


@dataclass
class LayoutReport:
    pages: int
    max_pages: int
    missing_entries: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return (
            0 < self.pages <= self.max_pages
            and not self.missing_entries
        )

    def render(self) -> str:
        lines = [f"pages: {self.pages} (limit {self.max_pages})"]
        if self.missing_entries:
            lines.append("MISSING from PDF text: " + ", ".join(self.missing_entries))
        for n in self.notes:
            lines.append(n)
        lines.append("RESULT: " + ("PASS ✅" if self.ok else "NEEDS ATTENTION ⚠️"))
        return "\n".join(lines)


def check_layout(resume: Resume, pages: int, pdf_text: str, max_pages: int) -> LayoutReport:
    """Verify the rendered PDF: page count + that key entries survived rendering."""
    norm_text = _norm(pdf_text)
    expected: list[str] = []
    expected += [e.school for e in resume.education]
    expected += [x.company for x in resume.experience]
    expected += [p.name for p in resume.projects]
    expected += [c.name for c in resume.certifications]

    missing = [name for name in expected if name and _norm(name) not in norm_text]

    report = LayoutReport(pages=pages, max_pages=max_pages, missing_entries=missing)
    if pages > max_pages:
        report.notes.append(
            f"Resume is {pages} pages; trim bullets or tighten spacing to hit {max_pages}."
        )
    return report


# --------------------------------------------------------------------------- #
# Optional LLM auto-fix for LaTeX compile errors.
# --------------------------------------------------------------------------- #

def can_use_llm() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def fix_latex_with_llm(tex_source: str, compile_log: str, model: str) -> str:
    """Ask Claude to repair a LaTeX document that failed to compile.

    Returns corrected LaTeX source. Raises if the SDK/key is unavailable.
    """
    import anthropic

    client = anthropic.Anthropic()
    prompt = (
        "You are a LaTeX expert. The following LaTeX document failed to compile. "
        "Return ONLY the corrected, complete LaTeX source — no explanation, no code "
        "fences. Keep the content identical; only fix what breaks compilation "
        "(unescaped characters, missing braces, bad commands).\n\n"
        f"=== COMPILE LOG (tail) ===\n{compile_log[-3000:]}\n\n"
        f"=== LATEX SOURCE ===\n{tex_source}"
    )
    msg = client.messages.create(
        model=model,
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}],
    )
    out = "".join(block.text for block in msg.content if block.type == "text")
    # strip accidental code fences just in case
    out = re.sub(r"^```(?:latex|tex)?\n|\n```$", "", out.strip())
    return out
