# AI Career Navigator & Skilling Assistant

A professional-grade SaaS platform that maps learner profiles to NCVET-approved vocational qualifications and NSQF levels (1–10) using AI-powered recommendations.

## 🚀 Features

### 🎯 Core Functionality
- **Personalized Learning Paths**: AI-driven roadmaps based on user profiles and NSQF levels.
- **AI Career Coach**: Context-aware chatbot for personalized career advice.
- **Course Assistant**: Specialized AI bot for module-specific queries using course context.
- **Smart Recommendations**: Intelligent domain-based course suggestions.
- **Assessment Engine**: pass-fail exams for course validation.
- **Auto-Certification**: passed assessments automatically generate credentials on the user profile.
- **Profile Management**: Dynamic profile updates with NSQF level recalculation.

### 🎨 Pro-Level UI/UX
- **Modern Dashboard**: Glassmorphic design with smooth animations and dynamic data.
- **Responsive Design**: Mobile-first approach with collapsible sidebar.
- **Interactive Visualizations**: Roadmap timelines, progress bars, and achievement badges.
- **Visual Confidence**: Toast notifications and loading states.

### 🛠 Technical Stack

#### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Custom theme)
- **Framer Motion** (Animations)
- **Lucide React** (Icons)

#### Backend
- **FastAPI** (Python)
- **MongoDB** (Motor for async operations)
- **Groq AI** (Llama 3 for recommendations and chat)
- **Pydantic v2** (Data validation)
- **JWT** (Secure Authentication)

## 📁 Project Structure

```
ai-career-navigator/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/       # UI Components (Sidebar, ProtectedRoute, etc.)
│   │   ├── pages/           # Pages (Dashboard, Profile, Assessments, etc.)
│   │   ├── utils/           # API Client (Axios-based)
│   │   └── App.jsx          # Routing & Layout
├── backend/                  # FastAPI Application
│   ├── routers/             # API Endpoints (Learn, Auth, AI, etc.) 
│   ├── ml/                  # AI Clients & Predictors
│   ├── models.py            # Pydantic Schemas
│   ├── database.py          # MongoDB Connection
│   ├── main.py              # Entry Point
│   └── requirements.txt     # Python Dependencies
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB instance (Local or Atlas)
- Groq API Key (for AI features)

### Backend Setup (Mandatory Venv)
1. **Create Virtual Environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Environment Variables**: Create `.env` in `backend/`:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=ai_career_navigator
   GROQ_API_KEY=your_key_here
   SECRET_KEY=your_jwt_secret
   ```
4. **Run Server**:
   ```bash
   python main.py
   ```

### Frontend Setup
1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```
2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

## 📊 Core API Endpoints

### Learners
- `GET /api/learners/dashboard` - Get full dynamic dashboard state
- `POST /api/learners/profile` - Update profile & recalculate NSQF
- `GET /api/learners/recommendations` - Get AI-driven course suggestions
- `POST /api/learners/assessments/{id}/submit` - Submit exam & get score/cert

### AI Chat
- `POST /api/ai-chat/career-coach` - Profile-aware career mentor
- `POST /api/ai-chat/course-assistant/{id}` - Context-aware course support

## 🛠 Troubleshooting

### "Failed to load dashboard data"
Ensure the backend server is running and connected to MongoDB. Check that `python main.py` is executed inside the **activated virtual environment** to ensure all dependencies like `motor` and `pydantic` are available.

### "Something went wrong" (React Crash)
If the dashboard crashes with a React rendering error, it is likely due to stale data in MongoDB. Run a migration or clear the `users` collection if you've recently changed the `learning_path` data structure from strings to objects.

### MongoDB Connection Refused
Verify that your MongoDB service is running and the `MONGODB_URI` in `.env` is correct.

---

**Built with ❤️ for vocational education transformation in India**
