from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from pydantic import BaseModel, Field, validator
from models import Course, CourseCreate, Module, APIResponse
from auth import get_current_trainer, AuthManager
from database import get_database
from typing import Dict, Any, List, Optional
import logging
import uuid

# ── Settings Pydantic Models
class ProfileSettingsInput(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    expertise_tags: Optional[List[str]] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None

class NotificationSettingsInput(BaseModel):
    email_new_enrollment: Optional[bool] = True
    email_assignment_submitted: Optional[bool] = True
    email_assessment_completed: Optional[bool] = True
    inapp_course_activity: Optional[bool] = True
    inapp_at_risk_alerts: Optional[bool] = True
    digest_frequency: Optional[str] = "weekly"

class TeachingSettingsInput(BaseModel):
    default_nsqf_level: Optional[int] = 4
    default_difficulty: Optional[str] = "Beginner"
    default_course_status: Optional[str] = "draft"
    default_passing_score: Optional[int] = 60
    default_retake_limit: Optional[int] = 2
    default_time_limit: Optional[int] = 60
    auto_certificate: Optional[bool] = True
    grading_style: Optional[str] = "auto"

class AISettingsInput(BaseModel):
    ai_tone: Optional[str] = "friendly"
    ai_insights_frequency: Optional[str] = "weekly"
    ai_question_generation: Optional[bool] = True

class PrivacySettingsInput(BaseModel):
    two_factor_enabled: Optional[bool] = False

class DashboardSettingsInput(BaseModel):
    default_analytics_period: Optional[str] = "30days"
    pinned_metrics: Optional[List[str]] = []
    theme: Optional[str] = "light"

class ChangePasswordInput(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


router = APIRouter(prefix="/trainers", tags=["trainers"])

# ── Strict input models for course creation ────────────────────────────────
class ModuleInput(BaseModel):
    title: str = Field(..., min_length=2)
    description: str = Field("", description="Module description")
    duration_hours: int = Field(1, ge=1)
    video_url: Optional[str] = None
    pdf_resources: List[str] = []
    content: List[str] = []

class CourseCreateInput(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    nsqf_level: int = Field(..., ge=1, le=10)
    duration_weeks: int = Field(..., ge=1)
    prerequisites: List[str] = []
    skills_gained: List[str] = []
    domain_tags: List[str] = []
    difficulty_level: str = "Beginner"
    status: str = "draft"
    modules: List[ModuleInput] = []

    @validator("title")
    def title_not_blank(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @validator("description")
    def desc_not_blank(cls, v):
        if not v.strip():
            raise ValueError("Description cannot be empty")
        return v.strip()

@router.post("/courses")
async def create_course(
    course_data: CourseCreateInput,
    current_user = Depends(get_current_trainer)
):
    """Create a new course with full Pydantic validation"""
    try:
        db = await get_database()
        course_id = f"course_{uuid.uuid4().hex[:8]}"
        trainer_id = current_user.user_id

        modules_list = []
        for m in course_data.modules:
            modules_list.append({
                "module_id": f"mod_{uuid.uuid4().hex[:6]}",
                "title": m.title,
                "description": m.description,
                "duration_hours": m.duration_hours,
                "video_url": m.video_url,
                "pdf_resources": m.pdf_resources,
                "content": m.content,
                "completed_by": [],
                "assignments": []
            })

        course_doc = {
            "course_id": course_id,
            "title": course_data.title,
            "description": course_data.description,
            "nsqf_level": course_data.nsqf_level,
            "trainer_id": trainer_id,
            "modules": modules_list,
            "prerequisites": course_data.prerequisites,
            "skills_gained": course_data.skills_gained,
            "duration_weeks": course_data.duration_weeks,
            "enrolled_learners": [],
            "completion_rate": 0.0,
            "status": course_data.status,
            "domain_tags": course_data.domain_tags,
            "difficulty_level": course_data.difficulty_level,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        await db.courses.insert_one(course_doc)
        await db.users.update_one(
            {"user_id": trainer_id},
            {"$push": {"courses_created": course_id}}
        )
        logging.info(f"Course created: {course_id} by trainer {trainer_id}")
        return {
            "success": True,
            "message": "Course created successfully",
            "data": {"course_id": course_id, "title": course_doc["title"]}
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Course creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create course")

@router.delete("/courses/{course_id}", response_model=APIResponse)
async def delete_course(
    course_id: str,
    current_user = Depends(get_current_trainer)
):
    """Delete a course (Trainer only, must be owner)"""
    try:
        db = await get_database()
        
        # Check if course exists
        course = await db.courses.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
            
        # Strict Ownership Check
        if course["trainer_id"] != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to delete this course"
            )
            
        # Delete course
        await db.courses.delete_one({"course_id": course_id})
        
        # Remove from trainer's list
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$pull": {"courses_created": course_id}}
        )
        
        # Optional: Remove from learners' enrolled list? 
        # Typically yes, or mark as archived. For now, we'll keep it simple.
        
        logging.info(f"Course {course_id} deleted by trainer {current_user.user_id}")
        
        return APIResponse(
            success=True,
            message="Course deleted successfully",
            data={"course_id": course_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Course deletion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete course"
        )

@router.put("/courses/{course_id}", response_model=APIResponse)
async def update_course(
    course_id: str,
    course_data: dict,
    current_user = Depends(get_current_trainer)
):
    """Update a course (Trainer only, must be owner)"""
    try:
        db = await get_database()
        course = await db.courses.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if course["trainer_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        update_fields = {
            "title": course_data.get("title", course.get("title")),
            "description": course_data.get("description", course.get("description")),
            "nsqf_level": course_data.get("nsqf_level", course.get("nsqf_level")),
            "modules": course_data.get("modules", course.get("modules")),
            "prerequisites": course_data.get("prerequisites", course.get("prerequisites", [])),
            "skills_gained": course_data.get("skills_gained", course.get("skills_gained", [])),
            "status": course_data.get("status", course.get("status", "draft")),
            "domain_tags": course_data.get("domain_tags", course.get("domain_tags", [])),
            "difficulty_level": course_data.get("difficulty_level", course.get("difficulty_level", "Beginner")),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.courses.update_one({"course_id": course_id}, {"$set": update_fields})
        
        return APIResponse(success=True, message="Course updated successfully", data={"course_id": course_id})
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Course update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update course")

@router.get("/courses/{course_id}/analytics", response_model=APIResponse)
async def get_course_analytics(
    course_id: str,
    current_user = Depends(get_current_trainer)
):
    """Get dynamic analytics for a specific course"""
    try:
        db = await get_database()
        course = await db.courses.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if course["trainer_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        learners = await db.users.find({
            "role": "learner",
            "courses_enrolled": course_id
        }).to_list(length=None)
        
        total_enrolled = len(learners)
        completed_count = sum(1 for l in learners if l.get("course_progress", {}).get(course_id, 0) == 100)
        completion_rate = (completed_count / total_enrolled * 100) if total_enrolled > 0 else 0
        
        active_learners = total_enrolled # Simplification
        
        # Average assessment score
        submissions = await db.assessmentsubmissions.find({"course_id": course_id}).to_list(length=None)
        avg_score = (sum(s.get("score", 0) for s in submissions) / len(submissions)) if submissions else 0
        
        certs = await db.certifications.count_documents({"course_id": course_id})
        
        return APIResponse(success=True, message="Course analytics fetched", data={
            "total_enrolled": total_enrolled,
            "completion_rate": round(completion_rate, 1),
            "average_assessment_score": round(avg_score, 1),
            "active_learners": active_learners,
            "certificates_issued": certs
        })
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Course analytics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch course analytics")

@router.get("/courses/{course_id}/students", response_model=APIResponse)
async def get_course_students(
    course_id: str,
    current_user = Depends(get_current_trainer)
):
    """Get detailed student progress for a specific course"""
    try:
        db = await get_database()
        course = await db.courses.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if course["trainer_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        learners = await db.users.find({
            "role": "learner",
            "courses_enrolled": course_id
        }).to_list(length=None)
        
        student_data = []
        for l in learners:
            progress = l.get("course_progress", {}).get(course_id, 0)
            prof = l.get("profile", {})
            student_data.append({
                "user_id": l["user_id"],
                "name": prof.get("name", "Unknown"),
                "age": prof.get("age", "N/A"),
                "domain": prof.get("target_career", "N/A"),
                "nsqf_level": l.get("nsqf_level", 0),
                "progress": progress
            })
            
        return APIResponse(success=True, message="Course students fetched", data={"students": student_data})
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Course students error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch course students")

@router.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"message": "Trainer router is working"}

@router.get("/courses")
async def get_trainer_courses(current_user = Depends(get_current_trainer)):
    """Get trainer's courses"""
    try:
        db = await get_database()
        
        trainer_id = current_user.user_id
        
        courses_cursor = db.courses.find({"trainer_id": trainer_id})
        courses = []
        async for course in courses_cursor:
            course["_id"] = str(course["_id"])
            courses.append(course)
        
        return {
            "success": True,
            "message": "Courses retrieved successfully",
            "data": {"courses": courses, "count": len(courses)}
        }
        
    except Exception as e:
        logging.error(f"Courses error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve courses"
        )

@router.get("/learners", response_model=APIResponse)
async def get_assigned_learners(current_user = Depends(get_current_trainer)):
    """Get learners assigned to the trainer"""
    try:
        db = await get_database()
        
        # Get trainer from users collection
        trainer = await db.users.find_one({"user_id": current_user.user_id, "role": "trainer"})
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trainer profile not found"
            )
            
        assigned_ids = trainer.get("assigned_learners", [])
        
        # Get assigned learners from users collection
        learners = []
        if assigned_ids:
            learners_cursor = db.users.find({"user_id": {"$in": assigned_ids}, "role": "learner"})
            async for learner in learners_cursor:
                learner["_id"] = str(learner["_id"])
                learners.append(learner)
        
        return APIResponse(
            success=True,
            message="Learners retrieved successfully",
            data={"learners": learners}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Learners error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve learners"
        )

@router.post("/assign-learner/{learner_id}", response_model=APIResponse)
async def assign_learner(
    learner_id: str,
    current_user = Depends(get_current_trainer)
):
    """Assign a learner to the trainer"""
    try:
        db = await get_database()
        
        # Check if learner exists in users collection
        learner = await db.users.find_one({"user_id": learner_id, "role": "learner"})
        if not learner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learner not found"
            )
        
        # Check if already assigned
        trainer = await db.users.find_one({"user_id": current_user.user_id})
        if learner_id in trainer.get("assigned_learners", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Learner already assigned"
            )
        
        # Assign learner (update trainer in users collection)
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$push": {"assigned_learners": learner_id}}
        )
        
        logging.info(f"Learner {learner_id} assigned to trainer {current_user.user_id}")
        
        return APIResponse(
            success=True,
            message="Learner assigned successfully",
            data={"learner_id": learner_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Assign learner error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign learner"
        )

@router.post("/update-learner-progress/{learner_id}/{course_id}", response_model=APIResponse)
async def update_learner_progress(
    learner_id: str,
    course_id: str,
    progress: int,
    current_user = Depends(get_current_trainer)
):
    """Update learner progress (trainer override)"""
    try:
        if not 0 <= progress <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Progress must be between 0 and 100"
            )
        
        db = await get_database()
        
        # Check if learner is assigned to this trainer
        trainer = await db.users.find_one({"user_id": current_user.user_id})
        if learner_id not in trainer.get("assigned_learners", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Learner not assigned to this trainer"
            )
        
        # Update learner progress in users collection
        await db.users.update_one(
            {"user_id": learner_id},
            {"$set": {f"course_progress.{course_id}": progress}}
        )
        
        # If completed, issue certification
        if progress == 100:
            course = await db.courses.find_one({"course_id": course_id})
            
            existing_cert = await db.certifications.find_one({
                "learner_id": learner_id,
                "course_id": course_id
            })
            
            if not existing_cert:
                cert_id = f"cert_{learner_id}_{course_id}"
                cert_data = {
                    "certification_id": cert_id,
                    "learner_id": learner_id,
                    "course_id": course_id,
                    "nsqf_level": course["nsqf_level"],
                    "issued_date": datetime.now(timezone.utc),
                    "status": "issued"
                }
                await db.certifications.insert_one(cert_data)
                
                await db.users.update_one(
                    {"user_id": learner_id},
                    {"$push": {"certifications": cert_id}}
                )
        
        logging.info(f"Trainer {current_user.user_id} updated progress for learner {learner_id} in course {course_id}")
        
        return APIResponse(
            success=True,
            message="Learner progress updated successfully",
            data={"learner_id": learner_id, "course_id": course_id, "progress": progress}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Update learner progress error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update learner progress"
        )

