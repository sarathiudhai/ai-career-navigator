from typing import Dict, List, Tuple
from models import ProfileDetails

class NSQFCalculator:
    """
    NSQF Level Calculator based on user profile details
    NSQF Levels: 1-10 (1 = Basic, 10 = Expert)
    """
    
    # Education level mapping to NSQF base levels
    EDUCATION_MAPPING = {
        "no_formal_education": 1,
        "primary": 2,
        "secondary": 3,
        "higher_secondary": 4,
        "diploma": 5,
        "bachelors": 6,
        "masters": 7,
        "phd": 8,
        "post_doc": 9
    }
    
    # Experience level multipliers
    EXPERIENCE_MULTIPLIERS = {
        "0-1": 0.0,
        "1-3": 0.5,
        "3-5": 1.0,
        "5-10": 1.5,
        "10+": 2.0
    }
    
    # High-demand skills that boost NSQF level
    HIGH_DEMAND_SKILLS = [
        "python", "java", "javascript", "react", "node.js", "machine learning",
        "data science", "cloud computing", "devops", "cybersecurity",
        "artificial intelligence", "blockchain", "mobile development"
    ]
    
    # Career target level mapping
    CAREER_TARGET_MAPPING = {
        "entry_level": 3,
        "junior_developer": 4,
        "mid_level": 6,
        "senior_developer": 7,
        "tech_lead": 8,
        "architect": 9,
        "manager": 8,
        "director": 9,
        "cto": 10
    }

    @classmethod
    def calculate_nsqf_level(cls, profile_details: ProfileDetails) -> Tuple[int, str, List[str]]:
        """
        Calculate NSQF level based on profile details
        
        Returns:
            Tuple of (nsqf_level, reasoning, recommendations)
        """
        reasoning_parts = []
        recommendations = []
        
        # Base level from education
        education_normalized = profile_details.education.lower().replace(" ", "_")
        base_level = cls.EDUCATION_MAPPING.get(education_normalized, 3)
        reasoning_parts.append(f"Education ({profile_details.education}): Level {base_level}")
        
        # Experience adjustment
        experience_years = profile_details.experience
        if experience_years <= 1:
            experience_multiplier = 0.0
            exp_category = "0-1"
        elif experience_years <= 3:
            experience_multiplier = 0.5
            exp_category = "1-3"
        elif experience_years <= 5:
            experience_multiplier = 1.0
            exp_category = "3-5"
        elif experience_years <= 10:
            experience_multiplier = 1.5
            exp_category = "5-10"
        else:
            experience_multiplier = 2.0
            exp_category = "10+"
        
        experience_boost = int(experience_multiplier)
        reasoning_parts.append(f"Experience ({experience_years} years): +{experience_boost} levels")
        
        # Skills assessment
        high_demand_skills_count = sum(1 for skill in profile_details.skills 
                                      if skill.lower() in cls.HIGH_DEMAND_SKILLS)
        skills_boost = min(high_demand_skills_count // 2, 2)  # Max 2 levels from skills
        reasoning_parts.append(f"High-demand skills ({high_demand_skills_count}): +{skills_boost} levels")
        
        # Career target alignment
        target_normalized = profile_details.target_career.lower().replace(" ", "_")
        target_level = cls.CAREER_TARGET_MAPPING.get(target_normalized, 5)
        reasoning_parts.append(f"Career target ({profile_details.target_career}): Level {target_level}")
        
        # Calculate final NSQF level
        calculated_level = base_level + experience_boost + skills_boost
        
        # Ensure minimum and maximum levels
        calculated_level = max(1, min(10, calculated_level))
        
        # Adjust based on career target (don't exceed target by more than 2 levels)
        if calculated_level > target_level + 2:
            calculated_level = target_level + 2
            reasoning_parts.append("Adjusted to align with career target")
        
        # Age consideration (younger learners get slightly lower initial levels)
        if profile_details.age < 20:
            calculated_level = max(1, calculated_level - 1)
            reasoning_parts.append("Age consideration: -1 level")
        
        reasoning = " | ".join(reasoning_parts)
        
        # Generate recommendations
        if calculated_level < target_level:
            gap = target_level - calculated_level
            recommendations.append(f"Focus on bridging {gap} NSQF level gap to reach {profile_details.target_career}")
            
            if experience_years < 3:
                recommendations.append("Gain practical experience through internships or projects")
            
            if high_demand_skills_count < 3:
                recommendations.append("Learn more high-demand skills (Python, ML, Cloud, etc.)")
        
        if calculated_level >= target_level:
            recommendations.append("Ready for target role! Consider advanced specialization")
        
        # Region-specific recommendations
        if profile_details.region.lower() in ["rural", "tier_2", "tier_3"]:
            recommendations.append("Consider online learning resources for skill development")
        
        return calculated_level, reasoning, recommendations

    @classmethod
    def get_learning_path(cls, nsqf_level: int, target_career: str) -> List[str]:
        """
        Generate learning path based on current NSQF level and career target
        """
        learning_paths = {
            "software_developer": [
                "Programming Fundamentals",
                "Data Structures & Algorithms", 
                "Web Development Basics",
                "Database Management",
                "Software Engineering Principles",
                "Advanced Programming",
                "System Design",
                "Specialization (AI/ML, Cloud, etc.)"
            ],
            "data_scientist": [
                "Mathematics & Statistics",
                "Python Programming",
                "Data Analysis Tools",
                "Machine Learning Basics",
                "Statistical Modeling",
                "Deep Learning",
                "Big Data Technologies",
                "Advanced ML Applications"
            ],
            "mobile_developer": [
                "Programming Basics",
                "Mobile UI/UX Design",
                "Platform Fundamentals (iOS/Android)",
                "Mobile App Development",
                "API Integration",
                "Advanced Mobile Features",
                "Cross-Platform Development",
                "Mobile App Architecture"
            ],
            "ui_ux_designer": [
                "Design Principles",
                "Color Theory & Typography",
                "Design Tools (Figma, Adobe XD)",
                "User Research Methods",
                "Interaction Design",
                "Prototyping & Wireframing",
                "Advanced Design Systems",
                "Design Leadership"
            ]
        }
        
        career_key = target_career.lower().replace(" ", "_")
        base_path = learning_paths.get(career_key, learning_paths["software_developer"])
        
        # Adjust path based on NSQF level
        if nsqf_level <= 3:
            return base_path[:3]  # Beginner path
        elif nsqf_level <= 6:
            return base_path[:5]  # Intermediate path
        else:
            return base_path  # Advanced path
