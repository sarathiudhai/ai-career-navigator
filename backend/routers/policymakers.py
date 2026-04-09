from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
from models import APIResponse
from auth import get_current_user, role_required, AuthManager
from database import get_database
from typing import Dict, Any, List, Optional
import logging

router = APIRouter(prefix="/policymakers", tags=["policymakers"])

# ═══════════════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════════════

@router.get("/analytics")
async def get_system_analytics():
    """Full system-wide analytics for policymakers"""
    try:
        db = await get_database()

        # User statistics
        total_users = await db.users.count_documents({})
        learners_count = await db.users.count_documents({"role": "learner"})
        trainers_count = await db.users.count_documents({"role": "trainer"})
        policymakers_count = await db.users.count_documents({"role": "policymaker"})

        # Course statistics
        total_courses = await db.courses.count_documents({})
        total_enrollments = 0
        completion_rates = []
        domain_counts = {}
        nsqf_dist = {str(i): 0 for i in range(1, 11)}

        courses_cursor = db.courses.find()
        async for course in courses_cursor:
            enrolled_count = len(course.get("enrolled_learners", []))
            total_enrollments += enrolled_count
            completion_rates.append(course.get("completion_rate", 0))
            for tag in course.get("domain_tags", []):
                domain_counts[tag] = domain_counts.get(tag, 0) + 1
            lvl = str(course.get("nsqf_level", 1))
            if lvl in nsqf_dist:
                nsqf_dist[lvl] += 1

        avg_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0

        # Certification statistics
        total_certifications = await db.certifications.count_documents({})

        # Active learners
        active_learners = await db.users.count_documents({
            "role": "learner", "courses_enrolled": {"$ne": []}
        })

        # NSQF level distribution of learners
        learner_nsqf = {str(i): 0 for i in range(1, 11)}
        learners = await db.users.find({"role": "learner"}).to_list(length=None)
        for l in learners:
            lvl = str(l.get("nsqf_level", 0))
            if lvl in learner_nsqf:
                learner_nsqf[lvl] += 1

        # Domain enrollment distribution
        domain_enrollment = sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)

        # Top trainers by student count
        trainers = await db.users.find({"role": "trainer"}).to_list(length=None)
        trainer_rankings = []
        for t in trainers:
            tcourses = await db.courses.find({"trainer_id": t["user_id"]}).to_list(length=None)
            total_enrolled = sum(len(c.get("enrolled_learners", [])) for c in tcourses)
            trainer_rankings.append({
                "name": t.get("settings", {}).get("profile", {}).get("name", "") or t.get("email", "Unknown"),
                "courses": len(tcourses),
                "students": total_enrolled
            })
        trainer_rankings.sort(key=lambda x: x["students"], reverse=True)

        analytics = {
            "user_statistics": {
                "total_users": total_users, "learners": learners_count,
                "trainers": trainers_count, "policymakers": policymakers_count
            },
            "course_statistics": {
                "total_courses": total_courses, "total_enrollments": total_enrollments,
                "average_completion_rate": round(avg_completion_rate, 2)
            },
            "certification_statistics": {"total_certifications": total_certifications},
            "engagement_metrics": {
                "active_learners": active_learners,
                "courses_in_progress": total_courses,
                "certifications_this_month": total_certifications
            },
            "nsqf_distribution_courses": nsqf_dist,
            "nsqf_distribution_learners": learner_nsqf,
            "domain_enrollment": [{"name": k, "count": v} for k, v in domain_enrollment[:10]],
            "trainer_rankings": trainer_rankings[:10],
        }

        return {"success": True, "message": "System analytics retrieved successfully", "data": analytics}

    except Exception as e:
        logging.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics")


# ═══════════════════════════════════════════════════════════
# SKILL GAPS
# ═══════════════════════════════════════════════════════════

