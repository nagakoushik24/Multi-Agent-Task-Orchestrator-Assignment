import { BaseAgent } from './BaseAgent';
import { AgentContext } from '../models/types';

export class ReviewerAgent extends BaseAgent {
  public name = 'Reviewer';
  private rejectionRate = 0.3; // 30% chance to reject the draft to demonstrate the feedback loop

  protected async executeLogic(context: AgentContext): Promise<any> {
    const writerOutput = context.state['Writer'];
    if (!writerOutput || !writerOutput.draft) {
      throw new Error("Reviewer requires a draft from Writer");
    }

    // Check if this is already a retry round (maybe the state has a revision count)
    const revisionCount = context.state['__revisions'] || 0;

    if (revisionCount > 0) {
      await this.logEvent(context.taskId, 'info', `Reviewing revised draft (revision #${revisionCount}).`);
    } else {
      await this.logEvent(context.taskId, 'info', `Starting quality review on initial draft.`);
    }

    await this.logEvent(context.taskId, 'info', `Checking structure, tone, and completeness of the report.`);

    await new Promise(r => setTimeout(r, 2000));

    await this.logEvent(context.taskId, 'info', `Evaluating conclusion and executive summary quality.`);

    // Reject the draft randomly to show feedback loops, but only reject once maximally to prevent infinite loops
    if (Math.random() < this.rejectionRate && revisionCount < 1) {
      await this.logEvent(context.taskId, 'info', `Decision: REVISE — conclusion tone is too informal.`);
      return {
        approved: false,
        feedback: "The tone in the Conclusion section is a bit informal. Please revise and add more academic rigor.",
        action: "REVISE"
      };
    }

    await this.logEvent(context.taskId, 'info', `Decision: APPROVED — report meets all quality standards.`);
    return {
      approved: true,
      feedback: "The report looks solid. It meets all quality standards.",
      action: "APPROVE",
      finalReport: writerOutput.draft
    };
  }
}