@router.get("/analytics", response_model=APIResponse)
async def get_advanced_trainer_analytics(
    time_range: str = "all",
    course_id: Optional[str] = None,
    current_user = Depends(get_current_trainer)
):
    """Get advanced, specialized trainer analytics using MongoDB aggregations"""
    try:
        db = await get_database()
        trainer_id = current_user.user_id
        
        # 1. Base Query: Get trainer's courses
        course_query = {"trainer_id": trainer_id}
        if course_id:
            course_query["course_id"] = course_id
            
        courses = await db.courses.find(course_query).to_list(length=None)
        course_ids = [c["course_id"] for c in courses]
        
        if not course_ids:
            return APIResponse(success=True, message="No courses found", data={"empty": True})

        # 2. Get Learners enrolled in these courses
        learners = await db.users.find({
            "role": "learner",
            "courses_enrolled": {"$in": course_ids}
        }).to_list(length=None)
        
        total_learners = len(learners)
        
        # 3. Calculate Student Performance & Engagement
        total_nsqf = 0
        progress_data = [] # For distribution chart
        active_learners = 0
        from datetime import timedelta
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        student_leaderboard = []
        
        for learner in learners:
            total_nsqf += learner.get("nsqf_level", 0)
            
            # Engagement
            last_active = learner.get("last_login")
            if last_active and isinstance(last_active, datetime) and last_active > thirty_days_ago:
                active_learners += 1
            elif last_active and isinstance(last_active, str):
                try: # Handle potential string dates from older schema
                    active_dt = datetime.fromisoformat(last_active.replace("Z", "+00:00"))
                    if active_dt > thirty_days_ago.replace(tzinfo=timezone.utc):
                        active_learners += 1
                except Exception:
                    pass
            
            # Progress & Leaderboard
            avg_student_prog = 0
            prog_count = 0
            for cid in course_ids:
                if cid in learner.get("courses_enrolled", []):
                    p = learner.get("course_progress", {}).get(cid, 0)
                    avg_student_prog += p
                    prog_count += 1
            
            if prog_count > 0:
                avg_student_prog = avg_student_prog / prog_count
                progress_data.append(avg_student_prog)
                student_leaderboard.append({
                    "name": learner.get("name", "Unknown"),
                    "domain": learner.get("profile", {}).get("target_career", "N/A"),
                    "progress": round(avg_student_prog, 1),
                    "nsqf": learner.get("nsqf_level", 0),
                    "last_active": learner.get("last_login")
                })

        avg_nsqf = round(total_nsqf / total_learners, 1) if total_learners > 0 else 0
        student_leaderboard.sort(key=lambda x: x["progress"], reverse=True)
        top_students = student_leaderboard[:5]
        
        # Determine at-risk students (progress < 20% OR no recent login)
        at_risk = []
        for s in student_leaderboard:
            is_risk = False
            if s["progress"] < 20:
                is_risk = True
            elif s.get("last_active"):
                try:
                    dt = s["last_active"] if isinstance(s["last_active"], datetime) else datetime.fromisoformat(s["last_active"].replace("Z", "+00:00"))
                    if dt < thirty_days_ago.replace(tzinfo=timezone.utc) if isinstance(dt, datetime) else dt < thirty_days_ago:
                        is_risk = True
                except Exception:
                    is_risk = True
            
            if is_risk:
                at_risk.append(s)
                
        # 4. Course Performance
        course_performance = []
        for course in courses:
            cid = course["course_id"]
            enrolled = sum(1 for l in learners if cid in l.get("courses_enrolled", []))
            completed = sum(1 for l in learners if cid in l.get("courses_enrolled", []) and l.get("course_progress", {}).get(cid, 0) >= 100)
            
            comp_rate = (completed / enrolled * 100) if enrolled > 0 else 0
            course_performance.append({
                "name": course["title"],
                "enrolled": enrolled,
                "completion_rate": round(comp_rate, 1)
            })

        # 5. Domain / Skill Insights
        domain_counts = {}
        for c in courses:
            for tag in c.get("domain_tags", []):
                domain_counts[tag] = domain_counts.get(tag, 0) + 1
        top_domains = [{"name": k, "count": v} for k, v in sorted(domain_counts.items(), key=lambda item: item[1], reverse=True)[:5]]

        # 6. Assessments (Quick aggregate)
        assessments = await db.assessments.find({"course_id": {"$in": course_ids}}).to_list(length=None)
        assessment_ids = [a["assessment_id"] for a in assessments]
        
        avg_score = 0
        if assessment_ids:
            submissions = await db.assessmentsubmissions.find({"assessment_id": {"$in": assessment_ids}}).to_list(length=None)
            passed = sum(1 for s in submissions if s.get("passed", False))
            if submissions:
                avg_score = sum(s.get("score", 0) for s in submissions) / len(submissions)
        
        # Assemble Final Payload
        analytics_payload = {
            "overview": {
                "total_courses": len(courses),
                "total_learners": total_learners,
                "active_learners": active_learners,
                "avg_nsqf": avg_nsqf,
                "avg_assessment_score": round(avg_score, 1)
            },
            "course_performance": course_performance, # For BarChart
            "student_leaderboard": top_students,
            "at_risk_students": at_risk[:5],
            "top_domains": top_domains, # For PieChart
            "progress_distribution": progress_data # Can be bucketed on frontend for Histograms
        }
        
        analytics_payload = fix_object_id(analytics_payload)
        
        return APIResponse(
            success=True,
            message="Advanced analytics retrieved successfully",
            data=analytics_payload
        )
        
    except Exception as e:
        logging.error(f"Advanced analytics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve advanced analytics")

