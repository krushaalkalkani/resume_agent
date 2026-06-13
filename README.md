# Resume Agent

Generate a clean, ATS-friendly **LaTeX -> PDF resume** from structured resume
data. The app validates the data, renders a LaTeX template, compiles a PDF with
Tectonic, then **reads the PDF back to check itself** for page count and missing
entries.

> Built with the Agentic AI Builder skill. Patterns used: **structured output**
> (Pydantic data contract), **code execution** (LaTeX compile + PDF parsing), and
> **reflection with external feedback** (compile -> read PDF back -> critique).

---

## Pipeline

```text
data/resume.json or web editor      <- master resume source
   |
   v
src/schema.py                       <- validates the data contract
   |
   v
templates/*.tex.j2                  <- Jinja2 LaTeX template
   |
   v
output/resume.tex
   |
   v
output/resume.pdf                   <- compiled with Tectonic
   |
   v
reflect.check_layout                <- pdfinfo + pdftotext self-check

Reflection report: 1 page? all sections present? PASS / NEEDS ATTENTION
```

## Data Model

The master resume lives as one structured JSON document at `data/resume.json`.
It is validated by `src/schema.py`.

Sections:

| Section | Purpose |
|---|---|
| `profile` | Name, contact links, location, summary |
| `education` | Schools, degrees, dates, GPA, coursework |
| `skills` | Skill categories and individual skills |
| `experience` | Company, role, location, date, bullets |
| `projects` | Project name, tech stack, links, bullets |
| `certifications` | Certification name and provider |
| `leadership` | Leadership roles and organizations |

---

## Setup

### 1. Install the toolchain

```bash
brew install tectonic poppler
pip install -r requirements.txt
```

### 2. Optional environment variables

Create `.env` only for features that need external services:

```bash
# Claude-powered tailoring and LaTeX auto-fix
ANTHROPIC_API_KEY=

# Optional production accounts and persistence
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
CORS_ORIGINS=
```

The core JSON -> PDF path does not need an API key.

---

## Usage

```bash
# Generate output/resume.pdf from data/resume.json
python generate_resume.py

# Generate from another JSON file
python generate_resume.py --from-json path/to/resume.json

# Skip the LLM auto-fix loop
python generate_resume.py --no-reflect

# Tailor to a job description, requires ANTHROPIC_API_KEY
python generate_resume.py --job job.txt
```

Run the API and React app:

```bash
python3 -m uvicorn api:app --reload --port 8000
cd web && npm run dev
```

Run the Streamlit editor:

```bash
streamlit run app.py
```

---

## Project Layout

```text
resume_agent/
├── generate_resume.py     # CLI orchestrator
├── api.py                 # FastAPI backend for the React app
├── app.py                 # Streamlit local editor
├── config.yaml            # model names, template, page limit
├── src/
│   ├── schema.py          # Pydantic data contract
│   ├── render.py          # Resume -> .tex
│   ├── compile.py         # Tectonic compile + PDF readback
│   ├── reflect.py         # layout checks + LLM LaTeX auto-fix
│   ├── tailor.py          # job-description tailoring
│   └── repository.py      # local JSON or Supabase persistence
├── templates/
│   └── library/           # resume templates
├── evals/                 # code-based checks
├── data/resume.json       # master resume data
├── output/                # generated .tex, .pdf, previews
└── web/                   # Vite + React frontend
```

---

## Roadmap

- **Phase 1 - Master resume.** Structured JSON -> validated schema -> LaTeX ->
  one-page PDF with a reflection report.
- **Phase 2 - Local/web editing.** Edit the master resume in the app, upload JSON,
  save changes, and regenerate PDFs.
- **Phase 3 - Job tailoring.** Given a job description, select the most relevant
  experience/projects, rewrite bullets toward the role, and trim to one page with
  a no-fabrication guardrail.
- **Phase 4 - Evals.** Track compile success, single-page pass rate, all entries
  present, no fabricated claims, and job-description keyword coverage.

## Verification

```bash
python3 -m compileall -q generate_resume.py api.py app.py src evals
python3 generate_resume.py --from-json data/resume.json --no-reflect
python3 evals/run_evals.py
PYTHONPATH=. python3 evals/test_rendering.py
cd web && npm run build
```
