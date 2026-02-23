"""
WriterAgent — synthesizes research results into a markdown report draft.
"""
import asyncio

from .base_agent import BaseAgent
from models import AgentContext


class WriterAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "Writer"

    async def execute_logic(self, context: AgentContext) -> dict:
        researcher_output = context.state.get("Researcher")
        if not researcher_output or "researchResults" not in researcher_output:
            raise RuntimeError("Writer requires output from Researcher")

        results = researcher_output["researchResults"]

        await self._log_event(
            context.task_id, "info",
            f"Starting composition: synthesizing {len(results)} research results into a report.",
        )

        await asyncio.sleep(2.5)  # Simulate writing delay

        draft = f"# Comprehensive Report: {context.prompt}\n\n"
        draft += "*Generated automatically by Multi-Agent Task Orchestrator*\n\n"

        await self._log_event(
            context.task_id, "info",
            f'Writing Executive Summary for "{context.prompt}".',
        )
        draft += "## Executive Summary\n"
        draft += f"This document synthesizes findings regarding {context.prompt}.\n\n"

        for r in results:
            await self._log_event(context.task_id, "info", f'Writing section: "{r["task"]}"')
            draft += f"### {r['task']}\n"
            draft += f"{r['findings']}\n\n"

        await self._log_event(context.task_id, "info", "Writing Conclusion and finalizing draft.")
        draft += "## Conclusion\n"
        draft += (
            "Overall, the analysis presents a comprehensive look at the requested topic, "
            f"derived from {len(results)} parallel research streams.\n"
        )

        line_count = len(draft.split("\n"))
        await self._log_event(context.task_id, "info", f"Draft complete: {line_count} lines written.")

        return {"draft": draft}
