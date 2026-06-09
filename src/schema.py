"""Pydantic data contract for the resume.

This is the single source of truth that both the Notion fetcher (input) and the
LaTeX renderer (output) agree on. Validating here means a malformed Notion row
fails loudly *before* we try to compile a broken PDF.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Profile(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""          # full or short URL
    github: str = ""
    portfolio: str = ""
    summary: str = ""           # optional headline / objective

    @property
    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name or "Your Name"


class EducationItem(BaseModel):
    school: str
    degree: str = ""
    major: str = ""
    location: str = ""
    date: str = ""
    gpa: float | None = None
    coursework: list[str] = Field(default_factory=list)


class SkillCategory(BaseModel):
    category: str
    skills: list[str] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    company: str
    role: str = ""
    date: str = ""
    location: str = ""
    bullets: list[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    name: str
    tech_stack: str = ""
    date: str = ""
    github: str = ""
    demo: str = ""
    bullets: list[str] = Field(default_factory=list)


class CertificationItem(BaseModel):
    name: str
    provider: str = ""


class LeadershipItem(BaseModel):
    title: str
    organization: str = ""
    location: str = ""
    date: str = ""


class Resume(BaseModel):
    profile: Profile = Field(default_factory=Profile)
    education: list[EducationItem] = Field(default_factory=list)
    skills: list[SkillCategory] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    leadership: list[LeadershipItem] = Field(default_factory=list)

    def section_summary(self) -> dict[str, int]:
        """Counts per section — used by the reflection step to sanity-check output."""
        return {
            "education": len(self.education),
            "skills": len(self.skills),
            "experience": len(self.experience),
            "projects": len(self.projects),
            "certifications": len(self.certifications),
            "leadership": len(self.leadership),
        }
