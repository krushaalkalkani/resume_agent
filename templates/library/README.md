# Template library

Your collection of resume LaTeX templates. Each template is **data-driven** —
it's filled from `data/resume.json` (which comes from Notion) and compiled to PDF
by the pipeline. Drop new ones here and switch between them in `config.yaml`.

## Files

| File | What it is |
|------|------------|
| `jake.tex.j2` | **Active.** Jake Gutierrez layout, Jinja2 + Tectonic-safe. |
| `jake.reference.tex` | The original pdfLaTeX version, kept verbatim for reference (not compiled). |
| `classic.tex.j2` | A second, lighter template you can switch to. |

## How to switch the active template

Edit `config.yaml`:

```yaml
render:
  template: "library/jake.tex.j2"   # <- change to any .tex.j2 in this folder
```

## How to add a new template

1. Take a `.tex` resume template you like and save the original here as
   `<name>.reference.tex` (optional, for reference).
2. Make a Jinja copy `<name>.tex.j2` and replace the hard-coded content with the
   template variables below.
3. Set `render.template: "library/<name>.tex.j2"` in `config.yaml`.

## Templating cheatsheet (how `<name>.tex.j2` files work)

Rendered by `src/render.py` with **custom delimiters** so the file still looks
like LaTeX:

| Syntax | Meaning |
|--------|---------|
| `\VAR{ x \| tex }` | Insert a value, LaTeX-escaped. **Always** use `\| tex` on user text. |
| `\VAR{ contact_line }` | Pre-built header line (already LaTeX) — no `tex` filter. |
| `%% for x in experience` … `%% endfor` | Loop — must be on its **own line**. |
| `%% if education` … `%% endif` | Block conditional — own line. |
| `\BLOCK{ if e.major } … \BLOCK{ endif }` | **Inline** conditional (mid-line). |
| `%# comment` | Template comment (removed from output). |
| `\| ensure_scheme` | Add `https://` to a bare URL (for `\href`). |

### Variables available

- `full_name`, `contact_line`, `profile.{summary,email,phone,location,linkedin,github,portfolio}`
- `education[]`: `school, degree, major, location, date, gpa, coursework[]`
- `experience[]`: `company, role, date, location, bullets[]`
- `projects[]`: `name, tech_stack, date, github, demo, bullets[]`
- `skills[]`: `category, skills[]`
- `certifications[]`: `name, provider`
- `leadership[]`: `title, organization, location, date`

## ⚠️ Tectonic (XeTeX) gotchas

The engine is **Tectonic** (XeTeX), not pdfLaTeX. When adapting an Overleaf template:

- **Remove** `\input{glyphtounicode}` and `\pdfgentounicode=1` — pdfTeX-only, they
  error under XeTeX. (XeTeX already produces Unicode-clean, ATS-parsable PDFs.)
- Don't start a line with `%%` (that's the Jinja block prefix) — use `%`.
- Let the `tex` filter handle special characters (`& % $ # _ ~ ^ < >`); don't
  pre-escape them in your data.
