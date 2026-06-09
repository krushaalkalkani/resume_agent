r"""Render a validated Resume into a .tex file using a LaTeX-safe Jinja2 environment.

LaTeX uses {{ }} and % everywhere, which collides with Jinja's defaults. We use
custom delimiters so the template still looks like LaTeX:

    \VAR{ profile.email }      -> a value (auto LaTeX-escaped via the `tex` filter)
    %% for item in experience  -> a line statement (block)
    %# this is a template comment

Every user-supplied string MUST go through the `tex` filter to escape special
characters, otherwise an `&` or `_` in your data will break compilation.
"""

from __future__ import annotations

import re
from pathlib import Path

import jinja2

from .schema import Resume

# Order matters: backslash must be handled first.
_LATEX_REPLACEMENTS = [
    ("\\", r"\textbackslash{}"),
    ("&", r"\&"),
    ("%", r"\%"),
    ("$", r"\$"),
    ("#", r"\#"),
    ("_", r"\_"),
    ("{", r"\{"),
    ("}", r"\}"),
    ("~", r"\textasciitilde{}"),
    ("^", r"\textasciicircum{}"),
    ("<", r"\textless{}"),
    (">", r"\textgreater{}"),
]


def escape_latex(value) -> str:
    """Escape a string so it is safe to drop into LaTeX body text."""
    if value is None:
        return ""
    text = str(value)
    # Protect already-escaped backslashes by doing backslash first, then the rest,
    # but avoid re-touching the backslashes we just inserted.
    out = []
    for ch in text:
        for src, dst in _LATEX_REPLACEMENTS:
            if ch == src:
                out.append(dst)
                break
        else:
            out.append(ch)
    return "".join(out)


def url_no_scheme(url: str) -> str:
    """Display form of a link: strip scheme and trailing slash, keep it readable."""
    if not url:
        return ""
    s = re.sub(r"^https?://", "", url.strip()).rstrip("/")
    return re.sub(r"^www\.", "", s)


def ensure_scheme(url: str) -> str:
    """Make a link clickable: add https:// if the user stored a bare domain."""
    if not url:
        return ""
    url = url.strip()
    if not re.match(r"^https?://", url):
        url = "https://" + url
    return url


def build_contact_line(profile) -> str:
    """Build the header contact line as ready-to-use LaTeX (already escaped).

    Joins only the fields that are present with ` $|$ ` so there are never
    dangling separators.
    """
    parts: list[str] = []
    if profile.location:
        parts.append(escape_latex(profile.location))
    if profile.phone:
        # \mbox keeps the phone number from ever wrapping mid-number.
        parts.append(r"\mbox{" + escape_latex(profile.phone) + "}")
    if profile.email:
        parts.append(
            rf"\href{{mailto:{profile.email}}}{{\underline{{{escape_latex(profile.email)}}}}}"
        )
    for url in (profile.linkedin, profile.github, profile.portfolio):
        if url:
            parts.append(
                rf"\href{{{ensure_scheme(url)}}}{{\underline{{{escape_latex(url_no_scheme(url))}}}}}"
            )
    # Breakable spaces around the separator: if the line is ever too long it wraps
    # at a separator (clean) rather than inside a field like the phone number.
    return r" $|$ ".join(parts)


def make_env(templates_dir: Path) -> jinja2.Environment:
    env = jinja2.Environment(
        block_start_string=r"\BLOCK{",
        block_end_string="}",
        variable_start_string=r"\VAR{",
        variable_end_string="}",
        comment_start_string=r"\#{",
        comment_end_string="}",
        line_statement_prefix="%%",
        line_comment_prefix="%#",
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False,
        loader=jinja2.FileSystemLoader(str(templates_dir)),
    )
    env.filters["tex"] = escape_latex
    env.filters["url_no_scheme"] = url_no_scheme
    env.filters["ensure_scheme"] = ensure_scheme
    return env


def render_resume(resume: Resume, templates_dir: Path, template_name: str) -> str:
    env = make_env(templates_dir)
    template = env.get_template(template_name)
    # expose full_name (a property) explicitly so the template can use it
    return template.render(
        profile=resume.profile,
        full_name=resume.profile.full_name,
        contact_line=build_contact_line(resume.profile),
        education=resume.education,
        skills=resume.skills,
        experience=resume.experience,
        projects=resume.projects,
        certifications=resume.certifications,
        leadership=resume.leadership,
    )
