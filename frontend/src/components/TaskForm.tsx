"use client";

import { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';

export default function TaskForm({ onSubmitted }: { onSubmitted: (id: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeReviewer, setIncludeReviewer] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);

    const pipeline = ['Planner', 'Researcher', 'Writer'];
    if (includeReviewer) pipeline.push('Reviewer');

    try {
      const res = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config: { pipeline } })
      });
      const data = await res.json();
      if (data.taskId) {
        onSubmitted(data.taskId);
        setPrompt("");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit task. Make sure backend is running on :3001");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
          What would you like the agents to research?
        </label>
        <div className="relative">
          <textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            placeholder="e.g. Research the pros and cons of microservices vs. monoliths..."
          />
          <div className="absolute top-4 right-4 text-slate-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={includeReviewer}
              onChange={(e) => setIncludeReviewer(e.target.checked)}
              className="peer sr-only" 
            />
            <div className="w-10 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </div>
          <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
            Include Reviewer Agent 
            <span className="block text-xs text-slate-500 font-normal">Adds a quality assurance feedback loop</span>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 active:scale-95 w-full sm:w-auto justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>Execute Pipeline</span>
        </button>
      </div>
    </form>
  );
}
