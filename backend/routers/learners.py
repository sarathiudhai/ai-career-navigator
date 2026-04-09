from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timezone
from models import User, ProfileDetails, APIResponse, NSQFCalculationRequest, NSQFCalculationResponse
from auth import get_current_user, role_required
from database import get_database
from nsfq_calculator import NSQFCalculator
from ml.groq_client import GroqClient
from typing import Dict, Any
import logging
import traceback
import uuid
from bson import ObjectId

logger = logging.getLogger(__name__)

# Shared Groq client instance for AI recommendations
groq_client = GroqClient()

router = APIRouter(prefix="/learners", tags=["learners"])

# Helper to convert ObjectId to string recursively
def convert_objectid(obj):
    if isinstance(obj, list):
        return [convert_objectid(item) for item in obj]
    if isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.post("/profile", response_model=APIResponse)
async def create_or_update_profile(
    profile_data: ProfileDetails,
    request: Request,
    current_user = Depends(role_required("learner"))
):
    """Create or update learner profile"""
    try:
        db = await get_database()
        
        # Get existing user to check for immutability and preserve data
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
             raise HTTPException(status_code=404, detail="User not found")

        # Immutable Journey Check
        existing_profile = user.get("profile", {})
        existing_target = existing_profile.get("target_career")
        
        # If target_career was already set, preventing changing it
        if existing_target and profile_data.target_career and profile_data.target_career != existing_target:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Career Journey (Target Career) cannot be changed once set."
            )
            
        # If not set previously, allow setting it.
        # If strictly checking "edit option... where field cannot be changed", 
        # we can just ignore the new value and use the old one if it exists.
        # But raising an error is clearer for the frontend to handle.
        
        predictor = request.app.state.ml_predictor
        
        # Calculate NSQF level using ML (Always recalculate on update)
        nsqf_level, reasoning = await predictor.predict_nsqf_level(profile_data.dict())
        
        # Data-driven Skill Gap Analysis
        gap_analysis = await predictor.analyze_skill_gap(
            profile_data.skills, profile_data.target_career
        )
        recommendations = gap_analysis["recommendations"]
        
        # Generate learning path (using AI or fallback)
        # We want AI roadmap now. 
        # Note: NSQFCalculator might be the old static way. 
        # We should use predictor.analyze_skill_gap's learning_path if available or enhance this.
        # For now, let's keep the flow but ensure data is saved.
        
        # Update fields
        update_fields = {
            "profile": profile_data.dict(),
            "nsqf_level": nsqf_level,
            # "learning_path": learning_path, # We will update this to be AI driven later in this task
            "skill_gap_analysis": {
                "reasoning": reasoning,
                "recommendations": recommendations,
                "missing_skills": gap_analysis.get("missing_skills", []),
                "match_percentage": gap_analysis.get("match_percentage", 0),
                "last_calculated": datetime.now(timezone.utc)
            },
            "first_login": False,
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Generate NSQF level-by-level roadmap using AI
        learning_path = await predictor.generate_nsqf_roadmap(
            nsqf_level, profile_data.target_career
        )
        update_fields["learning_path"] = learning_path

        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_fields}
        )
        
        logging.info(f"Learner profile updated: {current_user.user_id}")
        
        return APIResponse(
            success=True,
            message="Profile updated successfully",
            data={
                "nsqf_level": nsqf_level,
                "learning_path": update_fields.get("learning_path"),
                "reasoning": reasoning,
                "recommendations": recommendations
            }
        )
        
    except Exception as e:
        logging.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@router.get("/profile", response_model=APIResponse)
async def get_profile(current_user = Depends(role_required("learner"))):
    """Get learner profile"""
    try:
        db = await get_database()
        
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        user["_id"] = str(user["_id"])
        
        return APIResponse(
            success=True,
            message="Profile retrieved successfully",
            data=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )

@router.post("/calculate-nsqf", response_model=NSQFCalculationResponse)
async def calculate_nsqf_level(
    request: NSQFCalculationRequest,
    req: Request,
    current_user = Depends(role_required("learner"))
):
    """Calculate NSQF level for given profile using ML"""
    try:
        predictor = req.app.state.ml_predictor
        
        nsqf_level, reasoning = await predictor.predict_nsqf_level(
            request.profile_details.dict()
        )
        
        gap_analysis = await predictor.analyze_skill_gap(
             request.profile_details.skills, request.profile_details.target_career
        )
        
        return NSQFCalculationResponse(
            nsqf_level=nsqf_level,
            reasoning=reasoning,
            recommendations=gap_analysis["recommendations"]
        )
        
    except Exception as e:
        logging.error(f"NSQF calculation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate NSQF level"
        )


