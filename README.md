# ProjectPulse – AI-Assisted Academic Project Management Platform

ProjectPulse helps university professors track student group projects through **structured weekly progress updates**, **AI-generated summaries**, and **contribution analytics**.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [API Reference](#api-reference)
7. [AI Pipeline](#ai-pipeline)
8. [Database Schema](#database-schema)
9. [Future Features](#future-features)

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

### Student Features
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

### Professor Features
- Create projects with milestones and invite codes
- Invite code distribution (share code with students)
- Project dashboard with:
  - Team overview and member list
  - Weekly update activity chart
  - Submission rate tracking
  - Blocker visibility
- AI summary generation per week/team
- Risk level indicators (Low → Critical)
- Recommendation engine
- Project Analytics page with contribution charts, weekly trends, and member stat cards
- Academic Integrity Analysis to flag suspicious patterns

### Document Management
- Request specific documents from students (PDF, presentations, code, etc.)
- File upload with drag-and-drop
- Document review workflow (pending/approved/rejected)
- Due date tracking

### Q&A System
- Post questions about the project
- Threaded replies from professors and teammates
- Mark answers as accepted
- Close resolved questions

### Meeting Scheduler
- Schedule team meetings with date/time/duration
- Video conferencing link integration (Zoom, Google Meet, etc.)
- Location support for in-person meetings
- Meeting status tracking (scheduled/completed/cancelled)

### Evaluations & Grading
- Create custom assessments with weighted criteria
- Track evaluation due dates
- AI-powered grade suggestions based on contribution history

### Industry Projects
- Post industry-sponsored projects for students
- Student application system with team profiles
- Application review workflow (pending/accepted/rejected)

### Peer Review System
- Anonymous peer feedback for team members
- Rating system (1-5 stars)
- Structured feedback (strengths, improvements, comments)
- Review history for both giving and receiving feedback

### AI & Advanced Features
- Weekly progress summarisation
- **Risk Prediction Engine** — real-time project risk scores with participation and trend signals
- **GitHub Contribution Verification** — cross-reference GitHub commits/PRs/reviews with self-reported hours
- **Academic Integrity Detector** — Jaccard similarity detection, contribution imbalance, last-minute spikes
- **Predictive Analytics** — ML-powered success probability forecasting
- Contribution pattern analysis
- Automated recommendations for professors
- Supports local LLM backends (Ollama, llama.cpp) with rule-based fallback

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React 18, Vite, TailwindCSS, Recharts |
| Backend | Node.js 20, Express 5, JWT auth |
| Database | MongoDB 7 (Mongoose ODM) |
| AI Service | Python 3.12, FastAPI, Ollama/llama.cpp |
| Containerisation | Docker, Docker Compose |

---

## Architecture

```
Browser (React SPA) <-> Express API <-> MongoDB
                              |
                              v
                    AI Service (FastAPI/Python)
                              |
                              v
                        GitHub API
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
- MongoDB 7+ or Docker Desktop

### Docker Compose (recommended)

```bash
# Clone the repo
git clone https://github.com/Dev-Lahrani/TracAdemic.git
cd TracAdemic

# Copy and edit environment variables
cp backend/.env.example backend/.env

# Start everything
docker compose up --build
```

Then open **http://localhost** in your browser.

### Local Development

**1. Start MongoDB**
```bash
mongod --dbpath ./mongo-data
```

**2. Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**3. AI Service**
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**4. Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Create account | Public |
| POST | `/api/auth/login` | Obtain JWT token | Public |
| GET | `/api/auth/me` | Get current profile | Private |
| PUT | `/api/auth/me` | Update profile | Private |

### Projects

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/projects` | Professor |
| GET | `/api/projects` | Professor |
| GET | `/api/projects/student` | Student |
| POST | `/api/projects/join` | Student |
| GET | `/api/projects/:id` | Both |
| PUT | `/api/projects/:id` | Professor |
| GET | `/api/projects/:id/progress` | Both |

### Weekly Updates

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/updates` | Student |
| GET | `/api/updates/project/:projectId` | Both |
| GET | `/api/updates/my/:projectId` | Student |
| GET | `/api/updates/:id` | Both |
| PUT | `/api/updates/:id` | Student |

### Teams

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/teams/project/:projectId` | Both |
| GET | `/api/teams/:id` | Both |
| GET | `/api/teams/:id/analytics` | Both |
| POST | `/api/teams` | Professor |
| POST | `/api/teams/:id/invite` | Professor |
| DELETE | `/api/teams/:id/members/:userId` | Professor |
| PUT | `/api/teams/:id/leader` | Professor |

### AI Insights

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/ai/summary` | Professor | Generate weekly AI summary |
| POST | `/api/ai/contribution-analysis` | Professor | Analyze contribution balance |
| GET | `/api/ai/insights/:projectId` | Both | List all insights |
| GET | `/api/ai/insights/:projectId/latest` | Both | Get most recent insight |
| GET | `/api/ai/risk/:projectId` | Both | Real-time risk prediction |
| GET | `/api/ai/integrity/:projectId` | Professor | Academic integrity analysis |

### Documents

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/documents/requests` | Professor |
| GET | `/api/documents/requests/project/:projectId` | Both |
| POST | `/api/documents/upload` | Student |
| GET | `/api/documents/project/:projectId` | Both |
| PUT | `/api/documents/:id/review` | Professor |

### Doubts & Meetings

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/doubts` | Student |
| GET | `/api/doubts/project/:projectId` | Both |
| POST | `/api/doubts/:id/reply` | Both |
| PUT | `/api/doubts/:id/close` | Both |
| POST | `/api/doubts/meetings` | Professor |
| GET | `/api/doubts/meetings/project/:projectId` | Both |
| PUT | `/api/doubts/meetings/:id` | Professor |

### Evaluations

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/evaluations` | Professor |
| GET | `/api/evaluations/project/:projectId` | Both |
| GET | `/api/evaluations/suggest/:projectId/:studentId` | Professor |

### Industry Projects

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/industry` | Professor |
| GET | `/api/industry` | Both |
| GET | `/api/industry/:id` | Both |
| POST | `/api/industry/:id/apply` | Student |
| PUT | `/api/industry/applications/:id/review` | Professor |
| GET | `/api/industry/my-applications` | Student |

### Peer Reviews

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/peer-reviews` | Student |
| GET | `/api/peer-reviews/project/:projectId` | Both |
| GET | `/api/peer-reviews/my-reviews/:projectId` | Student |

### GitHub Integration

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/github/contribution/:studentId` | Private |

---

## AI Pipeline

The AI service is a standalone FastAPI microservice.

### Backends

| Backend | Description |
|---------|-------------|
| `mock` | Rule-based (default, no LLM needed) |
| `ollama` | Ollama local LLM |
| `llamacpp` | llama.cpp Python bindings |

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
  "department": "string"
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
  "inviteCode": "string",
  "status": "planning | active | completed | at-risk"
}
```

### Teams
```json
{
  "_id": "ObjectId",
  "project": "ObjectId → Project",
  "name": "string",
  "members": [{ "user": "ObjectId → User", "role": "leader | member" }]
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
  "contributionPercentage": "number",
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
  "recommendations": ["string"]
}
```

---

## Future Features

1. Email/Slack Notifications
2. Export to PDF
3. Custom Rubrics
4. Multi-project Dashboard for Department Heads
5. Mobile App (React Native)
6. Milestone Forecasting

---

## License

MIT License – see [LICENSE](./LICENSE) for details.
