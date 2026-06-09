# Resume Agent

Generate a clean, ATS-friendly **LaTeX → PDF resume** from your structured data in
**Notion**. The agent fetches your career data, validates it, renders a LaTeX
template, compiles a PDF with Tectonic, then **reads the PDF back to check itself**
(page count + that every entry actually made it onto the page).

> Built with the Agentic AI Builder skill. Patterns used: **tool use** (Notion +
> LaTeX compiler), **structured output** (Pydantic data contract), and
> **reflection with external feedback** (compile → read PDF back → critique → fix).

---

## Pipeline

```
Notion (7 source DBs)            <- your single source of truth
   │  fetch_notion.py  (notion-client)
   ▼
data/resume.json                 <- validated against src/schema.py (Pydantic)
   │  render.py  (Jinja2, LaTeX-safe delimiters)
   ▼
output/resume.tex
   │  compile.py  (Tectonic)              ┌─ compile error? ─► reflect.fix_latex_with_llm ─┐
   ▼                                      │                                                │
output/resume.pdf  ◄────────────────────┘   (auto-fix loop, needs ANTHROPIC_API_KEY)  ◄──┘
   │  reflect.check_layout  (pdfinfo / pdftotext)
   ▼
Reflection report: 1 page? all sections present?  PASS / NEEDS ATTENTION
```

## Your Notion structure (auto-discovered)

All under the **Resume Data Base** page; each child page holds one inline database.
The IDs live in [`config.yaml`](config.yaml):

| Section | Title field | Other fields |
|---|---|---|
| Personal Information | `Information` | `Text` (key/value rows → Profile) |
| Education | `School/Institution Name` | `Degree`, `Major`, `Location`, `Date`, `GPA` |
| Technical Skills | `Category` | `Skills` (comma list) |
| Experience | `Organization/Company Name` | `Role`, `Date`, `Location`, `Job Description` |
| Projects | `Project Name` | `Tech Stack`, `Description`, `Github Link`, `Live Demo Link`, `Date` |
| Certifications | `Certification Name` | `Provider` |
| Leadership | `Role/Title` | `Organization`, `Location`, `Date` |

Bullets are read from a row's **page body** (bulleted list) if present, otherwise
from the `Job Description` / `Description` text field (split on newlines and `<br>`).

---

## Setup

### 1. Install the toolchain (one time)
```bash
brew install tectonic poppler        # LaTeX engine + pdftotext/pdfinfo
pip install -r requirements.txt
```

### 2. Create a Notion integration & connect it
1. Go to <https://www.notion.so/my-integrations> → **New integration** (internal).
2. Copy the **Internal Integration Secret**.
3. Open your **Resume Data Base** page in Notion → `•••` menu → **Connections** →
   add your integration. (This shares the page *and all child databases* with it.)

### 3. Add your secrets
```bash
cp .env.example .env
# edit .env and paste your NOTION_TOKEN (and ANTHROPIC_API_KEY if you want auto-fix)
```

---

## Usage

```bash
# Fetch live from Notion → resume.pdf
python generate_resume.py

# Skip Notion and render from a saved JSON (fast iteration on layout)
python generate_resume.py --from-json data/resume.json

# Skip the LLM auto-fix loop (pure code path; no API key needed)
python generate_resume.py --no-reflect
```

Outputs land in `output/` (`resume.tex`, `resume.pdf`) and the fetched data is
saved to `data/resume.json` so you can inspect or hand-edit it.

---

## Project layout

```
resume_agent/
├── generate_resume.py     # CLI orchestrator
├── config.yaml            # Notion DB ids, model names, page limit
├── src/
│   ├── schema.py          # Pydantic data contract (the source of truth)
│   ├── fetch_notion.py    # Notion -> Resume
│   ├── render.py          # Resume -> .tex  (LaTeX-safe Jinja env + escaping)
│   ├── compile.py         # Tectonic compile + PDF readback
│   └── reflect.py         # layout checks + LLM LaTeX auto-fix
├── templates/resume.tex.j2
├── evals/run_evals.py     # code-based checks over example inputs
├── data/resume.json       # last fetched data
└── output/                # resume.tex, resume.pdf
```

---

## Roadmap

- **Phase 1 — Master resume (DONE).** Notion → validated JSON → LaTeX → 1-page PDF
  with a reflection report.
- **Phase 2 — Reflection hardening.** Auto-fix LaTeX compile errors via Claude
  (wired; set `ANTHROPIC_API_KEY`), plus richer layout heuristics.
- **Phase 3 — Job tailoring (`--job job.txt`).** Given a job description, an LLM
  selects the most relevant experience/projects, rewrites bullets toward the role,
  and trims to one page — with a **no-fabrication guardrail** (every claim must
  trace back to `data/resume.json`). See `src/tailor.py` (TODO).
- **Phase 4 — Evals.** Grow `evals/run_evals.py`: compiles, single-page, all
  `include` entries present, no fabricated claims (Phase 3), JD keyword coverage.

### Nice-to-have enhancements
- Add an `Order` number + `Include` checkbox to the Experience/Projects DBs for
  explicit ordering and one-click inclusion control.
- Add a `coursework` field to Education (your FAU page body already lists it).
- Write the finished PDF back into the **All Resume** database via the Notion API.
```