@router.get("/skill-gaps")
async def get_skill_gap_analysis():
    """Comprehensive skill gap analysis across the platform"""
    try:
        db = await get_database()
        learners = await db.users.find({"role": "learner"}).to_list(length=None)
        courses = await db.courses.find().to_list(length=None)

        # Collect all skills learners have
        learner_skills_count = {}
        domain_learner_skills = {}  # domain -> {skill: count}
        learner_domain_count = {}

        for l in learners:
            profile = l.get("profile", {})
            skills = profile.get("skills", [])
            domain = profile.get("target_career", "Unknown")
            learner_domain_count[domain] = learner_domain_count.get(domain, 0) + 1
            if domain not in domain_learner_skills:
                domain_learner_skills[domain] = {}
            for s in skills:
                sl = s.strip().lower()
                learner_skills_count[sl] = learner_skills_count.get(sl, 0) + 1
                domain_learner_skills[domain][sl] = domain_learner_skills[domain].get(sl, 0) + 1

        # Collect all skills courses teach
        course_skills_count = {}
        domain_course_skills = {}
        for c in courses:
            tags = c.get("domain_tags", [])
            gained = c.get("skills_gained", [])
            for s in gained:
                sl = s.strip().lower()
                course_skills_count[sl] = course_skills_count.get(sl, 0) + 1
                for t in tags:
                    if t not in domain_course_skills:
                        domain_course_skills[t] = {}
                    domain_course_skills[t][sl] = domain_course_skills[t].get(sl, 0) + 1

        # Top missing skills (in courses but not in learner profiles)
        missing_skills = []
        for skill, count in sorted(course_skills_count.items(), key=lambda x: x[1], reverse=True):
            if skill not in learner_skills_count:
                missing_skills.append({"skill": skill, "courses_teaching": count, "learners_with_skill": 0})
        # Also include skills with low coverage
        for skill, course_count in course_skills_count.items():
            learner_count = learner_skills_count.get(skill, 0)
            if learner_count < course_count and skill not in [m["skill"] for m in missing_skills]:
                missing_skills.append({"skill": skill, "courses_teaching": course_count, "learners_with_skill": learner_count})
        missing_skills.sort(key=lambda x: x["courses_teaching"] - x["learners_with_skill"], reverse=True)

        # NSQF level-wise gap insight
        nsqf_gaps = {}
        for l in learners:
            lvl = l.get("nsqf_level", 0)
            gap = l.get("skill_gap_analysis", {})
            missing = gap.get("missing_skills", [])
            if lvl not in nsqf_gaps:
                nsqf_gaps[lvl] = {}
            for sk in missing:
                sl = sk.strip().lower()
                nsqf_gaps[lvl][sl] = nsqf_gaps[lvl].get(sl, 0) + 1
        nsqf_gap_summary = []
        for lvl in sorted(nsqf_gaps.keys()):
            top = sorted(nsqf_gaps[lvl].items(), key=lambda x: x[1], reverse=True)[:5]
            nsqf_gap_summary.append({"level": lvl, "top_missing": [{"skill": s, "count": c} for s, c in top]})

        # Domain-wise gap analysis
        domain_gaps = []
        all_domains = set(list(domain_learner_skills.keys()) + list(domain_course_skills.keys()))
        for domain in all_domains:
            ls = set(domain_learner_skills.get(domain, {}).keys())
            cs = set(domain_course_skills.get(domain, {}).keys())
            gap_skills = list(cs - ls)[:8]
            coverage = round(len(ls & cs) / len(cs) * 100, 1) if cs else 100
            domain_gaps.append({
                "domain": domain, "learner_count": learner_domain_count.get(domain, 0),
                "skills_covered": len(ls & cs), "skills_total": len(cs),
                "coverage_pct": coverage, "gap_skills": gap_skills
            })
        domain_gaps.sort(key=lambda x: x["coverage_pct"])

        # Recommendation for new courses
        recommendations = []
        for ms in missing_skills[:5]:
            recommendations.append(f"Create courses covering '{ms['skill']}' — {ms['courses_teaching']} courses reference it but only {ms['learners_with_skill']} learners have this skill.")

        return {"success": True, "message": "Skill gap analysis complete", "data": {
            "top_missing_skills": missing_skills[:15],
            "domain_gaps": domain_gaps,
            "nsqf_level_gaps": nsqf_gap_summary,
            "recommendations": recommendations,
            "total_learners_analyzed": len(learners),
            "total_courses_analyzed": len(courses),
        }}
    except Exception as e:
        logging.error(f"Skill gap error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze skill gaps")


# ═══════════════════════════════════════════════════════════
# USER INSIGHTS
# ═══════════════════════════════════════════════════════════

