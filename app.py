"""Streamlit UI for the resume agent.

A thin front-end over the existing pipeline (src/render, src/compile, src/reflect):
load the saved JSON, edit it, click Generate, and preview / download the
compiled PDF along with the reflection report.

Run:  streamlit run app.py     (or via .claude/launch.json -> preview_start)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import streamlit as st
import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src import reflect  # noqa: E402
from src.compile import compile_tex, pdf_page_count, pdf_text  # noqa: E402
from src.pdf_filename import resume_pdf_filename  # noqa: E402
from src.render import render_resume  # noqa: E402
from src.schema import Resume  # noqa: E402

load_dotenv(ROOT / ".env")

OUT = ROOT / "output"
DATA = ROOT / "data" / "resume.json"

# Must be the FIRST Streamlit command in the script.
st.set_page_config(page_title="Resume Agent", page_icon="📄", layout="wide")


@st.cache_data
def load_config() -> dict:
    return yaml.safe_load((ROOT / "config.yaml").read_text())


config = load_config()

st.title("📄 Resume Agent")
st.caption("Structured data → LaTeX → PDF, with a self-check reflection step.")

# ---- Sidebar: data source ------------------------------------------------- #
st.sidebar.header("Data source")
st.sidebar.caption("Loaded from data/resume.json")


def load_resume_dict() -> dict:
    return json.loads(DATA.read_text())


if "resume_json" not in st.session_state:
    try:
        st.session_state.resume_json = json.dumps(json.loads(DATA.read_text()), indent=2)
    except Exception:
        st.session_state.resume_json = "{}"

if st.sidebar.button("🔄 Reload data"):
    try:
        st.session_state.resume_json = json.dumps(load_resume_dict(), indent=2)
        st.sidebar.success("Loaded.")
    except Exception as exc:  # noqa: BLE001
        st.sidebar.error(f"Could not load: {exc}")

st.sidebar.markdown("---")
st.sidebar.caption(f"Page limit: {config['render']['max_pages']} · Template: {config['render']['template']}")

# ---- Main: edit + generate ------------------------------------------------ #
left, right = st.columns(2, gap="large")

with left:
    st.subheader("Resume data")
    edited = st.text_area(
        "Editable JSON (matches src/schema.py)",
        value=st.session_state.resume_json,
        height=520,
    )
    generate = st.button("🚀 Generate Resume PDF", type="primary", use_container_width=True)

with right:
    st.subheader("Preview")
    if not generate:
        st.info("Edit the data on the left, then click **Generate Resume PDF**.")
    else:
        # 1) validate
        try:
            resume = Resume.model_validate(json.loads(edited))
        except Exception as exc:  # noqa: BLE001
            st.error(f"Invalid resume data: {exc}")
            st.stop()

        # persist the (possibly edited) data
        DATA.parent.mkdir(exist_ok=True)
        DATA.write_text(resume.model_dump_json(indent=2))

        # 2) render + 3) compile
        OUT.mkdir(exist_ok=True)
        tex = render_resume(resume, ROOT / "templates", config["render"]["template"])
        tex_path = OUT / f"{config['render']['output_basename']}.tex"
        tex_path.write_text(tex)

        with st.spinner("Compiling with Tectonic…"):
            result = compile_tex(tex_path, OUT)

        if not result.ok:
            st.error("Compilation failed.")
            st.code(result.log[-2000:], language="text")
            st.stop()

        # 4) reflect
        pages = pdf_page_count(result.pdf_path)
        report = reflect.check_layout(
            resume, pages, pdf_text(result.pdf_path), config["render"]["max_pages"]
        )
        if report.ok:
            st.success(f"✅ {pages} page(s) — reflection passed")
        else:
            issues = [f"{pages} pages"] if pages > config["render"]["max_pages"] else []
            issues += [f"missing: {m}" for m in report.missing_entries]
            st.warning("⚠️ " + " · ".join(issues or ["see report"]))

        # page-1 image preview (poppler)
        subprocess.run(
            ["pdftoppm", "-png", "-r", "130", "-f", "1", "-l", "1",
             str(result.pdf_path), str(OUT / "preview")],
            check=False,
        )
        preview = OUT / "preview-1.png"
        if preview.exists():
            st.image(str(preview), use_container_width=True)

        st.download_button(
            "⬇️ Download PDF",
            data=result.pdf_path.read_bytes(),
            file_name=resume_pdf_filename(resume=resume),
            mime="application/pdf",
            use_container_width=True,
        )
