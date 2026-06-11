"""Job-description tailoring: reorder and lightly rewrite a master resume.

Given a job description (JD) and the validated master resume JSON, Claude:
  - keeps profile + education intact
  - reorders experience / projects / skills toward JD relevance
  - may rewrite bullets to emphasize JD keywords (no new facts)
  - keeps every original entry unless trimming bullets for space

A deterministic guardrail pass rejects fabricated companies, projects, or skills.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from pydantic import BaseModel, Field

from .schema import Resume


class TailorSummary(BaseModel):
    job_focus: str = ""
    tailored: bool = False
    experience_order: list[str] = Field(default_factory=list)
    project_order: list[str] = Field(default_factory=list)
    notes: str = ""


class TailorResult(BaseModel):
    resume: Resume
    summary: TailorSummary


def can_tailor() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def _flat_skills(resume: Resume) -> set[str]:
    out: set[str] = set()
    for cat in resume.skills:
        for skill in cat.skills:
            out.add(_norm(skill))
    return out


def _entry_names(resume: Resume, section: str) -> set[str]:
    items = getattr(resume, section, [])
    if section == "experience":
        return {_norm(x.company) for x in items if x.company}
    if section == "projects":
        return {_norm(x.name) for x in items if x.name}
    if section == "education":
        return {_norm(x.school) for x in items if x.school}
    if section == "certifications":
        return {_norm(x.name) for x in items if x.name}
    if section == "leadership":
        return {_norm(x.title) for x in items if x.title}
    return set()


def validate_no_fabrication(original: Resume, tailored: Resume) -> list[str]:
    """Return human-readable violations. Empty list means OK."""
    errors: list[str] = []

    for field in ("first_name", "last_name", "email", "phone", "location", "linkedin", "github", "portfolio"):
        if getattr(tailored.profile, field) != getattr(original.profile, field):
            errors.append(f"Profile field '{field}' was changed.")

    for section in ("education", "experience", "projects", "certifications", "leadership"):
        orig = _entry_names(original, section)
        got = _entry_names(tailored, section)
        extra = got - orig
        missing = orig - got
        if extra:
            errors.append(f"Fabricated {section}: {', '.join(sorted(extra))}")
        if missing:
            errors.append(f"Dropped {section} entries: {', '.join(sorted(missing))}")

    orig_skills = _flat_skills(original)
    for cat in tailored.skills:
        for skill in cat.skills:
            if _norm(skill) not in orig_skills:
                errors.append(f"Fabricated skill: {skill}")

    orig_cats = {_norm(c.category) for c in original.skills}
    for cat in tailored.skills:
        if _norm(cat.category) not in orig_cats:
            errors.append(f"Fabricated skill category: {cat.category}")

    for section, key in (("experience", "company"), ("projects", "name")):
        orig_map = {_norm(getattr(x, key)): x for x in getattr(original, section)}
        for item in getattr(tailored, section):
            orig_item = orig_map.get(_norm(getattr(item, key)))
            if not orig_item:
                continue
            if len(item.bullets) > len(orig_item.bullets):
                errors.append(
                    f"Too many bullets for {getattr(item, key)} "
                    f"({len(item.bullets)} > {len(orig_item.bullets)})"
                )

    return errors


def _parse_json_payload(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.MULTILINE)
    return json.loads(cleaned)


def _system_prompt() -> str:
    return """You are a resume tailoring assistant. You receive:
1) A master resume as JSON (single source of truth from the candidate's database)
2) A job description (JD)

Return ONLY valid JSON with this exact shape:
{
  "resume": { ...same Resume schema as input... },
  "summary": {
    "job_focus": "short label, e.g. Frontend Engineering",
    "tailored": true,
    "experience_order": ["Company A", "Company B"],
    "project_order": ["Project X", "Project Y"],
    "notes": "2-4 sentences explaining what you prioritized"
  }
}

RULES — follow strictly:
- Profile contact fields (name, email, phone, links): copy EXACTLY from master.
- Education: keep EVERY school; do not add or remove entries.
- Experience: keep EVERY role/company from master. Reorder so JD-relevant roles appear first.
  You may rewrite bullets to emphasize JD keywords but NEVER invent employers, titles, dates,
  locations, technologies, or metrics. Each bullet must be grounded in an original bullet.
  You may drop the least-relevant bullets to help fit one page, never add new bullets.
- Projects: keep EVERY project from master. Reorder so JD-relevant projects appear first.
  Same bullet rules as experience.
- Skills: use ONLY skill strings that already exist in master. Reorder categories and skills
  so JD-relevant skills appear first. Do not invent categories or skills.
- Certifications & leadership: keep all entries; reorder if JD-relevant.
- Optional: write a short profile.summary tailored to the JD using only facts from the resume.
- If the JD is empty, generic, or does not warrant changes, set tailored=false and return
  the master resume with minimal reordering.

Output JSON only — no markdown fences, no commentary."""


def tailor_resume(master: Resume, job_description: str, model: str) -> TailorResult:
    """Tailor *master* to *job_description* using Claude."""
    jd = job_description.strip()
    if not jd:
        return TailorResult(
            resume=master,
            summary=TailorSummary(
                job_focus="General",
                tailored=False,
                experience_order=[x.company for x in master.experience],
                project_order=[p.name for p in master.projects],
                notes="No job description provided — returned master resume unchanged.",
            ),
        )

    if not can_tailor():
        raise RuntimeError("ANTHROPIC_API_KEY is not set. Add it to your .env file.")

    import anthropic

    client = anthropic.Anthropic()
    user_content = (
        "=== MASTER RESUME (source of truth) ===\n"
        f"{master.model_dump_json(indent=2)}\n\n"
        "=== JOB DESCRIPTION ===\n"
        f"{jd}\n"
    )

    msg = client.messages.create(
        model=model,
        max_tokens=8000,
        system=_system_prompt(),
        messages=[{"role": "user", "content": user_content}],
    )
    raw = "".join(block.text for block in msg.content if block.type == "text")
    payload = _parse_json_payload(raw)

    tailored = Resume.model_validate(payload["resume"])
    summary = TailorSummary.model_validate(payload.get("summary", {}))

    errors = validate_no_fabrication(master, tailored)
    if errors:
        raise ValueError("Tailoring failed guardrails: " + "; ".join(errors))

    return TailorResult(resume=tailored, summary=summary)
