"""
Flask application — REST API + SSE endpoints for the Multi-Agent Task Orchestrator.
Port: 5000
"""
import asyncio
import json
import uuid
import threading
import time
from datetime import datetime

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

import db
from models import TaskState, AgentConfig
from orchestrator import TaskOrchestrator

app = Flask(__name__)
CORS(app)

orchestrator = TaskOrchestrator()


def _run_pipeline_in_thread(task_id: str, prompt: str, config: AgentConfig):
    """Run the async pipeline in a separate thread with its own event loop."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(orchestrator.execute_pipeline(task_id, prompt, config))
    except Exception as e:
        print(f"Pipeline error: {e}")
    finally:
        loop.close()


# ─── POST /api/tasks ──────────────────────────────────────────────

@app.route("/api/tasks", methods=["POST"])
def create_task():
    body = request.get_json(silent=True) or {}
    prompt = body.get("prompt")

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    config_raw = body.get("config", {})
    pipeline = config_raw.get("pipeline", ["Planner", "Researcher", "Writer", "Reviewer"])
    config = AgentConfig(pipeline=pipeline)

    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    new_task = TaskState(
        id=task_id,
        prompt=prompt,
        status="pending",
        created_at=now,
        updated_at=now,
    )
    db.insert_task(new_task)

    # Fire-and-forget: run pipeline in a background thread
    thread = threading.Thread(
        target=_run_pipeline_in_thread,
        args=(task_id, prompt, config),
        daemon=True,
    )
    thread.start()

    return jsonify({"taskId": task_id}), 202


# ─── GET /api/tasks ───────────────────────────────────────────────

@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    return jsonify(db.get_all_tasks())


# ─── GET /api/tasks/<id> ──────────────────────────────────────────

@app.route("/api/tasks/<task_id>", methods=["GET"])
def get_task(task_id: str):
    task = db.get_task(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task)


# ─── GET /api/tasks/<id>/events — SSE ─────────────────────────────

@app.route("/api/tasks/<task_id>/events", methods=["GET"])
def task_events_sse(task_id: str):
    task = db.get_task(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    def generate():
        last_event_count = 0

        # Send all existing events first
        existing = db.get_events_for_task(task_id)
        for ev in existing:
            yield f"data: {json.dumps(ev)}\n\n"
        last_event_count = len(existing)

        # Poll for new events every second
        while True:
            time.sleep(1)
            current_task = db.get_task(task_id)
            newest_events = db.get_events_for_task(task_id)

            if len(newest_events) > last_event_count:
                for ev in newest_events[last_event_count:]:
                    yield f"data: {json.dumps(ev)}\n\n"
                last_event_count = len(newest_events)

            if current_task and current_task.get("status") in ("completed", "failed"):
                yield f"data: {json.dumps({'type': 'STATUS_UPDATE', 'status': current_task['status']})}\n\n"
                break

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Main ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    db.init_db()
    print("Backend Orchestrator running on port 5000")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
