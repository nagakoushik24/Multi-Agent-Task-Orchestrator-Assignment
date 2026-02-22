import { BaseAgent } from './BaseAgent';
import { AgentContext } from '../models/types';

export class PlannerAgent extends BaseAgent {
  public name = 'Planner';

  protected async executeLogic(context: AgentContext): Promise<any> {
    await this.logEvent(context.taskId, 'info', `Analyzing prompt: "${context.prompt}"`);

    // Artificial delay to simulate thinking
    await new Promise(r => setTimeout(r, 2000));

    // Simulate random failure to demonstrate Retry mechanism (Stretch Goal 1)
    if (Math.random() < 0.2) {
      throw new Error("Failed to contact planning heuristic AI (simulated error)");
    }

    const subtasks = [
      `Research history and definitions of ${context.prompt}`,
      `Analyze pros and cons of ${context.prompt}`,
      `Find industry case studies or examples related to ${context.prompt}`
    ];

    for (const subtask of subtasks) {
      await this.logEvent(context.taskId, 'info', `Created subtask: "${subtask}"`);
    }

    await this.logEvent(context.taskId, 'info', `Plan finalized: ${subtasks.length} subtasks queued for Researcher.`);

    return {
      subtasks,
      planDescription: `Divided the request into ${subtasks.length} distinct research tasks.`
    };
  }
}
