# 🚀 ProjectPulse – AI-Assisted Academic Project Management Platform

ProjectPulse helps university professors track student group projects through **structured weekly progress updates**, **AI-generated summaries**, and **contribution analytics**.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [API Reference](#api-reference)
7. [AI Pipeline](#ai-pipeline)
8. [Database Schema](#database-schema)
9. [Development Plan](#development-plan)
10. [Future Features](#future-features)

---

## Overview

### The Problem

University professors struggle to track group project progress:

- Updates are inconsistent (WhatsApp, email, Google Docs)
- Individual contributions are unclear and hard to verify
- Project evaluation is subjective
- Risk signals (blockers, falling behind) are identified too late

### The Solution

ProjectPulse provides:

- **Students** submit structured weekly updates (completed tasks, blockers, contribution %)
- **Professors** get a unified dashboard with team activity, analytics, and AI-generated summaries
- **AI pipeline** (local LLM or rule-based fallback) generates weekly summaries and risk alerts

---

## Features

### 👩‍🎓 Student Features
- Register and join projects via invite code
- Submit structured weekly updates:
  - Completed tasks with hours spent
  - Planned tasks for next week
  - Active blockers (with severity)
  - Individual contribution summary
  - Team mood indicator
- View project timeline and milestones
- See team members' updates (anonymised contribution view)
- Review AI-generated summaries for their project

### 👨‍🏫 Professor Features
- Create projects with milestones and invite codes
- Invite code distribution (share `XXXXXX` code with students)
- Project dashboard with:
  - Team overview and member list
  - Weekly update activity chart
  - Submission rate tracking
  - Blocker visibility
- AI summary generation per week/team
- Risk level indicators (Low → Critical)
- Recommendation engine

### 🤖 AI Features
- Weekly progress summarisation
- Risk assessment (blockers, mood, milestone deadlines)
- Contribution pattern analysis
- Automated recommendations for professors
- Supports local LLM backends (Ollama, llama.cpp) with rule-based fallback

---

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | React 18, Vite, TailwindCSS, Recharts |
| Backend       | Node.js 20, Express 4, JWT auth     |
| Database      | MongoDB 7 (Mongoose ODM)            |
| AI Service    | Python 3.12, FastAPI, Ollama/llama.cpp |
| Containerisation | Docker, Docker Compose          |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│              React SPA (port 5173 / 80)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/HTTP
┌──────────────────────▼──────────────────────────────────────┐
│                   Express API (port 5000)                    │
│  /api/auth  /api/projects  /api/updates  /api/teams         │
│  /api/ai                                                     │
└──────┬───────────────────────────────────┬──────────────────┘
       │ Mongoose                          │ HTTP (axios)
┌──────▼──────┐                 ┌──────────▼────────────────┐
│  MongoDB    │                 │  AI Service (port 8000)   │
│  (port 27017)│                 │  FastAPI + LLM pipeline   │
└─────────────┘                 └───────────────────────────┘
```

### Data flow: AI summary generation

```
Student submits update
        ↓
Backend stores update in MongoDB
        ↓
Professor triggers summary (POST /api/ai/summary)
        ↓
Backend fetches week's updates from MongoDB
        ↓
Calls AI Service POST /summarize
        ↓
AI Service: build prompt → call LLM (or rule-based fallback)
        ↓
AI Service returns summary + risk analysis
        ↓
Backend saves AIInsight document
        ↓
Frontend displays insight on Professor dashboard
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- MongoDB 7+ **or** Docker Desktop

### Option A – Docker Compose (recommended)

```bash
# Clone the repo
git clone https://github.com/Dev-Lahrani/TracAdemic.git
cd TracAdemic

# Copy and edit environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and set a strong JWT_SECRET

# Start everything
docker compose up --build
```

Then open **http://localhost** in your browser.

### Option B – Local development

**1. Start MongoDB**
```bash
mongod --dbpath ./mongo-data
```

**2. Backend**
```bash
cd backend
cp .env.example .env     # Edit JWT_SECRET and other values
npm install
npm run dev              # Starts on http://localhost:5000
```

**3. AI Service**
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Starts on http://localhost:8000
```

**4. Frontend**
```bash
cd frontend
npm install
npm run dev              # Starts on http://localhost:5173
```

---

## AI Pipeline

The AI service (`ai-service/`) is a standalone FastAPI microservice.

### Backends

| Backend    | Description                         | Setup Required                          |
|------------|-------------------------------------|-----------------------------------------|
| `mock`     | Rule-based (default, no LLM needed) | None                                    |
| `ollama`   | Ollama local LLM                    | `ollama run mistral` (or any model)     |
| `llamacpp` | llama.cpp Python bindings           | `pip install llama-cpp-python`          |

Set the backend via environment variable:
```bash
LLM_BACKEND=ollama OLLAMA_MODEL=mistral uvicorn main:app --port 8000
```

### Prompt strategy

For each weekly summary, the prompt includes:
- Project title, course, current week
- Each student's contribution summary, completed tasks, blockers, hours, mood
- Instructions to produce a concise professional summary for the professor

The service then runs a separate risk assessment (rule-based) to determine risk level, risk factors, and recommendations.

---

## API Reference

### Authentication

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/api/auth/register`  | Create account       |
| POST   | `/api/auth/login`     | Obtain JWT token     |
| GET    | `/api/auth/me`        | Get current profile  |
| PUT    | `/api/auth/me`        | Update profile       |

### Projects

| Method | Endpoint                       | Access     |
|--------|--------------------------------|------------|
| POST   | `/api/projects`                | Professor  |
| GET    | `/api/projects`                | Professor  |
| GET    | `/api/projects/student`        | Student    |
| POST   | `/api/projects/join`           | Student    |
| GET    | `/api/projects/:id`            | Both       |
| PUT    | `/api/projects/:id`            | Professor  |
| GET    | `/api/projects/:id/progress`   | Both       |

### Weekly Updates

| Method | Endpoint                          | Access    |
|--------|-----------------------------------|-----------|
| POST   | `/api/updates`                    | Student   |
| GET    | `/api/updates/project/:projectId` | Both      |
| GET    | `/api/updates/my/:projectId`      | Student   |
| GET    | `/api/updates/:id`                | Both      |
| PUT    | `/api/updates/:id`                | Student   |

### Teams

| Method | Endpoint                         | Access |
|--------|----------------------------------|--------|
| GET    | `/api/teams/project/:projectId`  | Both   |
| GET    | `/api/teams/:id`                 | Both   |
| GET    | `/api/teams/:id/analytics`       | Both   |

### AI Insights

| Method | Endpoint                            | Access    |
|--------|-------------------------------------|-----------|
| POST   | `/api/ai/summary`                   | Professor |
| GET    | `/api/ai/insights/:projectId`       | Both      |
| GET    | `/api/ai/insights/:projectId/latest`| Both      |

---

## Database Schema

### Users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password": "string (bcrypt hashed)",
  "role": "professor | student",
  "department": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Projects
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "professor": "ObjectId → User",
  "course": "string",
  "semester": "string",
  "startDate": "Date",
  "endDate": "Date",
  "inviteCode": "string (6-char, unique)",
  "status": "planning | active | completed | at-risk",
  "milestones": [{ "title", "dueDate", "completed" }],
  "tags": ["string"]
}
```

### Teams
```json
{
  "_id": "ObjectId",
  "project": "ObjectId → Project",
  "name": "string",
  "members": [{ "user": "ObjectId → User", "role": "leader | member", "joinedAt": "Date" }]
}
```

### WeeklyUpdates
```json
{
  "_id": "ObjectId",
  "project": "ObjectId → Project",
  "team": "ObjectId → Team",
  "student": "ObjectId → User",
  "weekNumber": "number",
  "completedTasks": [{ "title", "description", "hoursSpent" }],
  "plannedTasks": [{ "title", "description" }],
  "blockers": [{ "description", "severity", "resolved" }],
  "individualContribution": "string",
  "contributionPercentage": "number (0-100)",
  "mood": "great | good | okay | struggling",
  "hoursWorked": "number"
}
```

### AIInsights
```json
{
  "_id": "ObjectId",
  "project": "ObjectId → Project",
  "team": "ObjectId → Team",
  "weekNumber": "number",
  "type": "weekly_summary | contribution_analysis | risk_alert",
  "summary": "string",
  "riskLevel": "low | medium | high | critical",
  "riskFactors": ["string"],
  "recommendations": ["string"],
  "contributionBreakdown": [{ "student", "studentName", "percentage", "sentiment" }],
  "generatedBy": "llm | rule-based | mock"
}
```

---

## Development Plan

| Days   | Focus                                      |
|--------|--------------------------------------------|
| 1–2    | Project setup, directory structure, Docker |
| 3–4    | Authentication (register, login, JWT)      |
| 5–6    | Project creation + invite system           |
| 7–8    | Weekly update submission (student)         |
| 9–10   | Professor dashboard + team analytics       |
| 11–12  | AI summarisation pipeline                  |
| 13     | End-to-end testing                         |
| 14     | Demo preparation & polish                  |

---

## Future Features

1. **GitHub Integration** – Auto-detect commits per student; correlate with weekly updates
2. **Automated Contribution Detection** – Pull request & commit analytics for cross-validation
3. **Milestone Forecasting** – Predict whether a team will meet upcoming milestones
4. **Project Grading Assistant** – AI-suggested grade bands based on contribution history
5. **Peer Evaluation System** – Anonymous inter-team member rating at project end
6. **Email/Slack Notifications** – Remind students to submit weekly updates
7. **Export to PDF** – Downloadable project report for grading archives
8. **Custom Rubrics** – Professor-defined evaluation criteria linked to updates
9. **Multi-project Dashboard** – Cross-project analytics for department heads
10. **Mobile App** – React Native companion for quick mobile updates

---

## License

MIT License – see [LICENSE](./LICENSE) for details.
