"""
Abstract BaseAgent with retry logic, exponential backoff, and event logging.
Mirrors the TypeScript BaseAgent class.
"""
import asyncio
import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone

import db
from models import AgentContext


class BaseAgent(ABC):
    max_retries: int = 3

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    async def execute_logic(self, context: AgentContext) -> dict:
        """Implement the agent's core task."""
        ...

    async def execute(self, context: AgentContext) -> dict:
        """Run the agent with retry + exponential backoff."""
        attempt = 0

        await self._log_event(context.task_id, "start", f"Agent {self.name} started execution.")

        while attempt <= self.max_retries:
            try:
                result = await self.execute_logic(context)
                await self._log_event(
                    context.task_id, "success",
                    f"Agent {self.name} completed successfully.",
                    result,
                )
                return result
            except Exception as error:
                attempt += 1
                if attempt <= self.max_retries:
                    await self._log_event(
                        context.task_id, "retry",
                        f"Agent {self.name} failed ({error}). Retrying {attempt}/{self.max_retries}...",
                    )
                    await asyncio.sleep(0.5 * (2 ** (attempt - 1)))
                else:
                    await self._log_event(
                        context.task_id, "error",
                        f"Agent {self.name} failed after {self.max_retries} retries: {error}",
                    )
                    raise

    async def _log_event(self, task_id: str, event_type: str, message: str, details=None):
        from models import TaskEvent

        event = TaskEvent(
            id=str(uuid.uuid4()),
            task_id=task_id,
            agent_name=self.name,
            event_type=event_type,
            message=message,
            created_at=datetime.now(timezone.utc).isoformat(),
            details=json.dumps(details) if details else None,
        )
        db.insert_event(event)
        print(f"[{self.name}] {event_type.upper()}: {message}")
