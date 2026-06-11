"""FastAPI backend for the resume agent.

Run:  uvicorn api:app --reload --port 8000
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv
from fastapi import Body, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src import reflect  # noqa: E402
from src.auth import auth_enabled, get_current_user_id  # noqa: E402
from src.compile import compile_tex, pdf_page_count, pdf_text  # noqa: E402
from src.pdf_filename import resume_pdf_filename  # noqa: E402
from src.render import render_resume  # noqa: E402
from src.repository import ResumeRepository  # noqa: E402
from src.schema import Resume  # noqa: E402

load_dotenv(ROOT / ".env")
CONFIG = yaml.safe_load((ROOT / "config.yaml").read_text())
OUT = ROOT / "output"
DATA = ROOT / "data" / "resume.json"
OUT.mkdir(exist_ok=True)
DATA.parent.mkdir(exist_ok=True)
BASENAME = CONFIG["render"]["output_basename"]
MAX_PAGES = CONFIG["render"]["max_pages"]
REPO = ResumeRepository(DATA)

def _cors_origins() -> list[str]:
    defaults = ["http://localhost:5173", "http://127.0.0.1:5173"]
    extra = os.environ.get("CORS_ORIGINS", "")
    for origin in extra.split(","):
        origin = origin.strip()
        if origin and origin not in defaults:
            defaults.append(origin)
    return defaults


app = FastAPI(title="Resume Agent API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


def _user_out(user_id: str) -> Path:
    path = OUT / "users" / user_id if auth_enabled() else OUT
    path.mkdir(parents=True, exist_ok=True)
    return path


def _pdf_basename(variant: str) -> str:
    if variant == "tailored":
        return f"{BASENAME}-tailored"
    return BASENAME


def _preview_path(out_dir: Path, variant: str) -> Path:
    if variant == "tailored":
        return out_dir / "preview-tailored-1.png"
    return out_dir / "preview-1.png"


def _build_pdf(resume: Resume, user_id: str, *, variant: str = "master") -> dict:
    out_dir = _user_out(user_id)
    basename = _pdf_basename(variant)
    tex = render_resume(resume, ROOT / "templates", CONFIG["render"]["template"])
    tex_path = out_dir / f"{basename}.tex"
    tex_path.write_text(tex)

    result = compile_tex(tex_path, out_dir)
    if not result.ok:
        return {"ok": False, "log": result.log[-2500:]}

    pages = pdf_page_count(result.pdf_path)
    report = reflect.check_layout(resume, pages, pdf_text(result.pdf_path), MAX_PAGES)
    preview_prefix = "preview-tailored" if variant == "tailored" else "preview"
    subprocess.run(
        ["pdftoppm", "-png", "-r", "180", "-f", "1", "-l", "1",
         str(result.pdf_path), str(out_dir / preview_prefix)],
        check=False,
    )
    return {
        "ok": True,
        "pages": pages,
        "max_pages": MAX_PAGES,
        "passed": report.ok,
        "missing": report.missing_entries,
        "pdf_filename": resume_pdf_filename(resume=resume),
        "variant": variant,
    }


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "auth": "supabase" if auth_enabled() else "local"}


@app.get("/api/config")
def app_config() -> dict:
    return {"auth_required": auth_enabled()}


@app.get("/api/resume")
def get_resume(user_id: str = Depends(get_current_user_id)) -> dict:
    try:
        return REPO.get_master(user_id).model_dump()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Could not load resume: {exc}") from exc


@app.post("/api/resume")
def save_resume(payload: dict = Body(...), user_id: str = Depends(get_current_user_id)) -> dict:
    try:
        resume = Resume.model_validate(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=str(exc))
    REPO.save_master(user_id, resume)
    return {"ok": True}


@app.post("/api/fetch-notion")
def fetch_notion(user_id: str = Depends(get_current_user_id)) -> dict:
    from src.fetch_notion import fetch_resume

    try:
        resume = fetch_resume(CONFIG)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc))
    REPO.save_master(user_id, resume)
    return resume.model_dump()


@app.post("/api/tailor")
def tailor_job(payload: dict = Body(...), user_id: str = Depends(get_current_user_id)):
    from src.tailor import can_tailor, tailor_resume

    job_description = (payload.get("job_description") or "").strip()
    generate_pdf = bool(payload.get("generate_pdf", True))
    refresh = bool(payload.get("refresh_from_notion", False))

    if not can_tailor():
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY is not set. Add it to your .env file.",
        )

    if refresh:
        from src.fetch_notion import fetch_resume

        try:
            master = fetch_resume(CONFIG)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=str(exc))
        REPO.save_master(user_id, master)
    else:
        master = REPO.get_master(user_id)
        if not any(master.section_summary().values()):
            raise HTTPException(
                status_code=400,
                detail="No resume data yet. Build one in the editor or import from Notion.",
            )

    try:
        result = tailor_resume(master, job_description, CONFIG["models"]["tailor"])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc))

    entry_id = REPO.save_tailored(
        user_id,
        master=master,
        tailored=result.resume,
        job_focus=result.summary.job_focus,
        jd_text=job_description,
    )

    out: dict = {
        "ok": True,
        "entry_id": entry_id,
        "resume": result.resume.model_dump(),
        "summary": result.summary.model_dump(),
        "pdf_filename": resume_pdf_filename(resume=result.resume),
    }
    if generate_pdf:
        out["pdf"] = _build_pdf(result.resume, user_id, variant="tailored")
    return JSONResponse(out)


@app.get("/api/tailored")
def list_tailored(user_id: str = Depends(get_current_user_id)) -> dict:
    return {"items": REPO.list_tailored(user_id)}


@app.post("/api/tailored/{entry_id}/generate")
def regenerate_tailored(entry_id: str, user_id: str = Depends(get_current_user_id)):
    entry = REPO.get_tailored(user_id, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Tailored resume not found.")
    try:
        resume = Resume.model_validate(entry["data"])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return JSONResponse(_build_pdf(resume, user_id, variant="tailored"))


@app.post("/api/generate")
def generate(
    payload: dict | None = Body(default=None),
    user_id: str = Depends(get_current_user_id),
):
    if payload:
        try:
            resume = Resume.model_validate(payload)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=422, detail=str(exc))
        REPO.save_master(user_id, resume)
    else:
        resume = REPO.get_master(user_id)
        if not any(resume.section_summary().values()):
            raise HTTPException(status_code=400, detail="No resume data available.")
    return JSONResponse(_build_pdf(resume, user_id))


@app.get("/api/pdf")
def get_pdf(variant: str = "master", user_id: str = Depends(get_current_user_id)):
    basename = _pdf_basename(variant)
    pdf = _user_out(user_id) / f"{basename}.pdf"
    if not pdf.exists():
        raise HTTPException(status_code=404, detail="No PDF generated yet.")
    if variant == "tailored":
        entry = REPO.get_latest_tailored(user_id)
        resume = Resume.model_validate(entry["data"]) if entry else REPO.get_master(user_id)
    else:
        resume = REPO.get_master(user_id)
    filename = resume_pdf_filename(resume=resume)
    return FileResponse(pdf, media_type="application/pdf", filename=filename)


@app.get("/api/preview.png")
def get_preview(variant: str = "master", user_id: str = Depends(get_current_user_id)):
    img = _preview_path(_user_out(user_id), variant)
    if not img.exists():
        raise HTTPException(status_code=404, detail="No preview generated yet.")
    return FileResponse(img, media_type="image/png")
