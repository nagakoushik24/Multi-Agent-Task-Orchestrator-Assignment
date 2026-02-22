import { TaskOrchestrator } from '../src/orchestrator/TaskOrchestrator';
import { initDb, db } from '../src/db/index';

// Increase jest timeout for mock delay execution
jest.setTimeout(30000);

describe('TaskOrchestrator Unit Tests', () => {
  beforeAll(async () => {
    // DB is mocked via JSON DB logic but we'll ensure it runs
    await initDb();
  });

  it('should run a pipeline successfully', async () => {
    const orchestrator = new TaskOrchestrator();
    const taskId = 'test-id-1';
    
    await db.insertTask({
      id: taskId,
      prompt: 'testing complete flow',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const config = { pipeline: ['Planner', 'Researcher', 'Writer'] };
    
    // We omit Reviewer since it has a 30% chance of failing and creating feedback loops
    // and planner has 20% fail chance, which tests retries.
    await orchestrator.executePipeline(taskId, 'testing flow', config);
    
    const task = await db.getTask(taskId);
    expect(task?.status).toBe('completed');
    expect(task?.result?.pipelineOutput?.Planner).toBeDefined();
    expect(task?.result?.pipelineOutput?.Researcher).toBeDefined();
    expect(task?.result?.pipelineOutput?.Writer).toBeDefined();
    expect(task?.result?.pipelineOutput?.Reviewer).toBeUndefined();
    expect(task?.result?.pipelineOutput?.Planner?.subtasks.length).toBeGreaterThan(0);
  });

  it('should run a pipeline skipping agents correctly based on config', async () => {
    const orchestrator = new TaskOrchestrator();
    const taskId = 'test-id-2';
    
    await db.insertTask({
      id: taskId,
      prompt: 'testing skipped flow',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Skip Researcher and Writer (e.g. just planning)
    const config = { pipeline: ['Planner'] };
    await orchestrator.executePipeline(taskId, 'test plan only', config);
    
    const task = await db.getTask(taskId);
    expect(task?.status).toBe('completed');
    expect(task?.result?.pipelineOutput?.Researcher).toBeUndefined();
  });
});
