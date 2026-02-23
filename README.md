# 🤖 Multi-Agent Task Orchestration System

> A lightweight platform where multiple simulated AI agents collaborate to complete a complex research task — built for the **Paramount Take-Home Assignment**.

**Tech Stack:** Python · Flask · React · Vite · Server-Sent Events · Pytest

---

## 📸 Screenshots

### Entry / Home Screen

![Entry Screen](assets/entry.png)

### Active Agent Pipeline Visualizer

![Agents Running](assets/agents.png)

### Planner Agent

![Planner Agent](assets/planner.png)

### Researcher Agent

![Researcher Agent](assets/researcher.png)

### Reviewer Agent

![Reviewer Agent](assets/reviewer.png)

### Writer Agent

![Writer Agent](assets/writer.png)

### Final Report Output

![Final Report](assets/final_report.png)

### Backend Terminal – Startup

![Backend CLI 1](assets/backend1_cli.png)

### Backend Terminal – In Progress

![Backend CLI 2](assets/backend2_cli.png)

### Frontend Terminal

![Frontend CLI](assets/frontend_cli.png)

---

## ✨ Features & Stretch Goals Completed

| Feature                                                                              | Status |
| ------------------------------------------------------------------------------------ | ------ |
| **Multi-Agent Pipeline** (Planner → Researcher → Reviewer → Writer)                  | ✅     |
| **Parallel Sub-tasks** – Researcher uses `asyncio.gather` for concurrent research    | ✅     |
| **Retry / Error Handling** – `BaseAgent` retries with exponential backoff            | ✅     |
| **Real-Time Updates** – Server-Sent Events (SSE) stream progress live to the UI      | ✅     |
| **Agent Configuration** – Toggle the Reviewer Agent on/off from the UI               | ✅     |
| **Persistent State** – JSON file store survives server restarts                      | ✅     |
| **Unit Tests** – Pytest tests validate Orchestrator logic, retries & config skipping | ✅     |
| **Feedback Loop** – Reviewer can reject → Writer rewrites → Reviewer re-reviews      | ✅     |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│               React / Vite Frontend                 │
│   (Pipeline Visualizer · Report View · Config UI)   │
└───────────────────────┬─────────────────────────────┘
                        │  REST POST + SSE GET
┌───────────────────────▼─────────────────────────────┐
│                Python / Flask Backend                │
│  ┌───────────────────────────────────────────────┐  │
│  │              TaskOrchestrator                 │  │
│  │  Planner → Researcher (parallel) → Writer    │  │
│  │                      → Reviewer              │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────┐  ┌──────────────────────────┐    │
│  │  BaseAgent    │  │  JSON File (db.py)        │    │
│  │  (retry/log)  │  │  Persistent Event Store   │    │
│  └───────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

See [DESIGN.md](DESIGN.md) for the full architectural rationale and trade-off analysis.

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** v18+ & **npm**

### 1. Clone the repository

```bash
git clone https://github.com/nagakoushik24/Real-Time-Financial-Data-Pipeline-with-Kafka---Streamlit.git
cd Real-Time-Financial-Data-Pipeline-with-Kafka---Streamlit
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

> Backend runs on **http://localhost:5000**

### 3. Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs on **http://localhost:3000**

---

## 🎮 Usage

1. Open **http://localhost:3000** in your browser.
2. Enter a research prompt — e.g., _"Research the pros and cons of microservices"_.
3. Toggle the **Reviewer Agent** on or off using the configuration switch.
4. Click **"Execute Pipeline"**.
5. Watch the **real-time visualizer** as agents start, occasionally simulate retries, and pass data down the pipeline.
6. The final compiled **Markdown report** appears when the pipeline is complete.

---

## 🧪 Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

Pytest unit tests cover:

- Orchestrator happy-path execution (full Planner → Researcher → Writer pipeline)
- Config-based agent skipping (e.g., Planner-only pipeline)

---

## 📁 Project Structure

```
.
├── assets/               # 📷 Screenshots used in this README
├── backend/
│   ├── app.py            # Flask server (REST + SSE endpoints)
│   ├── db.py             # JSON file persistence layer
│   ├── models.py         # Dataclass models (TaskState, TaskEvent, etc.)
│   ├── orchestrator.py   # Pipeline executor with feedback loops
│   ├── requirements.txt  # Python dependencies
│   ├── agents/
│   │   ├── base_agent.py       # Abstract BaseAgent (retry + logging)
│   │   ├── planner_agent.py    # Splits prompt into subtasks
│   │   ├── researcher_agent.py # Parallel research via asyncio.gather
│   │   ├── writer_agent.py     # Synthesizes report draft
│   │   └── reviewer_agent.py   # Quality gate with feedback loop
│   └── tests/
│       └── test_orchestrator.py  # Pytest unit tests
├── frontend/
│   ├── index.html        # Entry HTML (Google Fonts)
│   ├── package.json      # Vite + React dependencies
│   ├── vite.config.js    # Dev server config (port 3000)
│   └── src/
│       ├── main.jsx      # React entry point
│       ├── App.jsx       # Main layout component
│       ├── App.css       # Dark glassmorphism design system
│       └── components/
│           ├── TaskForm.jsx           # Prompt input + submit
│           ├── PipelineVisualizer.jsx # Real-time SSE agent status
│           └── TaskResult.jsx         # Final report viewer
├── DESIGN.md             # Architectural decisions & trade-offs
└── README.md             # This file
```