@router.get("/user-insights")
async def get_user_insights():
    """Deep user insights: demographics, funnel, at-risk, leaderboard"""
    try:
        db = await get_database()
        learners = await db.users.find({"role": "learner"}).to_list(length=None)
        courses = await db.courses.find().to_list(length=None)
        course_ids = [c["course_id"] for c in courses]

        # Demographics
        edu_dist = {}
        exp_dist = {}
        career_dist = {}
        age_groups = {"Under 18": 0, "18-24": 0, "25-34": 0, "35-44": 0, "45+": 0}

        # Funnel counters
        registered = len(learners)
        profile_completed = 0
        enrolled = 0
        active = 0      # progress > 0
        completed = 0    # any course 100%
        certified = 0

        # At-risk & leaderboard
        at_risk = []
        leaderboard = []
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

        for l in learners:
            profile = l.get("profile", {})
            # Demographics
            edu = profile.get("education", "Unknown")
            edu_dist[edu] = edu_dist.get(edu, 0) + 1
            exp = profile.get("experience", "Unknown")
            exp_dist[exp] = exp_dist.get(exp, 0) + 1
            career = profile.get("target_career", "Unknown")
            career_dist[career] = career_dist.get(career, 0) + 1
            age = profile.get("age", 0)
            if age and isinstance(age, (int, float)):
                if age < 18: age_groups["Under 18"] += 1
                elif age < 25: age_groups["18-24"] += 1
                elif age < 35: age_groups["25-34"] += 1
                elif age < 45: age_groups["35-44"] += 1
                else: age_groups["45+"] += 1

            # Funnel
            if profile.get("name") or profile.get("education"):
                profile_completed += 1
            enrolled_courses = l.get("courses_enrolled", [])
            if enrolled_courses:
                enrolled += 1
            progress = l.get("course_progress", {})
            max_prog = max(progress.values()) if progress else 0
            avg_prog = sum(progress.values()) / len(progress) if progress else 0
            if max_prog > 0:
                active += 1
            if max_prog >= 100:
                completed += 1
            certs = l.get("certifications", [])
            if certs:
                certified += 1

            name = profile.get("name", l.get("email", "Unknown"))

            # At-risk check: low progress or inactive
            is_risk = False
            if enrolled_courses and avg_prog < 20:
                is_risk = True
            last_login = l.get("last_login")
            if last_login and isinstance(last_login, datetime) and last_login < thirty_days_ago:
                is_risk = True

            if is_risk:
                at_risk.append({
                    "name": name, "domain": career,
                    "nsqf_level": l.get("nsqf_level", 0),
                    "progress": round(avg_prog, 1),
                    "courses_enrolled": len(enrolled_courses)
                })

            # Leaderboard
            leaderboard.append({
                "name": name, "domain": career,
                "nsqf_level": l.get("nsqf_level", 0),
                "progress": round(avg_prog, 1),
                "courses_completed": sum(1 for v in progress.values() if v >= 100),
                "certs": len(certs)
            })

        leaderboard.sort(key=lambda x: (x["courses_completed"], x["progress"]), reverse=True)
        at_risk.sort(key=lambda x: x["progress"])

        # Course drop-off analysis
        drop_off = []
        for c in courses[:10]:
            modules = c.get("modules", [])
            if modules:
                drop_off.append({
                    "course": c.get("title", "?"),
                    "modules": len(modules),
                    "enrolled": len(c.get("enrolled_learners", []))
                })

        # Learning pace
        total_prog_values = []
        for l in learners:
            prog = l.get("course_progress", {})
            total_prog_values.extend(prog.values())
        avg_pace = round(sum(total_prog_values) / len(total_prog_values), 1) if total_prog_values else 0

        return {"success": True, "message": "User insights retrieved", "data": {
            "demographics": {
                "education": [{"name": k, "count": v} for k, v in sorted(edu_dist.items(), key=lambda x: x[1], reverse=True)],
                "experience": [{"name": k, "count": v} for k, v in sorted(exp_dist.items(), key=lambda x: x[1], reverse=True)],
                "career_aspirations": [{"name": k, "count": v} for k, v in sorted(career_dist.items(), key=lambda x: x[1], reverse=True)],
                "age_groups": age_groups,
            },
            "funnel": {
                "registered": registered, "profile_completed": profile_completed,
                "enrolled": enrolled, "active": active,
                "completed": completed, "certified": certified,
            },
            "at_risk_learners": at_risk[:15],
            "leaderboard": leaderboard[:15],
            "average_learning_pace": avg_pace,
            "total_learners": len(learners),
        }}
    except Exception as e:
        logging.error(f"User insights error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user insights")


# ═══════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════