@router.get("/students", response_model=APIResponse)
async def get_trainer_students(current_user = Depends(get_current_trainer)):
    """Get all learners assigned to the trainer or enrolled in their courses"""
    try:
        db = await get_database()
        
        # 1. Get trainer details
        trainer = await db.users.find_one({"user_id": current_user.user_id, "role": "trainer"})
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trainer profile not found"
            )
            
        assigned_learners = trainer.get("assigned_learners", [])
        
        # 2. Get all courses created by this trainer from the courses collection
        courses_cursor = db.courses.find({"trainer_id": current_user.user_id})
        trainer_courses = []
        async for course in courses_cursor:
            trainer_courses.append(course.get("course_id"))
        
        # 3. Find learners who are either assigned or enrolled in trainer's courses
        query = {
            "role": "learner",
            "$or": [
                {"user_id": {"$in": assigned_learners}},
                {"courses_enrolled": {"$in": trainer_courses}}
            ]
        }
        
        # If both lists are empty, the $in operators might cause issues or match nothing (which is correct).
        # Let's add a safe check if both are empty.
        if not assigned_learners and not trainer_courses:
             return APIResponse(
                success=True,
                message="No students found",
                data={"students": []}
            )

        learners_cursor = db.users.find(query)
        students = []
        
        async for learner in learners_cursor:
            # Calculate metrics for this specific trainer's courses
            enrolled_in_trainer_courses = [cid for cid in learner.get("courses_enrolled", []) if cid in trainer_courses]
            course_count = len(enrolled_in_trainer_courses)
            
            # Average progress only for courses created by this trainer
            progress_dict = learner.get("course_progress", {})
            relevant_progress = [progress_dict.get(cid, 0) for cid in enrolled_in_trainer_courses]
            overall_progress = sum(relevant_progress) / course_count if course_count > 0 else 0
            
            profile = learner.get("profile", {})
            
            students.append({
                "user_id": learner["user_id"],
                "name": profile.get("name", "Unknown Learner"),
                "age": profile.get("age", 0),
                "domain": profile.get("target_career", "Undecided"),
                "nsqf_level": learner.get("nsqf_level", 0),
                "course_count": course_count,
                "overall_progress": round(overall_progress, 1)
            })
            
        return APIResponse(
            success=True,
            message="Students retrieved successfully",
            data={"students": students}
        )
        
    except Exception as e:
        logging.error(f"Trainer students error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve students"
        )