@router.get("/roadmap", response_model=APIResponse)
async def get_roadmap(
    req: Request,
    current_user=Depends(role_required("learner"))
):
    """Get learner's dynamic NSQF roadmap and domain-matched course recommendations."""
    try:
        db = await get_database()
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        nsqf_level = user.get("nsqf_level", 0)
        profile = user.get("profile", {})
        target_domain = profile.get("target_career", "")
        existing_path = user.get("learning_path", [])

        # If roadmap doesn't exist or is in the old string format, regenerate it
        needs_regeneration = (
            not existing_path
            or not isinstance(existing_path, list)
            or (len(existing_path) > 0 and isinstance(existing_path[0], str))
        )

        if needs_regeneration and nsqf_level > 0 and target_domain:
            predictor = req.app.state.ml_predictor
            roadmap = await predictor.generate_nsqf_roadmap(nsqf_level, target_domain)
            await db.users.update_one(
                {"user_id": current_user.user_id},
                {"$set": {"learning_path": roadmap}}
            )
            existing_path = roadmap

        # Fetch domain-relevant course recommendations from DB
        domain_filter = target_domain.lower() if target_domain else ""
        course_query = {"nsqf_level": {"$gte": max(1, nsqf_level)}}
        # try domain tag match
        if domain_filter:
            domain_words = [w for w in domain_filter.split() if len(w) > 2]
            course_query = {
                "nsqf_level": {"$gte": max(1, nsqf_level)},
                "$or": [
                    {"domain_tags": {"$elemMatch": {"$regex": domain_filter, "$options": "i"}}},
                    *[{"title": {"$regex": w, "$options": "i"}} for w in domain_words],
                ]
            }

        courses_cursor = db.courses.find(course_query).limit(6)
        recommended_courses = []
        async for c in courses_cursor:
            c["_id"] = str(c["_id"])
            recommended_courses.append(c)

        # If no domain-specific courses found, fall back to level-matched
        if not recommended_courses and nsqf_level > 0:
            fallback_cursor = db.courses.find({"nsqf_level": {"$gte": nsqf_level}}).limit(6)
            async for c in fallback_cursor:
                c["_id"] = str(c["_id"])
                recommended_courses.append(c)

        return APIResponse(
            success=True,
            message="Roadmap retrieved successfully",
            data={
                "nsqf_level": nsqf_level,
                "target_career": target_domain,
                "learning_path": existing_path,
                "recommended_courses": recommended_courses
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Roadmap endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch roadmap"
        )

@router.post("/enroll-course/{course_id}", response_model=APIResponse)
async def enroll_course(
    course_id: str,
    current_user = Depends(role_required("learner"))
):
    """Enroll in a course"""
    try:
        db = await get_database()
        
        # Check if course exists
        course = await db.courses.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get user
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if already enrolled
        if course_id in user.get("courses_enrolled", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already enrolled in this course"
            )
        
        # Update user record
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {
                "$push": {"courses_enrolled": course_id},
                "$set": {
                    f"course_progress.{course_id}": 0,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Update course record
        await db.courses.update_one(
            {"course_id": course_id},
            {
                "$push": {"enrolled_learners": current_user.user_id},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        
        return APIResponse(
            success=True,
            message="Successfully enrolled in course",
            data={"course_id": course_id, "enrolled_at": datetime.now(timezone.utc)}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Course enrollment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enroll in course"
        )

@router.post("/update-progress/{course_id}", response_model=APIResponse)
async def update_course_progress(
    course_id: str,
    progress: int,
    current_user = Depends(role_required("learner"))
):
    """Update course progress"""
    try:
        if not 0 <= progress <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Progress must be between 0 and 100"
            )
        
        db = await get_database()
        
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if enrolled
        if course_id not in user.get("courses_enrolled", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enrolled in this course"
            )
        
        # Update progress
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {
                "$set": {
                    f"course_progress.{course_id}": progress,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        # Check for Course Completion & Generate Certification
        if progress == 100:
            existing_cert = await db.certifications.find_one({
                "learner_id": current_user.user_id,
                "course_id": course_id
            })

            if not existing_cert:
                course = await db.courses.find_one({"course_id": course_id})
                nsqf_level = course.get("nsqf_level", 0) if course else 0

                cert_id = str(uuid.uuid4())
                
                cert_doc = {
                    "certification_id": cert_id,
                    "learner_id": current_user.user_id,
                    "course_id": course_id,
                    "nsqf_level": nsqf_level,
                    "issued_date": datetime.now(timezone.utc),
                    "status": "issued"
                }

                await db.certifications.insert_one(cert_doc)

                await db.users.update_one(
                    {"user_id": current_user.user_id},
                    {"$push": {"certifications": cert_id}}
                )
                logging.info(f"Certification generated for user {current_user.user_id} on course {course_id}")

        
        return APIResponse(
            success=True,
            message="Progress updated successfully",
            data={"course_id": course_id, "progress": progress, "completed": progress == 100}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Progress update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update progress"
        )

@router.get("/recommendations", response_model=APIResponse)
async def get_course_recommendations(
    current_user: User = Depends(role_required("learner"))
):
    """Get course recommendations based on learner profile using ML"""
    try:
        db = await get_database()
        
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Build profile summary
        profile = user.get("profile", {})
        profile_text = (
            f"Target Career: {profile.get('target_career') or 'Undecided'}. "
            f"Current Skills: {', '.join(profile.get('skills', []))}. "
            f"Education: {profile.get('education')}. "
            f"NSQF Level: {user.get('nsqf_level', 0)}."
        )
        
        # Call AI
        recommendations = await groq_client.recommend_courses_general(profile_text)
        
        # Fallback
        if not recommendations:
             fallback_cursor = db.courses.find({"nsqf_level": {"$gte": user.get("nsqf_level", 0)}}).limit(3)
             recommendations = await fallback_cursor.to_list(length=3)
        
        # Add match percentage
        for rec in recommendations:
            if "match_percentage" not in rec:
                rec["match_percentage"] = 85 + (len(rec.get("key_topics", [])) * 2) 
                
        return APIResponse(success=True, data={"recommendations": convert_objectid(recommendations)})
        
    except Exception as e:
        logging.error(f"Error getting recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get course recommendations"
        )

@router.get("/dashboard", response_model=APIResponse)
async def get_learner_dashboard(current_user = Depends(role_required("learner"))):
    """Get learner dashboard data"""
    try:
        db = await get_database()
        
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learner profile not found"
            )

        # Convert ObjectId to string
        user["_id"] = str(user["_id"])

        profile = user.get("profile", {})
        
        # Fetch enrolled courses details
        enrolled_ids = user.get("courses_enrolled") or []
        courses = []
        if enrolled_ids:
            try:
                courses_raw = await db.courses.find({"course_id": {"$in": enrolled_ids}}).to_list(length=None)
                for c in courses_raw:
                    c["_id"] = str(c.get("_id"))
                    
                    # Fetch assessments for this course
                    try:
                        course_id_safe = c.get("course_id")
                        if course_id_safe:
                            assessments_cursor = db.assessments.find({"course_id": course_id_safe}, {"assessment_id": 1, "title": 1})
                            c["assessments"] = await assessments_cursor.to_list(length=None)
                            for a in c.get("assessments", []):
                                a["_id"] = str(a.get("_id"))
                        else:
                            c["assessments"] = []
                    except Exception as e:
                        logging.error(f"Error fetching assessments for course {c.get('course_id')}: {e}")
                        c["assessments"] = []
                    
                    courses.append(c)
            except Exception as e:
                logging.error(f"Error fetching courses: {e}")
        
        # Fetch certifications
        # Certifications can be embedded objects (new) or IDs (legacy)
        certifications = []
        raw_certs = user.get("certifications") or []
        
        embedded_certs = []
        cert_ids = []
        
        # Separate embedded objects and IDs
        if raw_certs:
            for item in raw_certs:
                if isinstance(item, dict):
                    embedded_certs.append(item)
                elif isinstance(item, str):
                    cert_ids.append(item)
        
        # Add embedded certs
        certifications.extend(embedded_certs)
        
        # Fetch legacy certs by ID
        if cert_ids:
            try:
                legacy_certs = await db.certifications.find({"certification_id": {"$in": cert_ids}}).to_list(length=None)
                certifications.extend(legacy_certs)
            except Exception as e:
                logging.error(f"Error fetching legacy certifications: {e}")
            
        # Ensure consistency and string conversion
        for cert in certifications:
             if cert.get("_id") and not isinstance(cert.get("_id"), str):
                  cert["_id"] = str(cert.get("_id"))

        # Calculate overall progress
        course_progress = user.get("course_progress") or {}
        total_progress = 0
        if courses:
            total_enrolled = len(courses)
            sum_progress = sum(course_progress.get(c.get("course_id"), 0) for c in courses if c.get("course_id"))
            total_progress = sum_progress / total_enrolled if total_enrolled > 0 else 0

        # Construct dashboard data
        dashboard_data = {
            "profile": user.get("profile") or {},
            "nsqf_level": user.get("nsqf_level", 0),
            "learning_path": user.get("learning_path") or [],
            "courses": courses,
            "course_progress": course_progress,
            "overall_progress": round(total_progress, 1),
            "certifications": certifications,
            "skill_gap_analysis": user.get("skill_gap_analysis") or {}
        }
        
        # Ensure all ObjectIds are converted to strings for JSON serialization
        dashboard_data = convert_objectid(dashboard_data)
        
        return APIResponse(
            success=True,
            message="Dashboard data retrieved successfully",
            data=dashboard_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Dashboard error: {e}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard data: {str(e)}"
        )

# ── Learner Assessment Endpoints ─────────────────────────────

@router.get("/courses/{course_id}/assessments", response_model=APIResponse)
async def get_learner_assessments(
    course_id: str,
    current_user = Depends(role_required("learner"))
):
    """Get available assessments for an enrolled course"""
    try:
        db = await get_database()
        
        # Verify enrollment
        user = await db.users.find_one({"user_id": current_user.user_id})
        if course_id not in user.get("courses_enrolled", []):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course"
            )
            
        assessments_cursor = db.assessments.find({"course_id": course_id})
        assessments = []
        async for a in assessments_cursor:
            # Hide correct answers
            a["_id"] = str(a["_id"])
            for q in a.get("questions", []):
                if "correct_option" in q:
                    del q["correct_option"]
            assessments.append(a)
            
        return APIResponse(
            success=True,
            message="Assessments retrieved successfully",
            data={"assessments": assessments}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get assessments error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get assessments"
        )

@router.post("/assessments/{assessment_id}/submit", response_model=APIResponse)
async def submit_assessment(
    assessment_id: str,
    submission_data: dict,
    current_user = Depends(role_required("learner"))
):
    """Submit assessment and get score"""
    try:
        db = await get_database()
        
        assessment = await db.assessments.find_one({"assessment_id": assessment_id})
        if not assessment:
             raise HTTPException(status_code=404, detail="Assessment not found")
             
        answers = submission_data.get("answers", {}) # {question_id: selected_option_index}
        
        correct_count = 0
        total_questions = len(assessment.get("questions", []))
        
        for q in assessment.get("questions", []):
            qid = q.get("question_id")
            correct = q.get("correct_option")
            if str(qid) in answers:
                if answers[str(qid)] == correct:
                    correct_count += 1
                    
       # Calculate Score
        score_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        passed = score_percentage >= assessment.get("passing_score", 60)
        
        # Create Submission Record
        submission_id = str(uuid.uuid4())
        submission_doc = {
            "submission_id": submission_id,
            "assessment_id": assessment_id,
            "learner_id": current_user.user_id,
            "answers": answers,
            "score": score_percentage,
            "passed": passed,
            "submitted_at": datetime.now(timezone.utc)
        }
        await db.assessment_submissions.insert_one(submission_doc)
        
        # Update Course Progress and Generate Certificate if Passed
        certificate_id = None
        if passed:
            # Check if already certified
            existing_cert = await db.certifications.find_one({
                "learner_id": current_user.user_id,
                "course_id": assessment["course_id"]
            })
            
            if not existing_cert:
                certificate_id = str(uuid.uuid4())
                cert_doc = {
                    "certification_id": certificate_id,
                    "learner_id": current_user.user_id,
                    "course_id": assessment["course_id"],
                    "course_title": assessment.get("title", "Course Certification"), # Fetch course title if possible
                    "issued_at": datetime.now(timezone.utc),
                    "nsqf_level": current_user.nsqf_level, # Or course level
                    "status": "issued"
                }
                # Fetch course to get actual title and level
                course = await db.courses.find_one({"course_id": assessment["course_id"]})
                if course:
                    cert_doc["course_title"] = course.get("title", "Course Certification")
                    cert_doc["nsqf_level"] = course.get("nsqf_level", 0)
                
                await db.certifications.insert_one(cert_doc)
                
                # Update User Profile
                await db.users.update_one(
                    {"user_id": current_user.user_id},
                    {
                        "$push": {"certifications": cert_doc},
                        "$set": {f"course_progress.{assessment['course_id']}": 100} # Auto-complete course
                    }
                )

        return APIResponse(
            success=True,
            message="Assessment submitted successfully",
            data={
                "submission_id": submission_id,
                "score": score_percentage,
                "passed": passed,
                "certificate_id": certificate_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Assessment submission error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit assessment"
        )

# ── Learner Settings Endpoints ───────────────────────────────

from pydantic import BaseModel, Field
from typing import Optional, List
from auth import AuthManager

class LearnerProfileSettingsInput(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None

class LearnerNotificationSettingsInput(BaseModel):
    email_course_updates: Optional[bool] = True
    email_assessment_results: Optional[bool] = True
    email_certificate_issued: Optional[bool] = True
    email_recommendations: Optional[bool] = True
    inapp_progress_reminders: Optional[bool] = True
    inapp_new_courses: Optional[bool] = True
    digest_frequency: Optional[str] = "weekly"

class LearnerPasswordInput(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

LEARNER_DEFAULT_SETTINGS = {
    "profile": {"name": "", "phone": "", "bio": "", "linkedin": "", "github": "", "portfolio": ""},
    "notifications": {
        "email_course_updates": True,
        "email_assessment_results": True,
        "email_certificate_issued": True,
        "email_recommendations": True,
        "inapp_progress_reminders": True,
        "inapp_new_courses": True,
        "digest_frequency": "weekly"
    },
    "preferences": {
        "theme": "light",
        "show_nsqf_badge": True,
        "show_progress_on_dashboard": True,
    }
}

@router.get("/settings", response_model=APIResponse)
async def get_learner_settings(current_user=Depends(role_required("learner"))):
    """Get learner settings"""
    try:
        db = await get_database()
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        stored = user.get("settings", {})
        profile_data = user.get("profile", {})

        result = {}
        for key, defaults in LEARNER_DEFAULT_SETTINGS.items():
            result[key] = {**defaults, **stored.get(key, {})}

        # Merge profile name and email into settings profile
        result["profile"]["name"] = result["profile"]["name"] or profile_data.get("name", "")
        result["profile"]["email"] = user.get("email", "")

        # Add read-only stats
        result["stats"] = {
            "nsqf_level": user.get("nsqf_level", 0),
            "courses_enrolled": len(user.get("courses_enrolled", [])),
            "certifications": len(user.get("certifications", [])),
            "target_career": profile_data.get("target_career", ""),
        }

        return APIResponse(success=True, message="Settings retrieved", data=result)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Learner settings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get settings")

@router.put("/settings/profile", response_model=APIResponse)
async def update_learner_profile_settings(
    data: LearnerProfileSettingsInput,
    current_user=Depends(role_required("learner"))
):
    """Update learner profile settings"""
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.profile.{k}": v for k, v in update.items()}

        # Also update the main profile name if changed
        if "name" in update:
            set_ops["profile.name"] = update["name"]

        set_ops["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Profile settings saved", data={})
    except Exception as e:
        logging.error(f"Learner profile settings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile settings")

@router.put("/settings/notifications", response_model=APIResponse)
async def update_learner_notification_settings(
    data: LearnerNotificationSettingsInput,
    current_user=Depends(role_required("learner"))
):
    """Update learner notification settings"""
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.notifications.{k}": v for k, v in update.items()}
        set_ops["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Notification settings saved", data={})
    except Exception as e:
        logging.error(f"Learner notification settings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification settings")

@router.put("/settings/preferences", response_model=APIResponse)
async def update_learner_preferences(
    data: dict,
    current_user=Depends(role_required("learner"))
):
    """Update learner preferences (theme, display options)"""
    try:
        db = await get_database()
        set_ops = {f"settings.preferences.{k}": v for k, v in data.items()}
        set_ops["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Preferences saved", data={})
    except Exception as e:
        logging.error(f"Learner preferences error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

@router.post("/settings/change-password", response_model=APIResponse)
async def learner_change_password(
    data: LearnerPasswordInput,
    current_user=Depends(role_required("learner"))
):
    """Change learner password"""
    try:
        db = await get_database()
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not AuthManager.verify_password(data.current_password, user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        new_hash = AuthManager.get_password_hash(data.new_password)
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": {"hashed_password": new_hash, "updated_at": datetime.now(timezone.utc)}}
        )
        return APIResponse(success=True, message="Password changed successfully", data={})
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Learner password change error: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

