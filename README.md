# AI Career Navigator

A full-stack web platform that helps learners find the right career path based on India's NSQF (National Skills Qualifications Framework) levels. It uses AI to recommend courses, generate learning roadmaps, and provide career guidance through a chatbot.

Built with FastAPI, React, MongoDB, and Groq AI.

## What it does

- **Learners** can set up their profile, get matched to an NSQF level (1-10), browse courses, take assessments, and earn certificates.
- **Trainers** can create and manage courses, track student progress, create assessments, and view analytics.
- **Policymakers** get a dashboard with skill gap analysis, regional insights, and exportable reports.

There's also an AI career coach chatbot that gives personalized advice based on your profile.

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, Framer Motion  
**Backend:** FastAPI, MongoDB (Motor), Pydantic v2  
**AI:** Groq API (Llama 3) for recommendations, roadmaps, and chat  
**Auth:** JWT-based with role-based access control

## Project Structure

```
ai-career-navigator/
├── frontend/              # React app
│   ├── src/
│   │   ├── components/    # Sidebar, ChatBot, etc.
│   │   ├── pages/         # All page components
│   │   └── utils/         # API client
│   └── package.json
├── backend/               # FastAPI server
│   ├── routers/           # API routes (auth, learners, trainers, etc.)
│   ├── ml/                # Groq client and ML predictor
│   ├── models.py          # Pydantic models
│   ├── auth.py            # JWT auth logic
│   ├── main.py            # App entry point
│   └── requirements.txt
└── README.md
```

## Getting Started

### You'll need
- Node.js 18+
- Python 3.10+
- MongoDB running locally (or a MongoDB Atlas URI)
- A Groq API key from [console.groq.com](https://console.groq.com)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your values:

```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=ai_career_navigator
GROQ_API_KEY=your_key_here
SECRET_KEY=your_jwt_secret
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Some useful API endpoints

| Endpoint | What it does |
|----------|-------------|
| `POST /api/auth/register` | Create a new account |
| `POST /api/auth/login` | Login (role is validated) |
| `GET /api/learners/dashboard` | Learner dashboard data |
| `POST /api/learners/profile` | Update profile & recalculate NSQF |
| `POST /api/ai-chat/career-coach` | Chat with the AI career coach |
| `GET /api/trainers/analytics` | Trainer analytics dashboard |

Full API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs) when the backend is running.

## Common issues

**"Failed to load dashboard data"** — Make sure the backend is running and MongoDB is connected. Run the server inside the activated venv.

**MongoDB connection refused** — Check that MongoDB is running and your `MONGODB_URI` in `.env` is correct.

**Login says "select the correct role"** — The role you picked on the login screen (Learner/Trainer/Policymaker) has to match the role you registered with.
