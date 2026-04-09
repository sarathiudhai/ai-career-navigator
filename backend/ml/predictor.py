from typing import List, Dict, Any, Tuple
import logging
from .groq_client import GroqClient

logger = logging.getLogger(__name__)

class MLPredictor:
    def __init__(self):
        self.groq_client = GroqClient()
        logger.info("AI Predictor initialized with Groq Client")

    async def predict_nsqf_level(self, profile_data: Dict[str, Any]) -> Tuple[int, str]:
        """
        Predict NSQF level using Groq API
        """
        # Convert profile dict to text description for AI
        profile_text = (
            f"Education: {profile_data.get('education', 'Unknown')}. "
            f"Experience: {profile_data.get('experience', 0)} years. "
            f"Skills: {', '.join(profile_data.get('skills', []))}. "
            f"Target Career: {profile_data.get('target_career', 'Unknown')}."
        )
        
        result = await self.groq_client.generate_nsqf_assessment(profile_text)
        level = result.get("calculated_level", 1)
        reasoning = result.get("reasoning", "AI assessment")
        return level, reasoning

    async def analyze_skill_gap(self, user_skills: List[str], target_career: str) -> Dict:
        """
        Analyze skill gap using Groq API
        """
        path = await self.groq_client.generate_learning_path(user_skills, target_career)
        
        # Fallback if AI fails
        if not path or "milestones" not in path:
             return {
                "target_career": target_career,
                "required_skills": [],
                "missing_skills": [],
                "match_percentage": 0,
                "recommendations": ["AI currently unavailable."],
                "learning_path": [],
                "career_outlook": ""
            }
            
        return {
            "target_career": target_career,
            "required_skills": ["AI Analyzed"], # Placeholder or extract from path
            "missing_skills": ["Refer to roadmap"],
            "match_percentage": 50, # Placeholder, could be dynamic
            "recommendations": [m["title"] for m in path.get("milestones", [])],
            "learning_path": path.get("milestones", []),
            "career_outlook": path.get("career_outlook", "")
        }

    async def get_domain_suggestions(self, profile_text: str, domain: str) -> List[Dict]:
        """
        Get course suggestions for a specific domain
        """
        return await self.groq_client.generate_course_suggestions(profile_text, domain)


    async def generate_nsqf_roadmap(self, current_level: int, target_domain: str) -> List[Dict]:
        """Generate a level-by-level NSQF roadmap from current_level to 10."""
        return await self.groq_client.generate_nsqf_roadmap(current_level, target_domain)
    # Legacy/Fallback method for recommendations (hybrid approach)
    def recommend_courses(self, user_skills: List[str], all_courses: List[Dict], top_n: int = 5) -> List[Dict]:
        """
        Recommend courses based on skill overlap (kept as lightweight fallback)
        """
        if not all_courses:
            return []
            
        recommendations = []
        for course in all_courses:
            course_skills = course.get("skills_gained", [])
            # Simple intersection count
            overlap = len(set(user_skills) & set(course_skills))
            score = overlap
            
            recommendations.append({
                **course,
                "relevance_score": score,
                "recommendation_reason": "Matches your skill interest"
            })
            
        recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
        return recommendations[:top_n]
