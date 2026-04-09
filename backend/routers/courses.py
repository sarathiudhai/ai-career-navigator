from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timezone
from models import Course, CourseCreate, Module, APIResponse, Assessment, AssessmentSubmission
from auth import get_current_user, get_current_trainer, get_current_learner
from database import get_database
from typing import Dict, Any, List, Optional
from bson import ObjectId
import logging

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/", response_model=APIResponse)
async def get_all_courses(
    nsqf_level: Optional[int] = Query(None, description="Filter by NSQF level"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    skip: int = Query(0, ge=0, description="Number of courses to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of courses to return")
):
    """Get all available courses with optional filtering"""
    try:
        db = await get_database()
        
        filter_query = {}
        if nsqf_level:
            filter_query["nsqf_level"] = nsqf_level
        if sector:
            filter_query["sector"] = sector
        
        courses_cursor = db.courses.find(filter_query).skip(skip).limit(limit)
        courses = await courses_cursor.to_list(length=limit)
        
        total_count = await db.courses.count_documents(filter_query)
        
        return APIResponse(
            success=True,
            message="Courses retrieved successfully",
            data={
                "courses": fix_object_id(courses),
                "total_count": total_count,
                "skip": skip,
                "limit": limit
            }
        )
        
    except Exception as e:
        logging.error(f"Get courses error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve courses"
        )

from utils import fix_object_id


@router.post("/seed", response_model=APIResponse)
async def seed_courses():
    """Seed database with sample courses"""
    try:
        db = await get_database()
        
        count = await db.courses.count_documents({})
        if count > 0:
            return APIResponse(
                success=True,
                message="Courses already seeded",
                data={"count": count}
            )
            
        sample_courses = [
            {
                "course_id": "c101",
                "title": "Introduction to AI",
                "description": "Learn the basics of Artificial Intelligence and Machine Learning.",
                "nsqf_level": 4,
                "trainer_id": "t1",
                "modules": [],
                "prerequisites": [],
                "skills_gained": [],
                "enrolled_learners": [],
                "completion_rate": 0.0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "course_id": "c102",
                "title": "Data Science Fundamentals",
                "description": "Master the art of data analysis and visualization.",
                "nsqf_level": 5,
                "trainer_id": "t1",
                "modules": [],
                "prerequisites": [],
                "skills_gained": [],
                "enrolled_learners": [],
                "completion_rate": 0.0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "course_id": "c103",
                "title": "Advanced Neural Networks",
                "description": "Deep dive into deep learning and neural architectures.",
                "nsqf_level": 6,
                "trainer_id": "t1",
                "modules": [],
                "prerequisites": ["c101"],
                "skills_gained": [],
                "enrolled_learners": [],
                "completion_rate": 0.0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]
        
        result = await db.courses.insert_many(sample_courses)
        
        return APIResponse(
            success=True,
            message=f"Seeded {len(result.inserted_ids)} courses",
            data={"ids": [str(id) for id in result.inserted_ids]}
        )
        
    except Exception as e:
        logging.error(f"Seed error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to seed courses"
        )

@router.get("/{course_id}", response_model=APIResponse)
async def get_course_details(course_id: str):
    """Get detailed information about a specific course"""
    try:
        db = await get_database()
        
        course = await db.courses.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get trainer information from users collection
        trainer = await db.users.find_one({"user_id": course["trainer_id"]})
        trainer_info = {
            "trainer_id": course["trainer_id"],
            "email": trainer["email"] if trainer else "Unknown",
            "name": trainer.get("profile", {}).get("name", "Trainer") if trainer else "Unknown Trainer"
        }
        
        # Get enrollment statistics
        enrolled_learners = course.get("enrolled_learners", [])
        enrollment_stats = {
            "total_enrolled": len(enrolled_learners),
            "completion_rate": course.get("completion_rate", 0.0)
        }
        
        course_details = {
            **fix_object_id(course),
            "trainer_info": trainer_info,
            "enrollment_stats": enrollment_stats
        }
        
        return APIResponse(
            success=True,
            message="Course details retrieved successfully",
            data=course_details
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get course details error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve course details"
        )

@router.put("/{course_id}", response_model=APIResponse)
async def update_course(
    course_id: str,
    course_update: CourseCreate,
    current_user = Depends(get_current_trainer)
):
    """Update course information"""
    try:
        db = await get_database()
        
        existing_course = await db.courses.find_one({"course_id": course_id})
        if not existing_course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if existing_course["trainer_id"] != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only update your own courses"
            )
        
        update_data = course_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        await db.courses.update_one(
            {"course_id": course_id},
            {"$set": update_data}
        )
        
        logging.info(f"Course updated: {course_id} by {current_user.user_id}")
        
        return APIResponse(
            success=True,
            message="Course updated successfully",
            data={"course_id": course_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Update course error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update course"
        )

@router.delete("/{course_id}", response_model=APIResponse)
async def delete_course(
    course_id: str,
    current_user = Depends(get_current_trainer)
):
    """Delete a course"""
    try:
        db = await get_database()
        
        existing_course = await db.courses.find_one({"course_id": course_id})
        if not existing_course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if existing_course["trainer_id"] != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only delete your own courses"
            )
        
        enrolled_learners = existing_course.get("enrolled_learners", [])
        if enrolled_learners:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete course with enrolled learners"
            )
        
        await db.courses.delete_one({"course_id": course_id})
        
        # Remove from trainer's courses_created in users collection
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$pull": {"courses_created": course_id}}
        )
        
        logging.info(f"Course deleted: {course_id} by {current_user.user_id}")
        
        return APIResponse(
            success=True,
            message="Course deleted successfully",
            data={"course_id": course_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Delete course error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete course"
        )

@router.get("/{course_id}/modules", response_model=APIResponse)
async def get_course_modules(course_id: str):
    """Get all modules for a specific course"""
    try:
        db = await get_database()
        
        course = await db.courses.find_one({"course_id": course_id})
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        modules = course.get("modules", [])
        
        return APIResponse(
            success=True,
            message="Course modules retrieved successfully",
            data={"modules": modules, "course_id": course_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get course modules error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve course modules"
        )

@router.post("/{course_id}/modules", response_model=APIResponse)
async def add_course_module(
    course_id: str,
    module: Module,
    current_user = Depends(get_current_trainer)
):
    """Add a new module to a course"""
    try:
        db = await get_database()
        
        existing_course = await db.courses.find_one({"course_id": course_id})
        if not existing_course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if existing_course["trainer_id"] != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only modify your own courses"
            )
        
        await db.courses.update_one(
            {"course_id": course_id},
            {"$push": {"modules": module.dict()}}
        )
        
        logging.info(f"Module added to course {course_id} by {current_user.user_id}")
        
        return APIResponse(
            success=True,
            message="Module added successfully",
            data={"course_id": course_id, "module_id": module.module_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Add module error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add module"
        )

