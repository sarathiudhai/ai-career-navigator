import asyncio
from datetime import datetime
from database import get_database
from auth import AuthManager

async def create_sample_data():
    """Create sample data using the unified users collection"""
    db = await get_database()
    
    # Clear ALL collections
    await db.users.delete_many({})
    await db.courses.delete_many({})
    await db.certifications.delete_many({})
    
    # Drop legacy collections if they exist
    for legacy in ("learners", "trainers", "policymakers"):
        await db.drop_collection(legacy)
    
    print("Creating sample users (unified collection)...")
    
    hashed_pw = AuthManager.get_password_hash("password123")
    
    users = [
        # ── Learner ──────────────────────────────────────────
        {
            "user_id": "learner_001",
            "email": "learner@example.com",
            "hashed_password": hashed_pw,
            "role": "learner",
            "first_login": False,
            "profile": {
                "name": "John Doe",
                "age": 22,
                "education": "bachelors",
                "skills": ["Python", "JavaScript", "HTML", "CSS"],
                "experience": 2,
                "region": "Urban",
                "target_career": "Software Developer"
            },
            "nsqf_level": 5,
            "courses_enrolled": ["python_basics", "web_dev_fundamentals"],
            "course_progress": {
                "python_basics": 75,
                "web_dev_fundamentals": 45
            },
            "learning_path": [
                "Programming Fundamentals",
                "Data Structures & Algorithms",
                "Web Development Basics",
                "Database Management",
                "Software Engineering Principles"
            ],
            "certifications": ["cert_learner_001_python_basics"],
            "skill_gap_analysis": {
                "reasoning": "Education (bachelors): Level 6 | Experience (2 years): +1 levels | High-demand skills (2): +1 levels | Career target (Software Developer): Level 6",
                "recommendations": [
                    "Focus on bridging 1 NSQF level gap to reach Software Developer",
                    "Gain practical experience through internships or projects",
                    "Learn more high-demand skills (Python, ML, Cloud, etc.)"
                ]
            },
            "assigned_learners": [],
            "courses_created": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # ── Trainer ──────────────────────────────────────────
        {
            "user_id": "trainer_001",
            "email": "trainer@example.com",
            "hashed_password": hashed_pw,
            "role": "trainer",
            "first_login": False,
            "profile": {
                "name": "Jane Smith",
                "age": 35,
                "education": "masters",
                "skills": ["Python", "Machine Learning", "Teaching"],
                "experience": 10,
                "region": "Urban",
                "target_career": ""
            },
            "nsqf_level": 0,
            "courses_enrolled": [],
            "course_progress": {},
            "learning_path": [],
            "certifications": [],
            "skill_gap_analysis": {},
            "assigned_learners": ["learner_001"],
            "courses_created": ["python_basics", "web_dev_fundamentals", "data_science_intro"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # ── Policymaker ──────────────────────────────────────
        {
            "user_id": "policymaker_001",
            "email": "policymaker@example.com",
            "hashed_password": hashed_pw,
            "role": "policymaker",
            "first_login": False,
            "profile": {
                "name": "Admin User",
                "age": 45,
                "education": "doctorate",
                "skills": ["Policy Analysis", "Data Analytics"],
                "experience": 20,
                "region": "National",
                "target_career": ""
            },
            "nsqf_level": 0,
            "courses_enrolled": [],
            "course_progress": {},
            "learning_path": [],
            "certifications": [],
            "skill_gap_analysis": {},
            "assigned_learners": [],
            "courses_created": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(users)
    
    print("Creating sample courses...")
    
    courses = [
        {
            "course_id": "python_basics",
            "title": "Python Programming Fundamentals",
            "description": "Learn the basics of Python programming including variables, data types, control flow, and functions.",
            "nsqf_level": 4,
            "trainer_id": "trainer_001",
            "sector": "Information Technology",
            "modules": [
                {
                    "module_id": "mod_001",
                    "title": "Introduction to Python",
                    "description": "Getting started with Python programming",
                    "duration_hours": 8,
                    "content": ["Python installation", "Basic syntax", "Variables and data types"],
                    "assessments": ["quiz_001", "assignment_001"]
                },
                {
                    "module_id": "mod_002",
                    "title": "Control Flow",
                    "description": "Conditional statements and loops",
                    "duration_hours": 10,
                    "content": ["If statements", "For loops", "While loops", "Try-except"],
                    "assessments": ["quiz_002", "project_001"]
                }
            ],
            "prerequisites": ["Basic computer skills"],
            "skills_gained": ["Python", "Programming logic", "Problem solving"],
            "enrolled_learners": ["learner_001"],
            "completion_rate": 85.2,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "course_id": "web_dev_fundamentals",
            "title": "Web Development Fundamentals",
            "description": "Master HTML, CSS, and JavaScript to build modern web applications.",
            "nsqf_level": 5,
            "trainer_id": "trainer_001",
            "sector": "Information Technology",
            "modules": [
                {
                    "module_id": "mod_003",
                    "title": "HTML & CSS Basics",
                    "description": "Structure and style web pages",
                    "duration_hours": 12,
                    "content": ["HTML elements", "CSS selectors", "Responsive design"],
                    "assessments": ["quiz_003", "project_002"]
                },
                {
                    "module_id": "mod_004",
                    "title": "JavaScript Essentials",
                    "description": "Add interactivity to web pages",
                    "duration_hours": 16,
                    "content": ["DOM manipulation", "Event handling", "Async JavaScript"],
                    "assessments": ["quiz_004", "project_003"]
                }
            ],
            "prerequisites": ["Basic computer skills"],
            "skills_gained": ["HTML", "CSS", "JavaScript", "Web design"],
            "enrolled_learners": ["learner_001"],
            "completion_rate": 78.9,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "course_id": "data_science_intro",
            "title": "Introduction to Data Science",
            "description": "Explore data analysis, visualization, and machine learning fundamentals.",
            "nsqf_level": 7,
            "trainer_id": "trainer_001",
            "sector": "Data Science",
            "modules": [
                {
                    "module_id": "mod_005",
                    "title": "Data Analysis with Python",
                    "description": "Use pandas and numpy for data manipulation",
                    "duration_hours": 20,
                    "content": ["Pandas basics", "Data cleaning", "Statistical analysis"],
                    "assessments": ["quiz_005", "project_004"]
                },
                {
                    "module_id": "mod_006",
                    "title": "Machine Learning Basics",
                    "description": "Introduction to ML algorithms",
                    "duration_hours": 24,
                    "content": ["Supervised learning", "Unsupervised learning", "Model evaluation"],
                    "assessments": ["quiz_006", "project_005"]
                }
            ],
            "prerequisites": ["Python programming", "Statistics basics"],
            "skills_gained": ["Python", "Machine Learning", "Data Analysis", "Statistics"],
            "enrolled_learners": [],
            "completion_rate": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.courses.insert_many(courses)
    
    print("Creating sample certifications...")
    
    certifications = [
        {
            "certification_id": "cert_learner_001_python_basics",
            "learner_id": "learner_001",
            "course_id": "python_basics",
            "nsqf_level": 4,
            "issued_date": datetime.utcnow(),
            "status": "issued"
        }
    ]
    
    await db.certifications.insert_many(certifications)
    
    # Verify final state
    collections = await db.list_collection_names()
    print(f"\nFinal collections: {collections}")
    print(f"Users: {await db.users.count_documents({})}")
    print(f"Courses: {await db.courses.count_documents({})}")
    print(f"Certifications: {await db.certifications.count_documents({})}")
    
    print("\nSample data created successfully!")
    print("\nLogin credentials:")
    print("Learner:     learner@example.com / password123")
    print("Trainer:     trainer@example.com / password123")
    print("Policymaker: policymaker@example.com / password123")

if __name__ == "__main__":
    asyncio.run(create_sample_data())
