"""
JSON file persistence layer — drop-in replacement for the Node.js db module.
Stores tasks and events in database.json with an in-memory cache.
"""
import json
import os
from datetime import datetime, timezone
from typing import List, Optional

from models import TaskState, TaskEvent

DB_PATH = os.path.join(os.path.dirname(__file__), "database.json")

# In-memory cache
_db = {"tasks": [], "events": []}


def init_db():
    """Load the JSON database from disk (or create it)."""
    global _db
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
                _db["tasks"] = raw.get("tasks", [])
                _db["events"] = raw.get("events", [])
        except (json.JSONDecodeError, IOError):
            _save_db()
    else:
        _save_db()


def _save_db():
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(_db, f, indent=2, ensure_ascii=False)


# ─── Task Operations ─────────────────────────────────────────────

def insert_task(task: TaskState):
    _db["tasks"].append(task.to_dict())
    _save_db()


def update_task(task_id: str, updates: dict):
    for i, t in enumerate(_db["tasks"]):
        if t["id"] == task_id:
            _db["tasks"][i].update(updates)
            _db["tasks"][i]["updatedAt"] = datetime.now(timezone.utc).isoformat()
            _save_db()
            return


def get_task(task_id: str) -> Optional[dict]:
    for t in _db["tasks"]:
        if t["id"] == task_id:
            return t
    return None


def get_all_tasks() -> List[dict]:
    return sorted(
        list(_db["tasks"]),
        key=lambda t: t.get("createdAt", ""),
        reverse=True,
    )


# ─── Event Operations ────────────────────────────────────────────

def insert_event(event: TaskEvent):
    _db["events"].append(event.to_dict())
    _save_db()


def get_events_for_task(task_id: str) -> List[dict]:
    return sorted(
        [e for e in _db["events"] if e.get("taskId") == task_id],
        key=lambda e: e.get("createdAt", ""),
    )
