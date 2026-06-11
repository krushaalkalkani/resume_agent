"""Resume persistence: Supabase (production) or local JSON file (dev fallback)."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.auth import auth_enabled
from src.schema import Resume


def _supabase():
    from supabase import create_client

    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


class ResumeRepository:
    def __init__(self, data_file: Path) -> None:
        self.data_file = data_file
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        self._history_file = self.data_file.parent / "tailored-history.json"

    def _load_file(self) -> Resume:
        if self.data_file.exists():
            return Resume.model_validate(json.loads(self.data_file.read_text()))
        return Resume()

    def _save_file(self, resume: Resume) -> None:
        self.data_file.write_text(resume.model_dump_json(indent=2))

    def _load_local_history(self) -> list[dict[str, Any]]:
        if not self._history_file.exists():
            return []
        return json.loads(self._history_file.read_text())

    def _save_local_history(self, items: list[dict[str, Any]]) -> None:
        self._history_file.write_text(json.dumps(items, indent=2))

    def get_master(self, user_id: str) -> Resume:
        if not auth_enabled():
            return self._load_file()

        sb = _supabase()
        rows = (
            sb.table("resumes")
            .select("data")
            .eq("user_id", user_id)
            .eq("is_master", True)
            .limit(1)
            .execute()
        )
        if rows.data:
            return Resume.model_validate(rows.data[0]["data"])
        return Resume()

    def save_master(self, user_id: str, resume: Resume) -> None:
        if not auth_enabled():
            self._save_file(resume)
            return

        sb = _supabase()
        payload = {
            "user_id": user_id,
            "name": "Master resume",
            "is_master": True,
            "data": resume.model_dump(),
        }
        existing = (
            sb.table("resumes")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_master", True)
            .limit(1)
            .execute()
        )
        if existing.data:
            sb.table("resumes").update({"data": payload["data"]}).eq("id", existing.data[0]["id"]).execute()
        else:
            sb.table("resumes").insert(payload).execute()

    def save_tailored(
        self,
        user_id: str,
        *,
        master: Resume,
        tailored: Resume,
        job_focus: str,
        jd_text: str,
    ) -> str:
        """Persist a tailored version. Returns the new entry id."""
        if not auth_enabled():
            entry_id = str(uuid.uuid4())
            history = self._load_local_history()
            history.insert(
                0,
                {
                    "id": entry_id,
                    "job_focus": job_focus,
                    "jd_text": jd_text,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "data": tailored.model_dump(),
                },
            )
            self._save_local_history(history[:50])
            tailored_file = self.data_file.parent / "resume-tailored.json"
            tailored_file.write_text(tailored.model_dump_json(indent=2))
            return entry_id

        sb = _supabase()
        master_row = (
            sb.table("resumes")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_master", True)
            .limit(1)
            .execute()
        )
        resume_id = master_row.data[0]["id"] if master_row.data else None

        row = (
            sb.table("tailored_resumes")
            .insert(
                {
                    "user_id": user_id,
                    "resume_id": resume_id,
                    "job_focus": job_focus,
                    "jd_text": jd_text,
                    "data": tailored.model_dump(),
                }
            )
            .execute()
        )
        return str(row.data[0]["id"])

    def list_tailored(self, user_id: str, limit: int = 20) -> list[dict[str, Any]]:
        if not auth_enabled():
            return [
                {"id": e["id"], "job_focus": e.get("job_focus", ""), "created_at": e.get("created_at", "")}
                for e in self._load_local_history()[:limit]
            ]

        sb = _supabase()
        rows = (
            sb.table("tailored_resumes")
            .select("id, job_focus, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return rows.data or []

    def get_tailored(self, user_id: str, entry_id: str) -> dict[str, Any] | None:
        if not auth_enabled():
            for entry in self._load_local_history():
                if entry.get("id") == entry_id:
                    return entry
            return None

        sb = _supabase()
        rows = (
            sb.table("tailored_resumes")
            .select("id, job_focus, jd_text, data, created_at")
            .eq("user_id", user_id)
            .eq("id", entry_id)
            .limit(1)
            .execute()
        )
        if not rows.data:
            return None
        row = rows.data[0]
        return {
            "id": row["id"],
            "job_focus": row.get("job_focus", ""),
            "jd_text": row.get("jd_text", ""),
            "created_at": row.get("created_at", ""),
            "data": row["data"],
        }

    def get_latest_tailored(self, user_id: str) -> dict[str, Any] | None:
        items = self.list_tailored(user_id, limit=1)
        if not items:
            return None
        return self.get_tailored(user_id, str(items[0]["id"]))
