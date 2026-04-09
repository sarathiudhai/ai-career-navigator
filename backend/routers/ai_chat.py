from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from auth import get_current_user, role_required
from ml.groq_client import GroqClient
from database import get_database
import logging

router = APIRouter(prefix="/ai-chat", tags=["ai-chat"])
logger = logging.getLogger(__name__)

# Initialize Groq Client
groq_client = GroqClient()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = {}
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    response: str
    suggested_actions: Optional[List[str]] = []

@router.post("/career-coach", response_model=ChatResponse)
async def career_coach_chat(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """
    General AI Career Coach Chatbot
    """
    try:
        # Construct system prompt with user context
        user_context = (
            f"User Role: {current_user.role}. "
            f"NSQF Level: {current_user.nsqf_level}. "
            f"Target Career: {current_user.profile.target_career or 'Undecided'}. "
            f"Skills: {', '.join(current_user.profile.skills)}. "
        )
        
        system_prompt = f"""
        You are 'AI BOT', an AI Career Coach for the AI Career Navigator platform.
        Your goal is to guide learners in India's vocational ecosystem (NSQF context).
        
        User Context:
        {user_context}
        
        Guidelines:
        - Be encouraging, professional, and practical.
        - Suggest specific skills, courses, or certifications based on NSQF levels.
        - If the user asks about jobs, mention relevant roles and NSQF levels required.
        - Keep responses concise (under 200 words unless detailed explanation needed).
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (limit to last 5 turns to save context)
        if request.history:
            messages.extend(request.history[-10:])
            
        # Add current message
        messages.append({"role": "user", "content": request.message})
        
        response_text = await groq_client.get_chat_completion(messages)
        
        if not response_text:
            raise HTTPException(status_code=503, detail="AI service unavailable")
            
        return ChatResponse(
            response=response_text,
            suggested_actions=["View Courses", "Update Profile", "Check Skill Gap"]
        )
        
    except Exception as e:
        logger.error(f"Career chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate advice"
        )

@router.post("/course-assistant/{course_id}", response_model=ChatResponse)
async def course_assistant_chat(
    course_id: str,
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """
    Context-aware Course Assistant Chatbot
    """
    try:
        db = await get_database()
        course = await db.courses.find_one({"course_id": course_id})
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        # Enrich context with module details if available to answer syllabus doubts
        modules_text = ""
        if "modules" in course:
            modules_text = "Modules:\n" + "\n".join(
                [f"- {m.get('title', 'Module')}: {m.get('description', '')}" for m in course["modules"]]
            )

        course_context = (
            f"Course Title: {course['title']}. "
            f"Description: {course['description']}. "
            f"NSQF Level: {course['nsqf_level']}. "
            f"Skills Gained: {', '.join(course.get('skills_gained', []))}. "
            f"{modules_text}"
        )
        
        system_prompt = f"""
        You are a Course Teaching Assistant for '{course['title']}'.
        Your goal is to help learners understand the course content, syllabus, and concepts.
        
        Course Context:
        {course_context}
        
        Guidelines:
        - Answer questions strictly based on the course topic and provided modules.
        - Explain technical concepts clearly.
        - If the learner asks about the syllabus, refer to the modules list.
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        if request.history:
            # Filter history to keep it relevant? For now, just append.
            messages.extend(request.history[-10:])
            
        messages.append({"role": "user", "content": request.message})
        
        response_text = await groq_client.get_chat_completion(messages)
        
        if not response_text:
            raise HTTPException(status_code=503, detail="AI service unavailable")
            
        return ChatResponse(
            response=response_text
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Course chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate course help"
        )

# ── LMS AI Tools ──────────────────────────────────────────────

class QuestionGenRequest(BaseModel):
    topic: str
    difficulty: str = "Medium"
    question_type: str = "mcq" # mcq, true_false, short_answer
    num_questions: int = 5

@router.post("/generate_questions")
async def generate_questions(
    request: QuestionGenRequest,
    current_user = Depends(get_current_user)
):
    """Generate assessment questions using AI"""
    if current_user.role != "trainer":
        raise HTTPException(status_code=403, detail="Only trainers can generate questions")
        
    try:
        format_instructions = ""
        if request.question_type == "mcq":
            format_instructions = '''
            "questions": [
              {
                "text": "Question text",
                "question_type": "mcq",
                "options": ["A", "B", "C", "D"],
                "correct_option": 0
              }
            ]
            '''
        elif request.question_type == "true_false":
            format_instructions = '''
            "questions": [
              {
                "text": "Question text",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_option": 0
              }
            ]
            '''
        else:
            format_instructions = '''
            "questions": [
              {
                "text": "Question text",
                "question_type": "short_answer",
                "correct_answer": "Ideal short answer text"
              }
            ]
            '''
            
        system_prompt = f"""
        You are an expert curriculum designer. 
        Generate {request.num_questions} {request.difficulty} level questions about '{request.topic}'.
        They must be of type {request.question_type}.
        Return ONLY valid JSON in this exact format:
        {{
            {format_instructions}
        }}
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        response_text = await groq_client.get_chat_completion(messages, response_format={"type": "json_object"})
        
        if not response_text:
            raise HTTPException(status_code=503, detail="AI generation failed")
            
        import json
        data = json.loads(response_text)
        
        return {"success": True, "message": "Questions generated successfully", "data": data.get("questions", [])}
    except Exception as e:
        logger.error(f"Question Gen Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")

@router.get("/analyze_weakness/{student_id}")
async def analyze_student_weakness(
    student_id: str,
    current_user = Depends(get_current_user)
):
    """Analyze student's assessment scores and identify weak modules"""
    try:
        db = await get_database()
        submissions = await db.assessmentsubmissions.find({"learner_id": student_id}).to_list(length=None)
        
        if not submissions:
            return {"success": True, "message": "No data to analyze", "data": {"analysis": "Insufficient data to determine weaknesses."}}
            
        stats_text = "\\n".join([f"Assessment {s['assessment_id']}: Score {s.get('score', 0)}% (Passed: {s.get('passed', False)})" for s in submissions])
        
        system_prompt = f"""
        You are an AI Education Analyst. 
        Analyze these assessment scores for a student:
        {stats_text}
        
        Identify potential weaknesses and suggest a customized learning strategy. Keep it under 150 words.
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        response_text = await groq_client.get_chat_completion(messages)
        
        return {"success": True, "data": {"analysis": response_text}}
    except Exception as e:
        logger.error(f"Weakness Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze learner context")

@router.get("/course_improvement/{course_id}")
async def course_improvement_suggestions(
    course_id: str,
    current_user = Depends(get_current_user)
):
    """Suggest course improvements based on metrics"""
    if current_user.role != "trainer":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        db = await get_database()
        course = await db.courses.find_one({"course_id": course_id})
        submissions = await db.assessmentsubmissions.find({"course_id": course_id}).to_list(length=None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        avg_score = sum(s.get("score", 0) for s in submissions) / len(submissions) if submissions else 0
        
        system_prompt = f"""
        You are an AI Instructional Designer assisting a Trainer.
        Course: {course.get('title')}
        Duration: {course.get('duration_weeks')} weeks
        Enrolled Learners Array Length: {len(course.get('enrolled_learners', []))}
        Average Assessment Score: {avg_score}%
        
        Based on this limited metadata, what proactive steps can the trainer take to improve student engagement and retention? Provide 3 actionable bullet points.
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        response_text = await groq_client.get_chat_completion(messages)
        
        return {"success": True, "data": {"suggestions": response_text}}
        
    except Exception as e:
        logger.error(f"Course Improvement Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate suggestions")

class AnalyticsPayloadRequest(BaseModel):
    overview: Dict[str, Any]
    course_performance: List[Dict[str, Any]]
    top_domains: List[Dict[str, Any]]

@router.post("/trainer-insights")
async def generate_trainer_insights(
    payload: AnalyticsPayloadRequest,
    current_user = Depends(get_current_user)
):
    """Generate high-level actionable insights for the Trainer Dashboard using Groq API."""
    if current_user.role != "trainer":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        import json
        payload_str = json.dumps(payload.dict(), indent=2)
        
        system_prompt = f"""
        You are an elite Data Analyst and Instructional Designer advising a Trainer.
        Analyze this limited LMS metrics payload:
        {payload_str}
        
        Provide 3 concise, actionable bullet points (under 150 words total) highlighting:
        1. A positive trend or success.
        2. A concerning metric (e.g., low completion or high drop-off).
        3. A specific recommendation on what they should do next (e.g., 're-engage students in course X', 'create more courses on topic Y').
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        response_text = await groq_client.get_chat_completion(messages)
        
        if not response_text:
            return {"success": False, "message": "AI generation failed"}
            
        return {"success": True, "data": {"insights": response_text}}

    except Exception as e:
        logger.error(f"Trainer Insights Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate trainer insights")
