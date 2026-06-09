"""FastAPI backend for the resume agent.

A thin HTTP layer over the existing pipeline (src/) so a React front-end can
drive it. Endpoints:

    GET  /api/health        -> {ok: true}
    GET  /api/resume        -> current resume data (data/resume.json)
    POST /api/resume        -> validate + save resume data
    POST /api/fetch-notion  -> pull data live from Notion (needs NOTION_TOKEN)
    POST /api/generate      -> render + compile + reflect; returns report
    GET  /api/pdf           -> the compiled resume.pdf
    GET  /api/preview.png   -> page-1 PNG preview

Run:  uvicorn api:app --reload --port 8000      (or via .claude/launch.json)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src import reflect  # noqa: E402
from src.compile import compile_tex, pdf_page_count, pdf_text  # noqa: E402
from src.pdf_filename import resume_pdf_filename  # noqa: E402
from src.render import render_resume  # noqa: E402
from src.schema import Resume  # noqa: E402

load_dotenv(ROOT / ".env")
CONFIG = yaml.safe_load((ROOT / "config.yaml").read_text())
OUT = ROOT / "output"
DATA = ROOT / "data" / "resume.json"
OUT.mkdir(exist_ok=True)
DATA.parent.mkdir(exist_ok=True)
BASENAME = CONFIG["render"]["output_basename"]
MAX_PAGES = CONFIG["render"]["max_pages"]

app = FastAPI(title="Resume Agent API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_pdf(resume: Resume) -> dict:
    """Render -> compile -> reflect. Returns a JSON-able report dict."""
    tex = render_resume(resume, ROOT / "templates", CONFIG["render"]["template"])
    tex_path = OUT / f"{BASENAME}.tex"
    tex_path.write_text(tex)

    result = compile_tex(tex_path, OUT)
    if not result.ok:
        return {"ok": False, "log": result.log[-2500:]}

    pages = pdf_page_count(result.pdf_path)
    report = reflect.check_layout(resume, pages, pdf_text(result.pdf_path), MAX_PAGES)
    # page-1 PNG preview for the UI
    subprocess.run(
        ["pdftoppm", "-png", "-r", "180", "-f", "1", "-l", "1",
         str(result.pdf_path), str(OUT / "preview")],
        check=False,
    )
    return {
        "ok": True,
        "pages": pages,
        "max_pages": MAX_PAGES,
        "passed": report.ok,
        "missing": report.missing_entries,
        "pdf_filename": resume_pdf_filename(resume=resume),
    }


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/resume")
def get_resume() -> dict:
    if DATA.exists():
        return json.loads(DATA.read_text())
    return Resume().model_dump()


@app.post("/api/resume")
def save_resume(payload: dict = Body(...)) -> dict:
    try:
        resume = Resume.model_validate(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=str(exc))
    DATA.write_text(resume.model_dump_json(indent=2))
    return {"ok": True}


@app.post("/api/fetch-notion")
def fetch_notion() -> dict:
    from src.fetch_notion import fetch_resume

    try:
        resume = fetch_resume(CONFIG)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc))
    DATA.write_text(resume.model_dump_json(indent=2))
    return resume.model_dump()


@app.post("/api/generate")
def generate(payload: dict | None = Body(default=None)):
    if payload:
        try:
            resume = Resume.model_validate(payload)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=422, detail=str(exc))
        DATA.write_text(resume.model_dump_json(indent=2))
    elif DATA.exists():
        resume = Resume.model_validate(json.loads(DATA.read_text()))
    else:
        raise HTTPException(status_code=400, detail="No resume data available.")
    return JSONResponse(_build_pdf(resume))


def _load_saved_resume() -> Resume | None:
    if not DATA.exists():
        return None
    return Resume.model_validate(json.loads(DATA.read_text()))


@app.get("/api/pdf")
def get_pdf():
    pdf = OUT / f"{BASENAME}.pdf"
    if not pdf.exists():
        raise HTTPException(status_code=404, detail="No PDF generated yet.")
    resume = _load_saved_resume()
    filename = resume_pdf_filename(resume=resume) if resume else "Resume.pdf"
    return FileResponse(pdf, media_type="application/pdf", filename=filename)


@app.get("/api/preview.png")
def get_preview():
    img = OUT / "preview-1.png"
    if not img.exists():
        raise HTTPException(status_code=404, detail="No preview generated yet.")
    return FileResponse(img, media_type="image/png")
