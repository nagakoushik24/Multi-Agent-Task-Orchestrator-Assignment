import { useEffect, useState } from 'react';
import { FileText, Cpu, AlertTriangle } from 'lucide-react';

const API_URL = 'http://localhost:5000';

/**
 * Very simple markdown → HTML formatter for the synthesized draft.
 */
function formatMarkdown(text) {
  return text
    .replace(/^# (.*)/gm,   '<h1>$1</h1>')
    .replace(/^## (.*)/gm,  '<h2>$1</h2>')
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br/><br/>');
}

export default function TaskResult({ taskId }) {
  const [task, setTask] = useState(null);

  useEffect(() => {
    let interval;

    const fetchTask = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tasks/${taskId}`);
        if (res.ok) {
          const data = await res.json();
          setTask(data);

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Failed to fetch task result', err);
      }
    };

    fetchTask();
    interval = setInterval(fetchTask, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  // ─── Loading State ─────────────────────────────────────
  if (!task || task.status === 'pending' || task.status === 'in_progress') {
    return (
      <div className="result-loading">
        <div>
          <Cpu size={48} className="result-loading__icon" />
          <p className="result-loading__text">
            Agents are analyzing the request…
          </p>
        </div>
      </div>
    );
  }

  // ─── Failed State ──────────────────────────────────────
  if (task.status === 'failed') {
    return (
      <div className="result-error">
        <h3 className="result-error__header">
          <AlertTriangle size={24} className="result-error__icon" />
          Pipeline Failed
        </h3>
        <p>
          {task.result?.error || 'Unknown error occurred during pipeline execution.'}
        </p>
      </div>
    );
  }

  // ─── Success State ─────────────────────────────────────
  const reportData = task.result?.finalReport;

  return (
    <div className="result">
      <div className="result__header">
        <div className="result__header-icon">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="result__header-title">Final Synthesized Report</h2>
          <p className="result__header-prompt" title={task.prompt}>
            Prompt: {task.prompt}
          </p>
        </div>
      </div>

      <div className="result__body">
        <div className="prose">
          {reportData ? (
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(reportData) }} />
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No report content generated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
