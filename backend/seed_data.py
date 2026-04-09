import asyncio
from database import connect_to_mongodb, disconnect_from_mongodb, get_database
from auth import AuthManager
from datetime import datetime
import uuid

async def seed_users():
    print("Connecting to database...")
    await connect_to_mongodb()
    db = await get_database()

    users = [
        {
            "email": "learner@example.com",
            "password": "password123",
            "role": "learner",
            "name": "Alex Learner"
        },
        {
            "email": "trainer@example.com",
            "password": "password123",
            "role": "trainer",
            "name": "Sarah Trainer"
        },
        {
            "email": "policymaker@example.com",
            "password": "password123",
            "role": "policymaker",
            "name": "Priya Policy"
        }
    ]

    print("Seeding users...")
    for user_data in users:
        existing = await db.users.find_one({"email": user_data["email"]})
        if existing:
            print(f"User {user_data['email']} already exists. Skipping.")
            continue

        hashed_password = AuthManager.get_password_hash(user_data["password"])
        
        user_doc = {
            "user_id": str(uuid.uuid4()),
            "email": user_data["email"],
            "hashed_password": hashed_password,
            "role": user_data["role"],
            "first_login": True,
            "profile": {
                "name": user_data["name"],
                "age": 25,
                "education": "Graduate",
                "skills": ["Python", "Communication"] if user_data["role"] == "learner" else [],
                "experience": 2,
                "region": "Bangalore",
                "target_career": "Data Scientist" if user_data["role"] == "learner" else ""
            },
            "nsqf_level": 5 if user_data["role"] == "learner" else 0,
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

        await db.users.insert_one(user_doc)
        print(f"Created user: {user_data['email']} (Role: {user_data['role']})")

    print("Seeding completed.")
    await disconnect_from_mongodb()

if __name__ == "__main__":
    asyncio.run(seed_users())
