import { db } from '../db/index';
import { AgentContext, AgentConfig, TaskState } from '../models/types';
import { PlannerAgent } from '../agents/PlannerAgent';
import { ResearcherAgent } from '../agents/ResearcherAgent';
import { WriterAgent } from '../agents/WriterAgent';
import { ReviewerAgent } from '../agents/ReviewerAgent';

const agentRegistry: Record<string, any> = {
  'Planner': PlannerAgent,
  'Researcher': ResearcherAgent,
  'Writer': WriterAgent,
  'Reviewer': ReviewerAgent
};

export class TaskOrchestrator {
  
  public async executePipeline(taskId: string, prompt: string, config: AgentConfig) {
    const pipeline = config.pipeline;
    let context: AgentContext = {
      taskId,
      prompt,
      state: {},
      config,
    };

    // Initialize state with revisions to track feedback loops
    context.state['__revisions'] = 0;

    await db.updateTask(taskId, { status: 'in_progress' });

    let currentStep = 0;

    while (currentStep < pipeline.length) {
      const agentName = pipeline[currentStep];
      const AgentClass = agentRegistry[agentName];
      
      if (!AgentClass) {
        throw new Error(`Agent ${agentName} not found in registry`);
      }

      const agent = new AgentClass();

      try {
        const result = await agent.execute(context);
        
        // Save the result to state so the next agent can access it
        context.state[agentName] = result;

        // Feedback Loop Logic (Reviewer -> Revise -> Writer)
        if (agentName === 'Reviewer' && result.action === 'REVISE') {
          // Increment revision count
          context.state['__revisions'] += 1;
          
          // Re-insert Writer into the pipeline to happen NEXT
          // Specifically, loop back to the Writer index
          const writerIndex = pipeline.indexOf('Writer');
          if (writerIndex !== -1) {
             currentStep = writerIndex; // Jump back to Writer
             continue;
          }
        }

        currentStep++;
      } catch (error: any) {
        // Agent failed all its internal retries. Fail the pipeline.
        await db.updateTask(taskId, { status: 'failed', result: { error: error.message } });
        return;
      }
    }

    // Pipeline completed successfully
    const finalResult = {
      pipelineOutput: context.state,
      finalReport: context.state['Reviewer']?.finalReport || context.state['Writer']?.draft || 'No final report generated.'
    };

    await db.updateTask(taskId, { 
      status: 'completed', 
      result: finalResult 
    });
  }
}
