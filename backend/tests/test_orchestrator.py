"""
Pytest tests for the TaskOrchestrator — mirrors the Jest tests.
"""
import asyncio
import sys
import os
import pytest

# Add the backend directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import db
from models import TaskState, AgentConfig
from orchestrator import TaskOrchestrator


@pytest.fixture(autouse=True)
def setup_db(tmp_path, monkeypatch):
    """Use a temporary database file for each test."""
    temp_db = str(tmp_path / "test_database.json")
    monkeypatch.setattr(db, "DB_PATH", temp_db)
    db.init_db()
    yield


@pytest.mark.asyncio
async def test_full_pipeline_success():
    """Should run a full pipeline (Planner → Researcher → Writer) successfully."""
    orch = TaskOrchestrator()
    task_id = "test-id-1"

    db.insert_task(TaskState(
        id=task_id,
        prompt="testing complete flow",
        status="pending",
        created_at="2026-01-01T00:00:00",
        updated_at="2026-01-01T00:00:00",
    ))

    config = AgentConfig(pipeline=["Planner", "Researcher", "Writer"])

    # We omit Reviewer since it has a 30% rejection chance
    await orch.execute_pipeline(task_id, "testing flow", config)

    task = db.get_task(task_id)
    assert task is not None
    assert task["status"] == "completed"
    pipeline_output = task["result"]["pipelineOutput"]
    assert "Planner" in pipeline_output
    assert "Researcher" in pipeline_output
    assert "Writer" in pipeline_output
    assert "Reviewer" not in pipeline_output
    assert len(pipeline_output["Planner"]["subtasks"]) > 0


@pytest.mark.asyncio
async def test_custom_pipeline_config():
    """Should run only the agents specified in the config."""
    orch = TaskOrchestrator()
    task_id = "test-id-2"

    db.insert_task(TaskState(
        id=task_id,
        prompt="testing skipped flow",
        status="pending",
        created_at="2026-01-01T00:00:00",
        updated_at="2026-01-01T00:00:00",
    ))

    config = AgentConfig(pipeline=["Planner"])
    await orch.execute_pipeline(task_id, "test plan only", config)

    task = db.get_task(task_id)
    assert task is not None
    assert task["status"] == "completed"
    assert "Researcher" not in task["result"]["pipelineOutput"]
