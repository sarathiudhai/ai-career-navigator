import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()

# Database configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_career_navigator")

# MongoDB client
client = None
database = None

async def connect_to_mongodb():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        database = client[DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        logging.info(f"Connected to MongoDB: {DATABASE_NAME}")
        
        # Drop legacy collections if they exist
        existing = await database.list_collection_names()
        for legacy in ("learners", "trainers", "policymakers"):
            if legacy in existing:
                await database.drop_collection(legacy)
                logging.info(f"Dropped legacy collection: {legacy}")
        
        # Create indexes for performance
        await create_indexes()
        
        return database
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        raise

async def disconnect_from_mongodb():
    """Disconnect from MongoDB"""
    global client
    if client:
        client.close()
        logging.info("Disconnected from MongoDB")

async def get_database():
    """Get database instance"""
    global database
    if database is None:
        await connect_to_mongodb()
    return database

async def create_indexes():
    """Create database indexes for performance"""
    db = await get_database()
    
    # ── users collection ──────────────────────────────────────
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("role") # For filtering users by role
    
    # ── courses collection ────────────────────────────────────
    await db.courses.create_index("course_id", unique=True)
    await db.courses.create_index("nsqf_level")
    
    # ── certifications collection ─────────────────────────────
    await db.certifications.create_index("certification_id", unique=True)
    await db.certifications.create_index("learner_id")
    await db.certifications.create_index("course_id")
    
    logging.info("Database indexes created successfully")
