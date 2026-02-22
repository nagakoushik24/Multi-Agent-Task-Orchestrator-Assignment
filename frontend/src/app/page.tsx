"use client";

import { useState } from 'react';
import TaskForm from '../components/TaskForm';
import PipelineVisualizer from '../components/PipelineVisualizer';
import TaskResult from '../components/TaskResult';

export default function Home() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const handleTaskSubmitted = (taskId: string) => {
    setActiveTaskId(taskId);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium tracking-wide mb-4 border border-indigo-500/20">
            Multi-Agent System
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Task Orchestrator
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Submit a complex research task and watch as a team of specialized AI agents collaboratively plan, research, write, and review the final report in real-time.
          </p>
        </header>

        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl shadow-indigo-900/10">
          <TaskForm onSubmitted={handleTaskSubmitted} />
        </section>

        {activeTaskId && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-full">
              <PipelineVisualizer taskId={activeTaskId} />
            </div>
            <div className="w-full">
              <TaskResult taskId={activeTaskId} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
