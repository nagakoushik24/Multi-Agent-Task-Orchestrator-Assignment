export interface TaskState {
  id: string;
  prompt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  createdAt: string;
  updatedAt: string;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  agentName: string;
  eventType: 'start' | 'success' | 'error' | 'retry' | 'info';
  message: string;
  details?: any;
  createdAt: string;
}

export interface AgentContext {
  taskId: string;
  prompt: string;
  state: Record<string, any>;
  config: AgentConfig;
}

export interface AgentConfig {
  pipeline: string[];
}
