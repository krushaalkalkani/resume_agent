"""LaTeX compilation + PDF readback.

These are the deterministic "external feedback" tools the reflection step relies
on: compile the .tex with Tectonic, then read the resulting PDF back with poppler
(pdftotext / pdfinfo) so we can check page count and that all content survived.
"""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CompileResult:
    ok: bool
    pdf_path: Path | None
    log: str


def _require(tool: str) -> None:
    if shutil.which(tool) is None:
        raise RuntimeError(
            f"'{tool}' not found on PATH. Install it first "
            f"(brew install tectonic poppler)."
        )


def compile_tex(tex_path: Path, out_dir: Path) -> CompileResult:
    """Compile a .tex file to PDF with Tectonic. Returns (ok, pdf_path, log)."""
    if shutil.which("tectonic") is None:
        return CompileResult(
            ok=False,
            pdf_path=None,
            log="LaTeX engine 'tectonic' is not available on the server. "
            "PDF generation is temporarily unavailable.",
        )
    out_dir.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        ["tectonic", str(tex_path), "--outdir", str(out_dir), "--keep-logs"],
        capture_output=True,
        text=True,
    )
    log = (proc.stdout or "") + (proc.stderr or "")
    pdf_path = out_dir / (tex_path.stem + ".pdf")
    ok = proc.returncode == 0 and pdf_path.exists()
    return CompileResult(ok=ok, pdf_path=pdf_path if ok else None, log=log)


def pdf_page_count(pdf_path: Path) -> int:
    _require("pdfinfo")
    proc = subprocess.run(["pdfinfo", str(pdf_path)], capture_output=True, text=True)
    for line in proc.stdout.splitlines():
        if line.lower().startswith("pages:"):
            return int(line.split(":", 1)[1].strip())
    return -1


def pdf_text(pdf_path: Path) -> str:
    """Extract the visible text of the PDF (what an ATS / recruiter would read)."""
    _require("pdftotext")
    proc = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"], capture_output=True, text=True
    )
    return proc.stdout