# ── Assessment Management ────────────────────────────────────

@router.post("/assessments", response_model=APIResponse)
async def create_assessment(
    assessment_data: dict,
    current_user = Depends(get_current_trainer)
):
    """Create a new assessment for a course"""
    try:
        db = await get_database()
        
        course_id = assessment_data.get("course_id")
        
        # Verify ownership
        course = await db.courses.find_one({"course_id": course_id, "trainer_id": current_user.user_id})
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or access denied"
            )
            
        assessment_id = f"assess_{uuid.uuid4().hex[:8]}"
        
        assessment_doc = {
            "assessment_id": assessment_id,
            "course_id": course_id,
            "title": assessment_data.get("title"),
            "description": assessment_data.get("description"),
            "questions": assessment_data.get("questions", []), # List of question objects
            "passing_score": assessment_data.get("passing_score", 60),
            "retake_limit": assessment_data.get("retake_limit", 1),
            "time_duration_minutes": assessment_data.get("time_duration_minutes", 60),
            "deadline": assessment_data.get("deadline"),
            "randomize_questions": assessment_data.get("randomize_questions", False),
            "shuffle_options": assessment_data.get("shuffle_options", False),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.assessments.insert_one(assessment_doc)
        
        # Link to course
        await db.courses.update_one(
            {"course_id": course_id},
            {"$push": {"assessments": assessment_id}}
        )
        
        return APIResponse(
            success=True,
            message="Assessment created successfully",
            data={"assessment_id": assessment_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Create assessment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
        )

@router.get("/courses/{course_id}/assessments", response_model=APIResponse)
async def get_course_assessments(
    course_id: str,
    current_user = Depends(get_current_trainer)
):
    """Get assessments for a course (Trainer view)"""
    try:
        db = await get_database()
        
        # Verify ownership
        course = await db.courses.find_one({"course_id": course_id, "trainer_id": current_user.user_id})
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or access denied"
            )
            
        assessments_cursor = db.assessments.find({"course_id": course_id})
        assessments = []
        async for a in assessments_cursor:
            a["_id"] = str(a["_id"])
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

@router.get("/assessments/{assessment_id}/analytics", response_model=APIResponse)
async def get_assessment_analytics(
    assessment_id: str,
    current_user = Depends(get_current_trainer)
):
    """Get detailed analytics for a specific assessment"""
    try:
        db = await get_database()
        
        # Verify ownership
        assessment = await db.assessments.find_one({"assessment_id": assessment_id})
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
            
        course = await db.courses.find_one({"course_id": assessment["course_id"], "trainer_id": current_user.user_id})
        if not course:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        submissions = await db.assessmentsubmissions.find({"assessment_id": assessment_id}).to_list(length=None)
        
        total_submissions = len(submissions)
        if total_submissions == 0:
            return APIResponse(success=True, message="No submissions yet", data={
                "total_submissions": 0, "average_score": 0, "pass_rate": 0,
                "highest_score": 0, "lowest_score": 0, "question_accuracy": {}
            })
            
        scores = [s.get("score", 0) for s in submissions]
        passed = sum(1 for s in submissions if s.get("passed", False))
        
        analytics = {
            "total_submissions": total_submissions,
            "average_score": round(sum(scores) / total_submissions, 1),
            "pass_rate": round((passed / total_submissions) * 100, 1),
            "highest_score": max(scores),
            "lowest_score": min(scores),
            "question_accuracy": {}
        }
        
        return APIResponse(success=True, message="Assessment analytics fetched", data=analytics)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Assessment analytics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch assessment analytics")

@router.post("/assessments/submissions/{submission_id}/grade", response_model=APIResponse)
async def grade_manual_assessment_submission(
    submission_id: str,
    grade_data: dict,
    current_user = Depends(get_current_trainer)
):
    """Manually grade descriptive answers for a submission"""
    try:
        db = await get_database()
        submission = await db.assessmentsubmissions.find_one({"submission_id": submission_id})
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        course = await db.courses.find_one({"course_id": submission["course_id"], "trainer_id": current_user.user_id})
        if not course:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        # grade_data format: {"score_adjustment": +10, "passed": True}
        new_score = submission.get("score", 0) + grade_data.get("score_adjustment", 0)
        
        await db.assessmentsubmissions.update_one(
            {"submission_id": submission_id},
            {"$set": {
                "score": new_score, 
                "passed": grade_data.get("passed", submission.get("passed", False)),
                "grading_status": "graded"
            }}
        )
        
        return APIResponse(success=True, message="Submission graded successfully", data={"submission_id": submission_id})
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Manual grading error: {e}")
        raise HTTPException(status_code=500, detail="Failed to grade submission")
    
from utils import fix_object_id




# ═══════════════════════════════════════════════════════════
# TRAINER SETTINGS ENDPOINTS
# ═══════════════════════════════════════════════════════════

DEFAULT_SETTINGS = {
    "profile": {"name": "", "designation": "", "organization": "", "bio": "",
                 "expertise_tags": [], "linkedin": "", "github": "", "portfolio": ""},
    "notifications": {"email_new_enrollment": True, "email_assignment_submitted": True,
                       "email_assessment_completed": True, "inapp_course_activity": True,
                       "inapp_at_risk_alerts": True, "digest_frequency": "weekly"},
    "teaching": {"default_nsqf_level": 4, "default_difficulty": "Beginner",
                  "default_course_status": "draft", "default_passing_score": 60,
                  "default_retake_limit": 2, "default_time_limit": 60,
                  "auto_certificate": True, "grading_style": "auto"},
    "ai": {"ai_tone": "friendly", "ai_insights_frequency": "weekly", "ai_question_generation": True},
    "privacy": {"two_factor_enabled": False},
    "dashboard": {"default_analytics_period": "30days", "pinned_metrics": [], "theme": "light"},
}

@router.get("/settings", response_model=APIResponse)
async def get_trainer_settings(current_user=Depends(get_current_trainer)):
    """Get all trainer settings"""
    try:
        db = await get_database()
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        stored = user.get("settings", {})
        result = {}
        for key, defaults in DEFAULT_SETTINGS.items():
            result[key] = {**defaults, **stored.get(key, {})}
        result["profile"]["name"] = result["profile"].get("name") or user.get("name", "")
        result["profile"]["email"] = user.get("email", "")
        return APIResponse(success=True, message="Settings retrieved", data=result)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get settings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve settings")

@router.put("/settings/profile", response_model=APIResponse)
async def update_profile_settings(data: ProfileSettingsInput, current_user=Depends(get_current_trainer)):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.profile.{k}": v for k, v in update.items()}
        set_ops["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Profile settings saved", data={})
    except Exception as e:
        logging.error(f"Profile settings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save profile settings")

@router.put("/settings/notifications", response_model=APIResponse)
async def update_notification_settings(data: NotificationSettingsInput, current_user=Depends(get_current_trainer)):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.notifications.{k}": v for k, v in update.items()}
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Notification settings saved", data={})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save notification settings")

