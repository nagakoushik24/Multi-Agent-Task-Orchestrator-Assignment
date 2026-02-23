import { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function TaskForm({ onSubmitted }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeReviewer, setIncludeReviewer] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);

    const pipeline = ['Planner', 'Researcher', 'Writer'];
    if (includeReviewer) pipeline.push('Reviewer');

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config: { pipeline } }),
      });
      const data = await res.json();
      if (data.taskId) {
        onSubmitted(data.taskId);
        setPrompt('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit task. Make sure backend is running on :5000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div>
        <label className="form__label" htmlFor="prompt">
          What would you like the agents to research?
        </label>
        <div className="form__textarea-wrapper">
          <textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="form__textarea"
            placeholder="e.g. Research the pros and cons of microservices vs. monoliths..."
          />
          <div className="form__sparkle-icon">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      <div className="form__actions">
        <label className="toggle">
          <input
            type="checkbox"
            className="toggle__input"
            checked={includeReviewer}
            onChange={(e) => setIncludeReviewer(e.target.checked)}
          />
          <div className="toggle__track" />
          <span className="toggle__label">
            Include Reviewer Agent
            <span className="toggle__sublabel">
              Adds a quality assurance feedback loop
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="btn btn--primary"
        >
          {loading ? <div className="spinner" /> : <Play size={16} />}
          <span>Execute Pipeline</span>
        </button>
      </div>
    </form>
  );
}
