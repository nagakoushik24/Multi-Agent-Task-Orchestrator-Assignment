"use client";

import { useEffect, useState } from 'react';
import { FileText, Cpu, AlertTriangle } from 'lucide-react';

export default function TaskResult({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    let interval: any;
    
    const fetchTask = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/tasks/${taskId}`);
        if (res.ok) {
          const data = await res.json();
          setTask(data);
          
          // Stop polling if done
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Failed to fetch task result", err);
      }
    };

    fetchTask();
    interval = setInterval(fetchTask, 2000); // Poll for final result while SSE handles live UI

    return () => clearInterval(interval);
  }, [taskId]);

  if (!task || task.status === 'pending' || task.status === 'in_progress') {
    return (
      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-12 text-slate-500 min-h-[400px]">
        <div className="text-center space-y-4">
          <Cpu className="w-12 h-12 mx-auto animate-pulse text-indigo-500/50" />
          <p className="text-lg">Agents are analyzing the request...</p>
        </div>
      </div>
    );
  }

  if (task.status === 'failed') {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-red-200">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          Pipeline Failed
        </h3>
        <p>{task.result?.error || 'Unknown error occurred during pipeline execution.'}</p>
      </div>
    );
  }

  const reportData = task.result?.finalReport;
  const originalPrompt = task.prompt;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <FileText className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Final Synthesized Report</h2>
          <p className="text-sm text-slate-400 truncate max-w-md" title={originalPrompt}>Prompt: {originalPrompt}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
          {reportData ? (
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(reportData) }} />
          ) : (
            <p className="text-slate-400 italic">No report content generated.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Super simple markdown formatter for the synthesized draft 
function formatMarkdown(text: string) {
  let html = text
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/\n\n/g, '<br/><br/>');
  return html;
}
