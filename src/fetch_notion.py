"""Fetch the resume source data from Notion and build a validated Resume object.

Reads the 7 inline databases under your "Resume Data Base" page (ids live in
config.yaml), pulls both the row properties AND each row's page body (so bullets
written as a bulleted list inside an Experience/Project page are captured), maps
the Personal Information key/value rows into a Profile, and validates everything
against src/schema.py.

Requires NOTION_TOKEN in the environment and the integration to be connected to
the "Resume Data Base" page.
"""

from __future__ import annotations

import os
import re
from typing import Any

from notion_client import Client

from .schema import (
    CertificationItem,
    EducationItem,
    ExperienceItem,
    LeadershipItem,
    ProjectItem,
    Profile,
    Resume,
    SkillCategory,
)

# We use the notion-client SDK default API version, which speaks the new
# "data sources" API (databases.query was removed in favor of data_sources.query).


# --------------------------------------------------------------------------- #
# Low-level Notion helpers
# --------------------------------------------------------------------------- #

def _plain(rich: list[dict]) -> str:
    return "".join(r.get("plain_text", "") for r in rich).strip()


def prop_value(prop: dict) -> Any:
    """Extract a Python value from a Notion property regardless of its type."""
    t = prop.get("type")
    if t == "title":
        return _plain(prop["title"])
    if t == "rich_text":
        return _plain(prop["rich_text"])
    if t == "number":
        return prop["number"]
    if t == "select":
        return prop["select"]["name"] if prop.get("select") else ""
    if t == "multi_select":
        return [o["name"] for o in prop.get("multi_select", [])]
    if t == "url":
        return prop.get("url") or ""
    if t == "email":
        return prop.get("email") or ""
    if t == "phone_number":
        return prop.get("phone_number") or ""
    if t == "checkbox":
        return prop.get("checkbox", False)
    if t == "date":
        d = prop.get("date") or {}
        return d.get("start") or ""
    return ""


def query_all(client: Client, database_id: str) -> list[dict]:
    """Return every row of a database across all its data sources (new Notion API).

    The database id is resolved to its data source(s) via databases.retrieve, then
    each data source is queried with pagination.
    """
    db = client.databases.retrieve(database_id=database_id)
    rows: list[dict] = []
    for ds in db.get("data_sources", []):
        cursor: str | None = None
        while True:
            kwargs = {"data_source_id": ds["id"], "page_size": 100}
            if cursor:
                kwargs["start_cursor"] = cursor
            resp = client.data_sources.query(**kwargs)
            rows.extend(resp["results"])
            if resp.get("has_more"):
                cursor = resp["next_cursor"]
            else:
                break
    return rows


def page_body_lines(client: Client, page_id: str) -> list[str]:
    """Collect non-empty text lines from a page body (bullets, paragraphs, to-dos)."""
    lines: list[str] = []
    cursor: str | None = None
    block_types = ("bulleted_list_item", "numbered_list_item", "paragraph", "to_do")
    while True:
        kwargs = {"block_id": page_id, "page_size": 100}
        if cursor:
            kwargs["start_cursor"] = cursor
        resp = client.blocks.children.list(**kwargs)
        for blk in resp["results"]:
            bt = blk.get("type")
            if bt in block_types:
                text = _plain(blk[bt].get("rich_text", []))
                if text:
                    lines.append(text)
        if resp.get("has_more"):
            cursor = resp["next_cursor"]
        else:
            break
    return lines


def split_bullets(text: str) -> list[str]:
    """Turn a multi-line text field into a clean list of bullet strings.

    Handles both real newlines and the literal ``<br>`` separators that Notion
    text fields often contain.
    """
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    out = []
    for line in text.split("\n"):
        line = re.sub(r"^\s*[-•*]\s*", "", line).strip()
        if line:
            out.append(line)
    return out


def split_csv_keep_parens(text: str) -> list[str]:
    """Split on commas/newlines, but NOT inside parentheses/brackets.

    So "Deep Learning (ANN, CNN), NLP" -> ["Deep Learning (ANN, CNN)", "NLP"].
    """
    out, cur, depth = [], "", 0
    for ch in str(text):
        if ch in "([{":
            depth += 1
            cur += ch
        elif ch in ")]}":
            depth = max(0, depth - 1)
            cur += ch
        elif ch in ",\n" and depth == 0:
            if cur.strip():
                out.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def _props(row: dict) -> dict:
    return row.get("properties", {})


def _get(row: dict, name: str, default: Any = "") -> Any:
    p = _props(row).get(name)
    return prop_value(p) if p else default


# --------------------------------------------------------------------------- #
# Profile mapping (Personal Information is a key/value table)
# --------------------------------------------------------------------------- #

