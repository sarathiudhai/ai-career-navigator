from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from datetime import timedelta, datetime, timezone
from models import UserCreate, UserLogin, User, Token, APIResponse, UserResponse, ProfileDetails
from auth import AuthManager, get_current_user, verify_token_not_blacklisted
from database import get_database
import uuid
import logging

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/register", response_model=APIResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        db = await get_database()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = AuthManager.get_password_hash(user_data.password)
        
        # Build unified user document (all roles in one collection)
        user_doc = {
            "user_id": str(uuid.uuid4()),
            "email": user_data.email,
            "hashed_password": hashed_password,
            "role": user_data.role,
            "first_login": True,
            "profile": {},
            # Learner specific fields (initialized to prevent dashboard crashes)
            "nsqf_level": 0,
            "courses_enrolled": [],
            "course_progress": {},
            "learning_path": [],
            "certifications": [],
            "skill_gap_analysis": {},
            "total_progress_percentage": 0.0, # Added for dashboard stability
            
            # Trainer specific fields
            "assigned_learners": [],
            "courses_created": [],
            
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.users.insert_one(user_doc)
        
        logging.info(f"New user registered: {user_data.email} (role: {user_data.role})")
        
        return APIResponse(
            success=True,
            message="User registered successfully",
            data={"user_id": user_doc["user_id"], "role": user_data.role}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return JWT token"""
    try:
        db = await get_database()
        
        # Find user
        user = await db.users.find_one({"email": user_credentials.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not AuthManager.verify_password(user_credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify role matches if provided
        if user_credentials.role and user_credentials.role != user["role"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This account is registered as a {user['role']}. Please select the correct role."
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=30)
        access_token = AuthManager.create_access_token(
            data={"sub": user["email"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        user_response = UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            role=user["role"],
            first_login=user["first_login"],
            created_at=user["created_at"]
        )
        
        logging.info(f"User logged in: {user_credentials.email}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_data=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/logout")
async def logout():
    """Logout user"""
    try:
        logging.info("User logged out")
        return {"success": True, "message": "Logout successful"}
    except Exception as e:
        logging.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/me", response_model=APIResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information — single collection lookup"""
    try:
        db = await get_database()
        
        user = await db.users.find_one({"user_id": current_user.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert ObjectId
        user["_id"] = str(user["_id"])
        
        return APIResponse(
            success=True,
            message="User information retrieved successfully",
            data={"user": user}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get user info error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(credentials: HTTPBearer = Depends(verify_token_not_blacklisted)):
    """Refresh JWT token"""
    try:
        token = credentials.credentials
        
        from auth import AuthManager
        token_data = AuthManager.verify_token(token)
        
        db = await get_database()
        user = await db.users.find_one({"email": token_data.email})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        access_token_expires = timedelta(minutes=30)
        access_token = AuthManager.create_access_token(
            data={"sub": user["email"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        user_response = UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            role=user["role"],
            first_login=user["first_login"],
            created_at=user["created_at"]
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_data=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )
