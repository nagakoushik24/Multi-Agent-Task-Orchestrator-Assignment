# System Design & Architecture

## Architectural Decisions

1. **Separation of Concerns (Frontend/Backend):**
   I chose to strictly separate the Next.js React frontend from the Node.js Express backend using a standard REST API. This clearly bounds the orchestration logic away from the presentation layer, allowing the orchestration engine to run asynchronously and independently.

2. **Server-Sent Events (SSE) for Real-Time UI:**
   Instead of WebSockets or HTTP Polling, I opted for Server-Sent Events (SSE).
   _Why?_ Task orchestration progress is fundamentally a one-way data stream (Server -> Client). WebSockets introduce bidirectional overhead and complex state management. SSE natively supports automatic reconnections and perfectly aligns with the requirement for "real-time progress updates".

3. **BaseAgent Abstract Wrapper:**
   I utilized an Object-Oriented approach for the Agents by creating an abstract `BaseAgent` class.
   _Why?_ This allowed me to centralize cross-cutting concerns. The `BaseAgent` handles event logging (to the database) and implements the **Retry / Error Handling** stretch goal invisibly. Specific agents (`Planner`, `Researcher`) only need to implement an `executeLogic` method, keeping them incredibly clean (around 20-30 lines of code each).

4. **In-Memory/JSON File Persistence Strategy:**
   While the initial design intended to use SQLite via `better-sqlite3`, native C++ compilation constraints on Windows meant standard file-system JSON serialization was safer for a Take-Home assignment. The data access layer `src/db/index.ts` exposes standard CRUD async methods, so swapping from JSON to Postgres/SQLite in the future would require zero changes to the orchestrator itself.

## Trade-offs Considered

- **Polling vs WebSockets vs SSE:** Polling is easy but slow and resource-heavy. WebSockets are fast but complex to authenticate and scale. SSE is the sweet spot for a system that only needs to _push_ status updates to the client.
- **Node.js instead of Python:** The assignment suggested Python, but the user explicitly requested "React and Node.js". Node's asynchronous event-driven nature out-of-the-box (`Promise.all`) made implementing the **Parallel Agents** stretch goal exceptionally clean.
- **Simulated Delays & Failures vs True LLM Integration:** To fulfill the evaluation's focus on orchestration logic rather than LLM prompt engineering, I heavily used `setTimeout` and `Math.random()` to simulate network latency and failures. This allowed me to definitively prove the Orchestrator's robust retry mechanism.

## Future Improvements

If given more time, I would:

1. **Dockerize the Application:** Provide a `docker-compose.yml` to spin up both the Next.js app, Node.js API, and a real Postgres database concurrently.
2. **True State Machine (XState):** Replace the linear `while` loop within `TaskOrchestrator.ts` with a formal State Machine library like XState. This would make handling complex DAGs (Directed Acyclic Graphs) of agents much more reliable.
3. **Agent Configuration UI:** Allow the user to drag-and-drop agents into a custom pipeline on the frontend before hitting submit.
4. **WebSocket Implementation:** Using WebSockets we could push two-way logs, allowing the user to "pause" or "cancel" an agent mid-execution.
