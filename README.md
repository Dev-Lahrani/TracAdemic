# trackAcademic – AI-Assisted Academic Project Management Platform

trackAcademic helps university professors track student group projects through **structured weekly progress updates**, **AI-generated summaries**, and **contribution analytics**.

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

---

## Overview

### The Problem

University professors struggle to track group project progress:

- Updates are inconsistent (WhatsApp, email, Google Docs)
- Individual contributions are unclear and hard to verify
- Project evaluation is subjective
- Risk signals (blockers, falling behind) are identified too late

### The Solution

trackAcademic provides:

- **Students** submit structured weekly updates (completed tasks, blockers, contribution %)
- **Professors** get a unified dashboard with team activity, analytics, and AI-generated summaries
- **AI pipeline** (local LLM or rule-based fallback) generates weekly summaries and risk alerts

---

## Features

### Core Features

#### Student Features
- Register and join projects via invite code
- Submit structured weekly updates with tasks, blockers, and mood
- View project timeline and milestones
- See AI-generated insights and recommendations

#### Professor Features
- Create projects with milestones and invite codes
- Team overview dashboard with activity tracking
- AI summary generation and risk prediction
- Academic integrity analysis

### Advanced Features

#### Document Management
- Request specific documents from students (PDF, presentations, code)
- File upload with drag-and-drop
- Document review workflow (pending/approved/rejected)

#### Q&A System
- Post questions with threaded replies
- Mark answers as accepted
- Close resolved questions

#### Meeting Scheduler
- Schedule team meetings with date/time/duration
- Video conferencing link integration

#### Evaluations & Grading
- Create assessments with weighted criteria
- Track evaluation due dates

#### Industry Projects
- Post industry-sponsored projects
- Student application system

#### Peer Review System
- Anonymous peer feedback (1-5 star rating)
- Structured feedback (strengths, improvements)

### 🤖 Mind-Blowing AI Features

#### **AI Code Review Assistant**
- Real-time code analysis with security vulnerability detection
- Code quality scoring (0-100)
- Cyclomatic complexity analysis
- Smart suggestions for code improvements
- Multi-language support (JavaScript, Python, Java, C++, C#, PHP)

#### **Voice/Video Updates with AI Transcription**
- Record audio/video updates directly in the browser
- Upload files for AI transcription
- Emotion analysis from spoken content
- Speech sentiment detection (positive/negative/neutral)
- Keyword extraction from transcripts

#### **Smart Task Distribution AI**
- AI-powered task assignment based on skills, workload, and availability
- Skill matching algorithm for optimal task-person fit
- Workload balancing to prevent burnout
- Visual workload distribution dashboard
- Smart recommendations for task rebalancing

#### **Predictive Analytics**
- Machine learning-powered success probability forecasting
- Team risk analysis with trend indicators
- Resource utilization tracking

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

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |

### Projects

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/projects` | Professor |
| GET | `/api/projects` | Professor |
| GET | `/api/projects/student` | Student |

### AI Code Review

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/code-review/review` | Both |
| POST | `/api/code-review/quality/:projectId` | Both |
| POST | `/api/code-review/improvements/:projectId` | Both |

### Voice Updates

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/voice-updates/upload` | Student |
| GET | `/api/voice-updates/project/:projectId` | Both |

### Task Assignments

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/assignments/suggest` | Both |
| POST | `/api/assignments/workload` | Both |

---

## AI Pipeline

### AI Code Review

The code review assistant performs:
1. **Security Analysis** - Detects SQL injection, XSS, eval() usage, ReDoS
2. **Code Quality Check** - Line length, TODO comments, debug code
3. **Complexity Analysis** - Cyclomatic complexity scoring
4. **Smart Suggestions** - Refactoring recommendations

### Voice Transcription & Analysis

1. **Audio Processing** - Browser-based recording or file upload
2. **Transcription** - Convert audio to text
3. **Emotion Detection** - Analyze sentiment from speech
4. **Keyword Extraction** - Identify important terms

### Smart Task Distribution

1. **Skill Matching** - Match tasks to team members' skills
2. **Workload Balancing** - Distribute tasks evenly
3. **Performance Scoring** - Factor in historical performance
4. **Predictive Analysis** - Estimate completion times

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

---

## License

MIT License – see [LICENSE](./LICENSE) for details.
