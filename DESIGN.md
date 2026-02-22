# System Design & Architecture

## What Is This System?

This project is a **Multi-Agent Task Orchestration System** — a platform where a chain of specialized AI agents collaborate to complete a complex research task. A user submits a prompt (e.g., _"Research the pros and cons of microservices"_), and four agents — **Planner → Researcher → Reviewer → Writer** — automatically divide the work, execute in sequence, and produce a final structured report. The user watches everything happen in real-time via a live dashboard.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                            │
│                                                                     │
│   ┌───────────────┐  ┌─────────────────────────┐  ┌─────────────┐  │
│   │  Config Panel │  │  Pipeline Visualizer     │  │  Report     │  │
│   │  (Prompt +    │  │  (Live agent status:     │  │  Viewer     │  │
│   │   Toggles)    │  │   Pending→Running→Done)  │  │  (Markdown) │  │
│   └───────┬───────┘  └──────────────────────────┘  └─────────────┘  │
│           │ POST /api/tasks          ▲ SSE event stream              │
└───────────┼──────────────────────────┼──────────────────────────────┘
            │                          │
┌───────────▼──────────────────────────┼──────────────────────────────┐
│                     Node.js / Express Backend                        │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                     TaskOrchestrator                         │  │
│   │                                                              │  │
│   │  ┌───────────┐  ┌────────────────────────┐  ┌────────────┐  │  │
│   │  │  Planner  │─▶│  Researcher            │─▶│  Reviewer  │  │  │
│   │  │  Agent    │  │  (3 sub-tasks parallel) │  │  (optional)│  │  │
│   │  └───────────┘  └────────────────────────┘  └─────┬──────┘  │  │
│   │                                                    │         │  │
│   │                                              ┌─────▼──────┐  │  │
│   │                                              │   Writer   │  │  │
│   │                                              │   Agent    │  │  │
│   │                                              └────────────┘  │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌──────────────────────────────────┐                             │
│   │  JSON File Store (database.json) │  ← persists tasks & logs   │
│   └──────────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Decisions

### 1. Frontend & Backend Are Fully Separated

The **Next.js frontend** (port 3000) and the **Node.js/Express backend** (port 3001) are two independent processes that talk only via HTTP.

- **Why?** This keeps the orchestration engine decoupled from the UI. The backend can run, fail, or be replaced without touching the frontend code, and vice versa.
- The only contract between them is a clean REST API + SSE event format.

---

### 2. Real-Time Updates via Server-Sent Events (SSE)

After a task is created, the browser opens a **persistent SSE connection** to `GET /api/tasks/:id/events`. The backend pushes an event every time an agent changes state.

```
Browser                          Backend
  │                                 │
  │── POST /api/tasks ─────────────▶│  Task created, pipeline starts
  │                                 │
  │◀── SSE: { agent:"Planner",      │  Planner starts
  │           status:"running" } ───│
  │◀── SSE: { agent:"Planner",      │  Planner finishes
  │           status:"done" } ──────│
  │◀── SSE: { agent:"Researcher",   │  Researcher starts
  │           status:"running" } ───│
  │         ... and so on           │
```

**Why SSE instead of WebSockets?**

| Method         | Pros                                                | Cons                                          |
| -------------- | --------------------------------------------------- | --------------------------------------------- |
| **Polling**    | Simple to implement                                 | Wastes bandwidth, slow to react               |
| **WebSockets** | Bidirectional, fast                                 | Complex auth, unnecessary for one-way updates |
| **SSE** ✅     | Simple, auto-reconnect, perfect for one-way streams | Browser → Server not possible                 |

Task orchestration is a **one-way stream** (server tells browser what's happening), so SSE is the ideal fit.

---

### 3. BaseAgent Abstract Class — Centralized Cross-Cutting Concerns

Every agent (`PlannerAgent`, `ResearcherAgent`, `ReviewerAgent`, `WriterAgent`) extends a single `BaseAgent` class.

```
        ┌─────────────────────────┐
        │        BaseAgent        │
        │  - run()                │◀── called by Orchestrator
        │  - retry w/ backoff     │    (up to 3 retries)
        │  - log events to DB     │
        └──────────┬──────────────┘
                   │ extends
      ┌────────────┼────────────┬────────────┐
      ▼            ▼            ▼            ▼
  Planner    Researcher     Reviewer      Writer
  Agent       Agent          Agent         Agent
  (20 lines)  (30 lines)    (20 lines)   (20 lines)
  only needs to implement executeLogic(context)
```

**Why?** Each agent only implements `executeLogic()` — the core task. Everything else (retries, logging, error handling) lives once in `BaseAgent`. This prevents code duplication and makes adding new agents very easy.

---

### 4. Parallel Sub-Task Execution in the Researcher Agent

The Planner breaks the prompt into **3 research sub-topics**, and the Researcher runs all three **at the same time** using `Promise.all`.

```
                Planner Output
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    [Sub-task 1] [Sub-task 2] [Sub-task 3]   ← all run simultaneously
         │           │           │
         └───────────┴───────────┘
                     │
               Combined Results
                     │
                  Reviewer
```

**Why?** Sequential research would be 3× slower. Running in parallel brings the total time down to the duration of the slowest sub-task, not the sum of all three.

---

### 5. JSON File Persistence (Instead of SQLite)

All tasks and event logs are persisted to `database.json`.

**Why not SQLite?**

> `better-sqlite3` requires native C++ compilation, which fails on Windows without build tools. For a take-home assignment, file-based JSON is more portable and zero-dependency.

**How is this future-proof?**

> The data access layer (`src/db/index.ts`) exposes standard async CRUD methods (`getTasks`, `saveTask`, `appendEvent`, etc.). Swapping the backend from JSON to Postgres or SQLite only requires changing that one file — zero changes to the Orchestrator or agents.

---

## Trade-offs Summary

| Decision          | Chosen Approach               | Main Reason                                         |
| ----------------- | ----------------------------- | --------------------------------------------------- |
| Real-time updates | SSE                           | One-way stream, simpler than WebSockets             |
| Language          | Node.js (not Python)          | `Promise.all` for parallel tasks is extremely clean |
| Persistence       | JSON file                     | Avoids native C++ build issues on Windows           |
| Agent structure   | Abstract BaseAgent            | Centralizes retry/logging, keeps agents tiny        |
| Agent failures    | Simulated via `Math.random()` | Focuses evaluation on orchestration, not LLM calls  |