@router.get("/reports/system-summary")
async def get_system_summary_report():
    """Generate full system summary for export"""
    try:
        db = await get_database()
        learners = await db.users.find({"role": "learner"}).to_list(length=None)
        trainers = await db.users.find({"role": "trainer"}).to_list(length=None)
        courses = await db.courses.find().to_list(length=None)
        certs = await db.certifications.find().to_list(length=None)

        # NSQF compliance: courses with nsqf_level set
        nsqf_compliant = sum(1 for c in courses if c.get("nsqf_level", 0) > 0)

        # Certification table
        cert_records = []
        for cert in certs:
            learner = next((l for l in learners if l["user_id"] == cert.get("learner_id")), None)
            course = next((c for c in courses if c["course_id"] == cert.get("course_id")), None)
            cert_records.append({
                "learner": learner.get("profile", {}).get("name", "Unknown") if learner else "Unknown",
                "course": course.get("title", "Unknown") if course else "Unknown",
                "nsqf_level": cert.get("nsqf_level", 0),
                "issued_date": cert.get("issued_date", "").isoformat() if isinstance(cert.get("issued_date"), datetime) else str(cert.get("issued_date", "")),
            })

        # Trainer activity
        trainer_activity = []
        for t in trainers:
            tid = t["user_id"]
            tcourses = [c for c in courses if c.get("trainer_id") == tid]
            trainer_activity.append({
                "name": t.get("settings", {}).get("profile", {}).get("name", "") or t.get("email", "?"),
                "courses_published": len(tcourses),
                "total_students": sum(len(c.get("enrolled_learners", [])) for c in tcourses),
            })

        return {"success": True, "message": "Report generated", "data": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "total_learners": len(learners), "total_trainers": len(trainers),
                "total_courses": len(courses), "total_certifications": len(certs),
                "nsqf_compliant_courses": nsqf_compliant,
                "compliance_pct": round(nsqf_compliant / len(courses) * 100, 1) if courses else 0,
            },
            "certifications": cert_records[:50],
            "trainer_activity": trainer_activity,
        }}
    except Exception as e:
        logging.error(f"Report error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

@router.get("/reports/export-all")
async def export_all_data():
    """Export all platform data as JSON"""
    try:
        db = await get_database()
        learners = await db.users.find({"role": "learner"}).to_list(length=None)
        trainers = await db.users.find({"role": "trainer"}).to_list(length=None)
        courses = await db.courses.find().to_list(length=None)
        certs = await db.certifications.find().to_list(length=None)

        def clean(doc):
            doc.pop("_id", None)
            doc.pop("hashed_password", None)
            return doc

        return {"success": True, "message": "Full export ready", "data": {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "learners": [clean(l) for l in learners],
            "trainers": [clean(t) for t in trainers],
            "courses": [clean(c) for c in courses],
            "certifications": [clean(c) for c in certs],
        }}
    except Exception as e:
        logging.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export data")


# ═══════════════════════════════════════════════════════════
# SETTINGS
# ═══════════════════════════════════════════════════════════

class PolicymakerProfileInput(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    government_body: Optional[str] = None

class PolicymakerNotifInput(BaseModel):
    milestone_alerts: Optional[bool] = True
    new_trainer_alerts: Optional[bool] = True
    weekly_digest: Optional[bool] = True

class PolicymakerPasswordInput(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

PM_DEFAULT_SETTINGS = {
    "profile": {"name": "", "designation": "", "department": "", "government_body": ""},
    "notifications": {"milestone_alerts": True, "new_trainer_alerts": True, "weekly_digest": True},
    "platform": {"min_nsqf_compliance": 1, "auto_approve_certs": True},
}

@router.get("/settings", response_model=APIResponse)
async def get_pm_settings(current_user=Depends(role_required("policymaker"))):
    try:
        db = await get_database()
        user = await db.users.find_one({"user_id": current_user.user_id})
        stored = user.get("settings", {})
        result = {}
        for key, defaults in PM_DEFAULT_SETTINGS.items():
            result[key] = {**defaults, **stored.get(key, {})}
        result["profile"]["email"] = user.get("email", "")
        return APIResponse(success=True, message="Settings retrieved", data=result)
    except Exception as e:
        logging.error(f"PM settings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get settings")

@router.put("/settings/profile", response_model=APIResponse)
async def update_pm_profile(data: PolicymakerProfileInput, current_user=Depends(role_required("policymaker"))):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.profile.{k}": v for k, v in update.items()}
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Profile updated", data={})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.put("/settings/notifications", response_model=APIResponse)
async def update_pm_notifs(data: PolicymakerNotifInput, current_user=Depends(role_required("policymaker"))):
    try:
        db = await get_database()
        update = {k: v for k, v in data.dict().items() if v is not None}
        set_ops = {f"settings.notifications.{k}": v for k, v in update.items()}
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": set_ops})
        return APIResponse(success=True, message="Notifications updated", data={})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update notifications")

@router.post("/settings/change-password", response_model=APIResponse)
async def pm_change_password(data: PolicymakerPasswordInput, current_user=Depends(role_required("policymaker"))):
    try:
        db = await get_database()
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not AuthManager.verify_password(data.current_password, user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        new_hash = AuthManager.get_password_hash(data.new_password)
        await db.users.update_one({"user_id": current_user.user_id}, {"$set": {"hashed_password": new_hash}})
        return APIResponse(success=True, message="Password changed", data={})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to change password")
