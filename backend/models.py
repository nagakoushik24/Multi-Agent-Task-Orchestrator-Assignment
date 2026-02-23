"""
Data models for the Multi-Agent Task Orchestrator.
"""
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class TaskState:
    id: str
    prompt: str
    status: str  # 'pending' | 'in_progress' | 'completed' | 'failed'
    created_at: str
    updated_at: str
    result: Optional[dict] = None

    def to_dict(self) -> dict:
        d = {
            "id": self.id,
            "prompt": self.prompt,
            "status": self.status,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.result is not None:
            d["result"] = self.result
        return d

    @staticmethod
    def from_dict(d: dict) -> "TaskState":
        return TaskState(
            id=d["id"],
            prompt=d["prompt"],
            status=d["status"],
            created_at=d.get("createdAt", d.get("created_at", "")),
            updated_at=d.get("updatedAt", d.get("updated_at", "")),
            result=d.get("result"),
        )


@dataclass
class TaskEvent:
    id: str
    task_id: str
    agent_name: str
    event_type: str  # 'start' | 'success' | 'error' | 'retry' | 'info'
    message: str
    created_at: str
    details: Optional[str] = None

    def to_dict(self) -> dict:
        d = {
            "id": self.id,
            "taskId": self.task_id,
            "agentName": self.agent_name,
            "eventType": self.event_type,
            "message": self.message,
            "createdAt": self.created_at,
        }
        if self.details is not None:
            d["details"] = self.details
        return d

    @staticmethod
    def from_dict(d: dict) -> "TaskEvent":
        return TaskEvent(
            id=d["id"],
            task_id=d.get("taskId", d.get("task_id", "")),
            agent_name=d.get("agentName", d.get("agent_name", "")),
            event_type=d.get("eventType", d.get("event_type", "")),
            message=d["message"],
            created_at=d.get("createdAt", d.get("created_at", "")),
            details=d.get("details"),
        )


@dataclass
class AgentConfig:
    pipeline: list = field(default_factory=lambda: ["Planner", "Researcher", "Writer", "Reviewer"])


@dataclass
class AgentContext:
    task_id: str
    prompt: str
    state: dict = field(default_factory=dict)
    config: AgentConfig = field(default_factory=AgentConfig)
