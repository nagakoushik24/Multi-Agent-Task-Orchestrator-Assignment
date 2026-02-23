import { useState } from 'react';
import TaskForm from './components/TaskForm';
import PipelineVisualizer from './components/PipelineVisualizer';
import TaskResult from './components/TaskResult';

export default function App() {
  const [activeTaskId, setActiveTaskId] = useState(null);

  return (
    <main className="app-container">
      <div className="stack-12">
        {/* ─── Header ─────────────────────────────────────── */}
        <header className="header">
          <div className="header__badge">Multi-Agent System</div>
          <h1 className="header__title">Task Orchestrator</h1>
          <p className="header__subtitle">
            Submit a complex research task and watch as a team of specialized AI
            agents collaboratively plan, research, write, and review the final
            report in real-time.
          </p>
        </header>

        {/* ─── Task Form ──────────────────────────────────── */}
        <section className="glass-card">
          <TaskForm onSubmitted={(id) => setActiveTaskId(id)} />
        </section>

        {/* ─── Pipeline + Result ──────────────────────────── */}
        {activeTaskId && (
          <div className="stack-8 animate-enter">
            <PipelineVisualizer taskId={activeTaskId} />
            <TaskResult taskId={activeTaskId} />
          </div>
        )}
      </div>
    </main>
  );
}
