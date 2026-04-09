import os
import httpx
import logging
from typing import List, Dict, Optional, Any
import json
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"

logger = logging.getLogger(__name__)

class GroqClient:
    def __init__(self):
        if not GROQ_API_KEY:
            logger.warning("GROQ_API_KEY is not set. AI features will be disabled.")
            self.api_key = None
        else:
            self.api_key = GROQ_API_KEY

    async def get_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 1024,
        response_format: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Get chat completion from Groq API
        """
        if not self.api_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if response_format:
            payload["response_format"] = response_format

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GROQ_API_URL, 
                    headers=headers, 
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Groq API Error: {response.text}")
                    return None
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except Exception as e:
            logger.error(f"Groq Client Error: {e}")
            return None

    async def generate_nsqf_assessment(self, profile_text: str) -> Dict[str, Any]:
        """
        Generate NSQF level assessment and reasoning
        """
        system_prompt = """
        You are an expert in the National Skills Qualifications Framework (NSQF) of India.
        Analyze the user's profile and existing skills to determine their likely NSQF level (1-10).
        Provide a JSON response with:
        - calculated_level: int
        - reasoning: string (brief explanation)
        - recommended_next_level_skills: list of strings
        """
        
        user_prompt = f"Profile: {profile_text}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.get_chat_completion(
            messages, 
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        if response:
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                logger.error("Failed to decode JSON from Groq")
                return {"calculated_level": 0, "reasoning": "Error parsing AI response"}
        return {"calculated_level": 0, "reasoning": "AI service unavailable"}

    async def generate_learning_path(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        """
        Generate personalized learning path with stages
        """
        system_prompt = """
        You are an AI Career Coach. Create a detailed, step-by-step learning path to bridge the gap between current skills and target role.
        Output JSON:
        {
            "career_outlook": "Brief outlook on the career",
            "milestones": [
                {
                    "title": "Stage title (e.g. Foundation)",
                    "description": "What to learn",
                    "estimated_weeks": int,
                    "topics": ["topic1", "topic2"]
                }
            ]
        }
        """
        
        user_prompt = f"Current Skills: {', '.join(current_skills)}. Target Role: {target_role}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.get_chat_completion(
            messages,
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        
        if response:
            try:
                return json.loads(response)
            except Exception as e:
                logger.error(f"Error parsing learning path: {e}")
                return {}
        return {}

    async def recommend_courses_general(self, profile_text: str) -> List[Dict[str, Any]]:
        """
        Generate course suggestions based on profile text
        """
        system_prompt = """
        You are an AI Career Coach. Suggest 3-5 specific courses for the learner.
        Output JSON list with standard fields: title, description, difficulty, duration_hours (est), key_topics (list).
        Ensure titles sound like professional courses (e.g. "Advanced Python for Data Science").
        """
        
        user_prompt = f"Learner Profile: {profile_text}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.get_chat_completion(
            messages,
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        
        if response:
            try:
                data = json.loads(response)
                # Handle various JSON structures
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict):
                    for key in ["courses", "suggestions", "recommendations", "data"]:
                        if key in data and isinstance(data[key], list):
                            return data[key]
                    # Fallback if top-level dict is the course (unlikely) or wrapped differently
                    return []
            except Exception as e:
                logger.error(f"Error parsing course recommendations: {e}")
                return []
        return []

    async def generate_course_suggestions(self, profile_text: str, domain: str) -> List[Dict[str, Any]]:
        """
        Generate domain-based course suggestions
        """
        system_prompt = f"""
        Suggest 3-5 specific courses/topics for a learner interested in {domain}.
        Based on their profile: {profile_text}
        Output JSON list:
        [
            {{
                "title": "Course Title",
                "description": "Brief description",
                "difficulty": "Beginner/Intermediate/Advanced",
                "key_topics": ["topic1", "topic2"]
            }}
        ]
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        response = await self.get_chat_completion(
            messages,
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        
        if response:
            try:
                data = json.loads(response)
                # Handle if it returns a dict with a key or just list
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict):
                    # Look for likely keys
                    for key in ["courses", "suggestions", "data"]:
                        if key in data and isinstance(data[key], list):
                            return data[key]
                    return []
            except Exception as e:
                logger.error(f"Error parsing course suggestions: {e}")
                return []
        return []

    async def generate_nsqf_roadmap(self, current_level: int, target_domain: str) -> List[Dict]:
        """Generate a structured NSQF roadmap from current_level to 10, domain-specific."""
        if current_level >= 10:
            return [{
                "level": 10,
                "title": f"NSQF Level 10 — Expert / Mastery: {target_domain.title()}",
                "description": f"You have reached the highest NSQF level in {target_domain}. Focus on leadership, research, and knowledge contribution.",
                "skills": ["Advanced Architecture", "Research & Innovation", "Mentoring", "Strategic Thinking"],
                "estimated_weeks": 0
            }]

        system_prompt = (
            "You are an expert in India's National Skills Qualifications Framework (NSQF).\n"
            "Generate a structured learning roadmap as JSON with key 'roadmap' containing a list.\n"
            "Each item covers exactly ONE NSQF level from the given current level up to and including level 10.\n"
            "Each item must have: level (int), title (string), description (string, 2-3 sentences), "
            "skills (list of 4-6 strings), estimated_weeks (int).\n"
            "Rules: start from current level, end at 10, progressively advanced, no levels below current or above 10."
        )
        user_prompt = (
            f"Current NSQF Level: {current_level}. "
            f"Target Career Domain: {target_domain}. "
            f"Generate one roadmap step per level from {current_level} to 10."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        response = await self.get_chat_completion(
            messages, temperature=0.4, max_tokens=2048,
            response_format={"type": "json_object"}
        )
        if response:
            try:
                data = json.loads(response)
                roadmap = data.get("roadmap", [])
                if isinstance(roadmap, list) and len(roadmap) > 0:
                    roadmap = sorted(roadmap, key=lambda x: x.get("level", 0))
                    return [s for s in roadmap if isinstance(s.get("level"), int) and s["level"] <= 10]
            except Exception as e:
                logger.error(f"Error parsing NSQF roadmap response: {e}")
        return self._static_nsqf_roadmap_fallback(current_level, target_domain)

    def _static_nsqf_roadmap_fallback(self, current_level: int, target_domain: str) -> List[Dict]:
        """Static fallback NSQF roadmap when Groq is unavailable."""
        domain_skills = {
            "web development": ["HTML/CSS", "JavaScript", "React", "Node.js", "REST APIs", "Database Design", "Testing", "Cloud Deploy", "Performance", "Architecture"],
            "data science": ["Python", "Statistics", "Pandas/NumPy", "Visualization", "Machine Learning", "Feature Engineering", "Deep Learning", "Big Data", "MLOps", "Research"],
            "ai/ml": ["Python", "Linear Algebra", "Probability", "Scikit-learn", "Neural Networks", "NLP", "Computer Vision", "Reinforcement Learning", "LLMOps", "AI Architecture"],
            "cybersecurity": ["Networking", "Linux", "Ethical Hacking", "OWASP", "SOC Operations", "Pen Testing", "Threat Intel", "Cloud Security", "Incident Response", "Security Arch"],
            "cloud computing": ["Linux", "AWS/Azure Basics", "S3 & EC2", "Docker", "Kubernetes", "Terraform", "CI/CD", "Cost Optimization", "Multi-Cloud", "Cloud Architecture"],
        }
        domain_key = target_domain.lower()
        skills_pool = next(
            (v for k, v in domain_skills.items() if k in domain_key),
            ["Fundamentals", "Core Skills", "Intermediate", "Applied", "Advanced", "Expert", "Architecture", "Leadership", "Research", "Mastery"]
        )
        titles = ["Awareness", "Foundation", "Basic", "Intermediate", "Applied", "Competent", "Advanced", "Specialized", "Expert", "Mastery"]
        weeks = [4, 6, 8, 8, 10, 10, 12, 12, 14, 16]
        roadmap = []
        for i, lvl in enumerate(range(current_level, 11)):
            idx = lvl - 1
            skill_start = min(i, len(skills_pool) - 4)
            roadmap.append({
                "level": lvl,
                "title": f"NSQF Level {lvl} — {titles[idx]}: {target_domain.title()}",
                "description": f"At NSQF Level {lvl}, develop {titles[idx].lower()} competencies in {target_domain}. This stage prepares you with industry-relevant skills for the next level.",
                "skills": skills_pool[skill_start:skill_start + 4],
                "estimated_weeks": weeks[idx]
            })
        return roadmap
