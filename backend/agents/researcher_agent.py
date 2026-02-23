"""
ResearcherAgent — runs all subtasks concurrently using asyncio.gather
(Python equivalent of Promise.all).
"""
import asyncio
import random

from .base_agent import BaseAgent
from models import AgentContext


class ResearcherAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "Researcher"

    async def execute_logic(self, context: AgentContext) -> dict:
        planner_output = context.state.get("Planner")
        if not planner_output or "subtasks" not in planner_output:
            raise RuntimeError("Researcher requires output from Planner (missing subtasks)")

        subtasks: list = planner_output["subtasks"]

        await self._log_event(
            context.task_id, "info",
            f"Starting concurrent research on {len(subtasks)} subtasks...",
        )

        # Parallel execution — just like Promise.all in the TS version
        async def research_subtask(task: str, index: int) -> dict:
            latency = 1.5 + random.random() * 2.0
            await asyncio.sleep(latency)

            await self._log_event(
                context.task_id, "info",
                f"Completed subtask {index + 1}: {task}",
            )

            return {
                "task": task,
                "findings": (
                    f'Simulated detailed findings for "{task}". '
                    "The results indicate significant patterns and data points "
                    "relevant to the topic."
                ),
            }

        research_results = await asyncio.gather(
            *[research_subtask(task, i) for i, task in enumerate(subtasks)]
        )

        return {"researchResults": list(research_results)}
