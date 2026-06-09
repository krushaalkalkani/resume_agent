"""Derive a friendly PDF download name from resume profile data."""

from __future__ import annotations

import re

from src.schema import Profile, Resume


def _slug(part: str) -> str:
    part = part.strip()
    part = re.sub(r"[^\w\-]+", "_", part, flags=re.UNICODE)
    return re.sub(r"_+", "_", part).strip("_")


def resume_pdf_filename(
    profile: Profile | dict | None = None,
    *,
    resume: Resume | dict | None = None,
) -> str:
    """Return e.g. ``Krushal_Kalkani_Resume.pdf`` from profile first/last name."""
    if profile is None and resume is not None:
        if isinstance(resume, Resume):
            profile = resume.profile
        else:
            profile = resume.get("profile", {})
    if profile is None:
        profile = {}

    if isinstance(profile, Profile):
        first, last = profile.first_name, profile.last_name
    else:
        first = profile.get("first_name") or ""
        last = profile.get("last_name") or ""

    first_s, last_s = _slug(first), _slug(last)
    if first_s and last_s:
        return f"{first_s}_{last_s}_Resume.pdf"
    if first_s:
        return f"{first_s}_Resume.pdf"
    if last_s:
        return f"{last_s}_Resume.pdf"
    return "Resume.pdf"
