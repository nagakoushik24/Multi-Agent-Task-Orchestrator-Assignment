"""
ReviewerAgent — reviews the draft with a 30% rejection rate.
Rejects at most once to prevent infinite loops.
"""
import asyncio
import random

from .base_agent import BaseAgent
from models import AgentContext


class ReviewerAgent(BaseAgent):
    rejection_rate: float = 0.3

    @property
    def name(self) -> str:
        return "Reviewer"

    async def execute_logic(self, context: AgentContext) -> dict:
        writer_output = context.state.get("Writer")
        if not writer_output or "draft" not in writer_output:
            raise RuntimeError("Reviewer requires a draft from Writer")

        revision_count = context.state.get("__revisions", 0)

        if revision_count > 0:
            await self._log_event(
                context.task_id, "info",
                f"Reviewing revised draft (revision #{revision_count}).",
            )
        else:
            await self._log_event(
                context.task_id, "info",
                "Starting quality review on initial draft.",
            )

        await self._log_event(
            context.task_id, "info",
            "Checking structure, tone, and completeness of the report.",
        )

        await asyncio.sleep(2)

        await self._log_event(
            context.task_id, "info",
            "Evaluating conclusion and executive summary quality.",
        )

        # Reject randomly, but only once at most
        if random.random() < self.rejection_rate and revision_count < 1:
            await self._log_event(
                context.task_id, "info",
                "Decision: REVISE — conclusion tone is too informal.",
            )
            return {
                "approved": False,
                "feedback": (
                    "The tone in the Conclusion section is a bit informal. "
                    "Please revise and add more academic rigor."
                ),
                "action": "REVISE",
            }

        await self._log_event(
            context.task_id, "info",
            "Decision: APPROVED — report meets all quality standards.",
        )
        return {
            "approved": True,
            "feedback": "The report looks solid. It meets all quality standards.",
            "action": "APPROVE",
            "finalReport": writer_output["draft"],
        }
