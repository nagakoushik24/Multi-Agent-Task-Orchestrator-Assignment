"""
TaskOrchestrator — runs agents sequentially through the configured pipeline.
Handles the Reviewer → Writer feedback loop.
"""
import asyncio

import db
from models import AgentContext, AgentConfig
from agents import PlannerAgent, ResearcherAgent, WriterAgent, ReviewerAgent

AGENT_REGISTRY = {
    "Planner": PlannerAgent,
    "Researcher": ResearcherAgent,
    "Writer": WriterAgent,
    "Reviewer": ReviewerAgent,
}


class TaskOrchestrator:

    async def execute_pipeline(self, task_id: str, prompt: str, config: AgentConfig):
        pipeline = config.pipeline
        context = AgentContext(
            task_id=task_id,
            prompt=prompt,
            state={"__revisions": 0},
            config=config,
        )

        db.update_task(task_id, {"status": "in_progress"})

        current_step = 0

        while current_step < len(pipeline):
            agent_name = pipeline[current_step]
            agent_cls = AGENT_REGISTRY.get(agent_name)

            if agent_cls is None:
                raise RuntimeError(f"Agent {agent_name} not found in registry")

            agent = agent_cls()

            try:
                result = await agent.execute(context)

                # Save the result to state so the next agent can access it
                context.state[agent_name] = result

                # Feedback loop: Reviewer → Writer
                if agent_name == "Reviewer" and result.get("action") == "REVISE":
                    context.state["__revisions"] = context.state.get("__revisions", 0) + 1
                    writer_index = pipeline.index("Writer") if "Writer" in pipeline else -1
                    if writer_index != -1:
                        current_step = writer_index
                        continue

                current_step += 1
            except Exception as error:
                # Agent failed all retries → fail the entire pipeline
                db.update_task(task_id, {
                    "status": "failed",
                    "result": {"error": str(error)},
                })
                return

        # Pipeline completed successfully
        final_report = (
            context.state.get("Reviewer", {}).get("finalReport")
            or context.state.get("Writer", {}).get("draft")
            or "No final report generated."
        )

        db.update_task(task_id, {
            "status": "completed",
            "result": {
                "pipelineOutput": context.state,
                "finalReport": final_report,
            },
        })
