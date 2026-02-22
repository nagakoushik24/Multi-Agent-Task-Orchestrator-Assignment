import { randomUUID } from 'crypto';
import { db } from '../db/index';
import { AgentContext } from '../models/types';

export abstract class BaseAgent {
  public abstract readonly name: string;
  protected maxRetries = 3;

  /**
   * Main abstract method that specific agents implement.
   */
  protected abstract executeLogic(context: AgentContext): Promise<any>;

  public async execute(context: AgentContext): Promise<any> {
    let attempt = 0;

    await this.logEvent(context.taskId, 'start', `Agent ${this.name} started execution.`);

    while (attempt <= this.maxRetries) {
      try {
        const result = await this.executeLogic(context);
        await this.logEvent(context.taskId, 'success', `Agent ${this.name} completed successfully.`, result);
        return result;
      } catch (error: any) {
        attempt++;
        if (attempt <= this.maxRetries) {
          await this.logEvent(context.taskId, 'retry', `Agent ${this.name} failed (${error.message}). Retrying ${attempt}/${this.maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
        } else {
          await this.logEvent(context.taskId, 'error', `Agent ${this.name} failed after ${this.maxRetries} retries: ${error.message}`);
          throw error;
        }
      }
    }
  }

  protected async logEvent(taskId: string, eventType: 'start'|'success'|'error'|'retry'|'info', message: string, details?: any) {
    await db.insertEvent({
      id: randomUUID(),
      taskId,
      agentName: this.name,
      eventType,
      message,
      details: details ? JSON.stringify(details) : undefined,
      createdAt: new Date().toISOString()
    });
    console.log(`[${this.name}] ${eventType.toUpperCase()}: ${message}`);
  }
}
