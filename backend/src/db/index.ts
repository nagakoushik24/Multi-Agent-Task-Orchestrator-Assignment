import fs from 'fs/promises';
import path from 'path';
import { TaskState, TaskEvent } from '../models/types';

const dbPath = path.resolve(__dirname, '../../database.json');

interface DatabaseSchema {
  tasks: TaskState[];
  events: TaskEvent[];
}

// In-memory cache
let _db: DatabaseSchema = { tasks: [], events: [] };

export async function initDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    _db = JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(dbPath, JSON.stringify(_db, null, 2), 'utf8');
    } else {
      console.error("Failed to read DB file:", error);
    }
  }
}

async function saveDb() {
  await fs.writeFile(dbPath, JSON.stringify(_db, null, 2), 'utf8');
}

export const db = {
  async insertTask(task: TaskState) {
    _db.tasks.push(task);
    await saveDb();
  },
  async updateTask(id: string, updates: Partial<TaskState>) {
    const taskIndex = _db.tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      _db.tasks[taskIndex] = { ..._db.tasks[taskIndex], ...updates, updatedAt: new Date().toISOString() };
      await saveDb();
    }
  },
  async getTask(id: string): Promise<TaskState | undefined> {
    return _db.tasks.find(t => t.id === id);
  },
  async getAllTasks(): Promise<TaskState[]> {
    return [..._db.tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async insertEvent(event: TaskEvent) {
    _db.events.push(event);
    await saveDb();
  },
  async getEventsForTask(taskId: string): Promise<TaskEvent[]> {
    return _db.events.filter(e => e.taskId === taskId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
};