@router.put("/settings/teaching", response_model=APIResponse)
async def update_teaching_settings(data: TeachingSettingsInput, current_user=Depends(get_current_trainer)):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.teaching.{k}": v for k, v in update.items()}
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Teaching settings saved", data={})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save teaching settings")

@router.put("/settings/ai", response_model=APIResponse)
async def update_ai_settings(data: AISettingsInput, current_user=Depends(get_current_trainer)):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.ai.{k}": v for k, v in update.items()}
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="AI settings saved", data={})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save AI settings")

@router.put("/settings/privacy", response_model=APIResponse)
async def update_privacy_settings(data: PrivacySettingsInput, current_user=Depends(get_current_trainer)):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.privacy.{k}": v for k, v in update.items()}
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Privacy settings saved", data={})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save privacy settings")

@router.put("/settings/dashboard-prefs", response_model=APIResponse)
async def update_dashboard_settings(data: DashboardSettingsInput, current_user=Depends(get_current_trainer)):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.dashboard.{k}": v for k, v in update.items()}
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Dashboard settings saved", data={})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save dashboard settings")

@router.post("/settings/change-password", response_model=APIResponse)
async def change_password(data: ChangePasswordInput, current_user=Depends(get_current_trainer)):
    """Change trainer password with current password verification"""
    try:
        db = await get_database()
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
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
        logging.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

@router.get("/settings/export-data", response_model=APIResponse)
async def export_trainer_data(current_user=Depends(get_current_trainer)):
    """Export all trainer data"""
    try:
        db = await get_database()
        courses_cursor = db.courses.find({"trainer_id": current_user.user_id})
        courses = []
        async for c in courses_cursor:
            c["_id"] = str(c["_id"])
            courses.append(c)
        course_ids = [c["course_id"] for c in courses]
        if course_ids:
            learners = await db.users.find({"role": "learner", "courses_enrolled": {"$in": course_ids}}).to_list(length=None)
        else:
            learners = []
        student_export = [{"name": l.get("profile", {}).get("name", "?"), "email": l.get("email"),
                            "nsqf_level": l.get("nsqf_level", 0)} for l in learners]
        return APIResponse(success=True, message="Data export ready", data={
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "courses": courses,
            "students": student_export,
            "total_courses": len(courses),
            "total_students": len(learners)
        })
    except Exception as e:
        logging.error(f"Export data error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export data")
