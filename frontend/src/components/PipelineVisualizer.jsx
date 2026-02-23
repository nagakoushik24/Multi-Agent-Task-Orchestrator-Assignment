import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const AGENTS = ['Planner', 'Researcher', 'Writer', 'Reviewer'];

const STATUS_ICON_MAP = {
  pending:  { Icon: CircleDashed, spinning: false },
  running:  { Icon: Loader2,      spinning: true  },
  done:     { Icon: CheckCircle2,  spinning: false },
  retrying: { Icon: RefreshCcw,    spinning: true  },
  error:    { Icon: AlertTriangle, spinning: false },
};

export default function PipelineVisualizer({ taskId }) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('in_progress');
  const [expandedAgent, setExpandedAgent] = useState(null);

  useEffect(() => {
    if (!taskId) return;
    setEvents([]);
    setStatus('in_progress');

    const eventSource = new EventSource(`${API_URL}/api/tasks/${taskId}/events`);

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'STATUS_UPDATE') {
        setStatus(data.status);
      } else {
        setEvents((prev) => {
          if (prev.some((ev) => ev.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [taskId]);

  // Derive agent states from events
  const agentState = {};
  AGENTS.forEach((a) => (agentState[a] = { status: 'pending' }));

  events.forEach((ev) => {
    if (ev.eventType === 'start')   agentState[ev.agentName] = { status: 'running',  message: ev.message };
    if (ev.eventType === 'success') agentState[ev.agentName] = { status: 'done',     message: ev.message };
    if (ev.eventType === 'retry')   agentState[ev.agentName] = { status: 'retrying', message: ev.message };
    if (ev.eventType === 'error')   agentState[ev.agentName] = { status: 'error',    message: ev.message };
  });

  return (
    <div className="pipeline">
      {/* Header */}
      <div className="pipeline__header">
        <h3 className="pipeline__title">Pipeline Status</h3>

        {status === 'in_progress' && (
          <span className="pipeline__status-badge pipeline__status-badge--running">
            <Loader2 size={12} className="animate-spin" /> Running
          </span>
        )}
        {status === 'completed' && (
          <span className="pipeline__status-badge pipeline__status-badge--complete">
            <CheckCircle2 size={12} /> Complete
          </span>
        )}
        {status === 'failed' && (
          <span className="pipeline__status-badge pipeline__status-badge--failed">
            <AlertTriangle size={12} /> Failed
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="pipeline__timeline">
        {AGENTS.map((agent) => {
          const state = agentState[agent];
          const { Icon, spinning } = STATUS_ICON_MAP[state.status] || STATUS_ICON_MAP.pending;

          const agentEvents = events.filter(
            (e) => e.agentName === agent && (e.eventType === 'info' || e.eventType === 'retry')
          );

          const showLog = state.status === 'running' || state.status === 'retrying' || expandedAgent === agent;

          return (
            <div
              key={agent}
              className={`agent-row agent-row--${state.status}`}
            >
              {/* Icon marker */}
              <div className="agent-row__icon">
                <Icon className={spinning ? 'animate-spin' : ''} />
              </div>

              {/* Card */}
              <div
                className={`agent-card ${expandedAgent === agent ? 'agent-card--expanded' : ''}`}
                onClick={() => setExpandedAgent(expandedAgent === agent ? null : agent)}
              >
                <div className="agent-card__header">
                  <div className="agent-card__name">{agent}</div>
                  {state.status === 'done' && (
                    <div className="agent-card__toggle-hint">
                      {expandedAgent === agent ? 'Hide Details' : 'View Details'}
                    </div>
                  )}
                </div>
                <div className="agent-card__message">
                  {state.status === 'pending'
                    ? 'Waiting in queue...'
                    : state.message || 'Processing'}
                </div>

                {/* Event mini-log */}
                {showLog && (
                  <div className="agent-card__log">
                    {agentEvents.length === 0 ? (
                      <div className="agent-card__log-empty">
                        No detailed sub-tasks logged for this agent.
                      </div>
                    ) : (
                      agentEvents.map((e) => (
                        <div
                          key={e.id}
                          className={`agent-card__log-entry ${e.eventType === 'retry' ? 'agent-card__log-entry--retry' : ''}`}
                        >
                          <span
                            className={`agent-card__log-dot ${e.eventType === 'retry' ? 'agent-card__log-dot--retry' : ''}`}
                          />
                          <span>{e.message}</span>
                        </div>
                      ))
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
