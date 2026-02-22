import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { initDb, db } from './db/index';
import { TaskOrchestrator } from './orchestrator/TaskOrchestrator';
import { AgentConfig, TaskState } from './models/types';

const app = express();
app.use(cors());
app.use(express.json());

const orchestrator = new TaskOrchestrator();

app.post('/api/tasks', async (req, res) => {
  const { prompt, config } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const validConfig: AgentConfig = config || { pipeline: ['Planner', 'Researcher', 'Writer', 'Reviewer'] };
  const taskId = randomUUID();

  const newTask: TaskState = {
    id: taskId,
    prompt,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.insertTask(newTask);

  orchestrator.executePipeline(taskId, prompt, validConfig).catch(console.error);

  res.status(202).json({ taskId });
});

app.get('/api/tasks', async (req, res) => {
  const tasks = await db.getAllTasks();
  res.json(tasks);
});

app.get('/api/tasks/:id', async (req, res) => {
  const task = await db.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.get('/api/tasks/:id/events', async (req, res) => {
  const taskId = req.params.id;
  const task = await db.getTask(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const existingEvents = await db.getEventsForTask(taskId);
  for (const ev of existingEvents) {
    res.write(`data: ${JSON.stringify(ev)}\n\n`);
  }

  let lastEventCount = existingEvents.length;
  
  const intervalId = setInterval(async () => {
    const currentTask = await db.getTask(taskId);
    const newestEvents = await db.getEventsForTask(taskId);

    if (newestEvents.length > lastEventCount) {
      const incoming = newestEvents.slice(lastEventCount);
      for (const ev of incoming) {
        res.write(`data: ${JSON.stringify(ev)}\n\n`);
      }
      lastEventCount = newestEvents.length;
    }

    if (currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed')) {
      res.write(`data: ${JSON.stringify({ type: 'STATUS_UPDATE', status: currentTask.status })}\n\n`);
      clearInterval(intervalId);
      res.end();
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

const PORT = process.env.PORT || 3001;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend Orchestrator running on port ${PORT}`);
  });
}).catch(e => {
  console.error("Failed to init DB:", e);
});