_PROFILE_ALIASES = {
    "firstname": "first_name",
    "lastname": "last_name",
    "email": "email",
    "phone": "phone",
    "phonenumber": "phone",
    "mobile": "phone",
    "contact": "phone",
    "location": "location",
    "city": "location",
    "address": "location",
    "linkedin": "linkedin",
    "github": "github",
    "portfolio": "portfolio",
    "website": "portfolio",
    "summary": "summary",
    "objective": "summary",
    "about": "summary",
}


def _norm_key(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def build_profile(rows: list[dict]) -> Profile:
    data: dict[str, str] = {}
    for row in rows:
        # title prop is "Information", value prop is "Text"
        label = _get(row, "Information")
        value = _get(row, "Text")
        if not label:
            continue
        key = _norm_key(label)
        field = _PROFILE_ALIASES.get(key)
        if field is None:
            # fuzzy: pick the alias whose normalized form is contained in the label
            for alias, fld in _PROFILE_ALIASES.items():
                if alias in key:
                    field = fld
                    break
        if field and value:
            data[field] = str(value)
    # If only a single "name" field was provided, try to split it.
    if not data.get("first_name") and not data.get("last_name"):
        for row in rows:
            if _norm_key(_get(row, "Information")) in ("name", "fullname"):
                parts = str(_get(row, "Text")).split()
                if parts:
                    data["first_name"] = parts[0]
                    data["last_name"] = " ".join(parts[1:])
    return Profile(**data)


# --------------------------------------------------------------------------- #
# Section builders
# --------------------------------------------------------------------------- #

def build_education(rows: list[dict]) -> list[EducationItem]:
    items = []
    for r in rows:
        gpa = _get(r, "GPA (Out of 4)", None)
        cw = _get(r, "Coursework") or _get(r, "Relevant Coursework")
        coursework = split_csv_keep_parens(cw) if cw else []
        items.append(
            EducationItem(
                school=_get(r, "School/Institution Name"),
                degree=_get(r, "Degree"),
                major=_get(r, "Major"),
                location=_get(r, "Location (City, State)"),
                date=_get(r, "Date (month year - month year)"),
                gpa=gpa if isinstance(gpa, (int, float)) else None,
                coursework=coursework,
            )
        )
    return items


def build_skills(rows: list[dict]) -> list[SkillCategory]:
    items = []
    for r in rows:
        cat = _get(r, "Category")
        raw = _get(r, "Skills")
        skills = split_csv_keep_parens(raw)
        if cat:
            items.append(SkillCategory(category=cat, skills=skills))
    return items


def build_experience(client: Client, rows: list[dict]) -> list[ExperienceItem]:
    items = []
    for r in rows:
        bullets = page_body_lines(client, r["id"])
        if not bullets:
            bullets = split_bullets(str(_get(r, "Job Description")))
        items.append(
            ExperienceItem(
                company=_get(r, "Organization/Company Name"),
                role=_get(r, "Role"),
                date=_get(r, "Date (M Y - M Y)"),
                location=_get(r, "Location"),
                bullets=bullets,
            )
        )
    return items


def build_projects(client: Client, rows: list[dict]) -> list[ProjectItem]:
    items = []
    for r in rows:
        bullets = page_body_lines(client, r["id"])
        if not bullets:
            bullets = split_bullets(str(_get(r, "Description")))
        items.append(
            ProjectItem(
                name=_get(r, "Project Name"),
                tech_stack=_get(r, "Tech Stack"),
                date=_get(r, "Date"),
                github=_get(r, "Github Link"),
                demo=_get(r, "Live Demo Link"),
                bullets=bullets,
            )
        )
    return items


def build_certifications(rows: list[dict]) -> list[CertificationItem]:
    return [
        CertificationItem(name=_get(r, "Certification Name"), provider=_get(r, "Provider"))
        for r in rows
        if _get(r, "Certification Name")
    ]


def build_leadership(rows: list[dict]) -> list[LeadershipItem]:
    return [
        LeadershipItem(
            title=_get(r, "Role/Title"),
            organization=_get(r, "Organization"),
            location=_get(r, "Location"),
            date=_get(r, "Date"),
        )
        for r in rows
        if _get(r, "Role/Title")
    ]


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #

def fetch_resume(config: dict) -> Resume:
    token = os.environ.get("NOTION_TOKEN")
    if not token:
        raise RuntimeError("NOTION_TOKEN is not set. Add it to your .env file.")

    client = Client(auth=token)
    db = config["notion"]["databases"]

    resume = Resume(
        profile=build_profile(query_all(client, db["personal_information"])),
        education=build_education(query_all(client, db["education"])),
        skills=build_skills(query_all(client, db["technical_skills"])),
        experience=build_experience(client, query_all(client, db["experience"])),
        projects=build_projects(client, query_all(client, db["projects"])),
        certifications=build_certifications(query_all(client, db["certifications"])),
        leadership=build_leadership(query_all(client, db["leadership"])),
    )
    return resume
