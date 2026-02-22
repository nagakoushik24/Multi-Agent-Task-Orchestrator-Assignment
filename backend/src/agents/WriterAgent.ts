import { BaseAgent } from './BaseAgent';
import { AgentContext } from '../models/types';

export class WriterAgent extends BaseAgent {
  public name = 'Writer';

  protected async executeLogic(context: AgentContext): Promise<any> {
    const researchOutput = context.state['Researcher'];
    if (!researchOutput || !researchOutput.researchResults) {
      throw new Error("Writer requires output from Researcher");
    }

    const results = researchOutput.researchResults;

    await this.logEvent(context.taskId, 'info', `Starting composition: synthesizing ${results.length} research results into a report.`);

    await new Promise(r => setTimeout(r, 2500)); // Simulate writing delay

    let draft = `# Comprehensive Report: ${context.prompt}\n\n`;
    draft += `*Generated automatically by Multi-Agent Task Orchestrator*\n\n`;
    
    await this.logEvent(context.taskId, 'info', `Writing Executive Summary for "${context.prompt}".`);
    draft += `## Executive Summary\n`;
    draft += `This document synthesizes findings regarding ${context.prompt}.\n\n`;

    for (const r of results) {
      await this.logEvent(context.taskId, 'info', `Writing section: "${r.task}"`);
      draft += `### ${r.task}\n`;
      draft += `${r.findings}\n\n`;
    }

    await this.logEvent(context.taskId, 'info', `Writing Conclusion and finalizing draft.`);
    draft += `## Conclusion\n`;
    draft += `Overall, the analysis presents a comprehensive look at the requested topic, derived from ${results.length} parallel research streams.\n`;

    await this.logEvent(context.taskId, 'info', `Draft complete: ${draft.split('\n').length} lines written.`);

    return { draft };
  }
}
