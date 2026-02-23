"""
PlannerAgent — divides the user prompt into 3 research sub-tasks.
Has a 20% simulated failure rate to demonstrate retry logic.
"""
import asyncio
import random

from .base_agent import BaseAgent
from models import AgentContext


class PlannerAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "Planner"

    async def execute_logic(self, context: AgentContext) -> dict:
        await self._log_event(context.task_id, "info", f'Analyzing prompt: "{context.prompt}"')

        # Artificial delay to simulate thinking
        await asyncio.sleep(2)

        # Simulate random failure to demonstrate retry mechanism
        if random.random() < 0.2:
            raise RuntimeError("Failed to contact planning heuristic AI (simulated error)")

        subtasks = [
            f"Research history and definitions of {context.prompt}",
            f"Analyze pros and cons of {context.prompt}",
            f"Find industry case studies or examples related to {context.prompt}",
        ]

        for subtask in subtasks:
            await self._log_event(context.task_id, "info", f'Created subtask: "{subtask}"')

        await self._log_event(
            context.task_id, "info",
            f"Plan finalized: {len(subtasks)} subtasks queued for Researcher.",
        )

        return {
            "subtasks": subtasks,
            "planDescription": f"Divided the request into {len(subtasks)} distinct research tasks.",
        }
