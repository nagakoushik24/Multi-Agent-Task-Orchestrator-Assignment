"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';

interface TaskEvent {
  id: string;
  agentName: string;
  eventType: 'start' | 'success' | 'error' | 'retry' | 'info';
  message: string;
  createdAt: string;
}

export default function PipelineVisualizer({ taskId }: { taskId: string }) {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [status, setStatus] = useState<string>('in_progress');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    setEvents([]);
    setStatus('in_progress');

    const eventSource = new EventSource(`http://localhost:3001/api/tasks/${taskId}/events`);

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'STATUS_UPDATE') {
        setStatus(data.status);
      } else {
        setEvents((prev) => {
          // Prevent duplicates arising from backend polling sending the same event across intervals
          if (prev.some(ev => ev.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };

    return () => {
      eventSource.close();
    };
  }, [taskId]);

  // Derive current agent state from events
  const agents = ['Planner', 'Researcher', 'Writer', 'Reviewer'];
  const agentState: Record<string, { status: string, message?: string }> = {};

  agents.forEach(a => agentState[a] = { status: 'pending' });

  events.forEach(ev => {
    if (ev.eventType === 'start') agentState[ev.agentName] = { status: 'running', message: ev.message };
    if (ev.eventType === 'success') agentState[ev.agentName] = { status: 'done', message: ev.message };
    if (ev.eventType === 'retry') agentState[ev.agentName] = { status: 'retrying', message: ev.message };
    if (ev.eventType === 'error') agentState[ev.agentName] = { status: 'error', message: ev.message };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl sticky top-8">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
        Pipeline Status
        {status === 'in_progress' && <span className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400"><Loader2 className="w-3 h-3 animate-spin"/> Running</span>}
        {status === 'completed' && <span className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-3 h-3"/> Complete</span>}
        {status === 'failed' && <span className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400"><AlertTriangle className="w-3 h-3"/> Failed</span>}
      </h3>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
        {agents.map((agent, index) => {
          const state = agentState[agent];
          
          let Icon = CircleDashed;
          let colorClass = "text-slate-600 bg-slate-900 border-slate-700";
          
          if (state.status === 'running') {
            Icon = Loader2;
            colorClass = "text-indigo-400 bg-indigo-950 border-indigo-500 ring-4 ring-indigo-500/20";
          } else if (state.status === 'done') {
            Icon = CheckCircle2;
            colorClass = "text-emerald-400 bg-emerald-950 border-emerald-500";
          } else if (state.status === 'retrying') {
            Icon = RefreshCcw;
            colorClass = "text-amber-400 bg-amber-950 border-amber-500 ring-4 ring-amber-500/20";
          } else if (state.status === 'error') {
            Icon = AlertTriangle;
            colorClass = "text-red-400 bg-red-950 border-red-500";
          }

          return (
            <div key={agent} className="relative flex items-start gap-4 group">
              
              {/* Icon Marker */}
              <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 bg-slate-900 shrink-0 mt-1 shadow-md z-10 transition-colors duration-500 ${colorClass}`}>
                <Icon className={`w-4 h-4 ${state.status === 'running' || state.status === 'retrying' ? 'animate-spin' : ''}`} />
              </div>
              
              {/* Card */}
              <div 
                onClick={() => setExpandedAgent(expandedAgent === agent ? null : agent)}
                className={`flex-1 p-4 rounded-xl border transition-all duration-300 shadow-sm cursor-pointer ${
                  expandedAgent === agent 
                    ? 'border-indigo-500/50 bg-slate-800' 
                    : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-slate-200">{agent}</div>
                  {state.status === 'done' && (
                    <div className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md">
                      {expandedAgent === agent ? 'Hide Details' : 'View Details'}
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  {state.status === 'pending' ? 'Waiting in queue...' : (state.message || 'Processing')}
                </div>
                
                {/* Event mini-log for this agent */}
                {(state.status === 'running' || state.status === 'retrying' || expandedAgent === agent) && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 animate-in fade-in">
                    {events.filter(e => e.agentName === agent && (e.eventType === 'info' || e.eventType === 'retry')).map(e => (
                      <div key={e.id} className="text-xs text-slate-500 flex items-start gap-2">
                        <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${e.eventType === 'retry' ? 'bg-amber-400' : 'bg-indigo-500'}`}></span>
                        <span className={e.eventType === 'retry' ? 'text-amber-400/80' : 'text-slate-300'}>{e.message}</span>
                      </div>
                    ))}
                    {events.filter(e => e.agentName === agent && (e.eventType === 'info' || e.eventType === 'retry')).length === 0 && (
                      <div className="text-xs text-slate-500 italic">No detailed sub-tasks logged for this agent.</div>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
