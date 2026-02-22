import { BaseAgent } from './BaseAgent';
import { AgentContext } from '../models/types';

export class ResearcherAgent extends BaseAgent {
  public name = 'Researcher';

  protected async executeLogic(context: AgentContext): Promise<any> {
    const plannerOutput = context.state['Planner'];
    if (!plannerOutput || !plannerOutput.subtasks) {
      throw new Error("Researcher requires output from Planner (missing subtasks)");
    }

    const subtasks: string[] = plannerOutput.subtasks;

    await this.logEvent(context.taskId, 'info', `Starting concurrent research on ${subtasks.length} subtasks...`);

    // Stretch Goal 2: Parallel Agents
    // Run all subtasks concurrently using Promise.all
    const researchResults = await Promise.all(
      subtasks.map(async (task, index) => {
        // Random latency to simulate real research
        const latency = 1500 + Math.random() * 2000;
        await new Promise(r => setTimeout(r, latency));
        
        await this.logEvent(context.taskId, 'info', `Completed subtask ${index + 1}: ${task}`);

        return {
          task,
          findings: `Simulated detailed findings for "${task}". The results indicate significant patterns and data points relevant to the topic.`
        };
      })
    );

    return { researchResults };
  }
}
