from fastapi import APIRouter, Depends, HTTPException, status
from models import User, APIResponse
from auth import get_current_user
from database import get_database
import logging

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/simple", response_model=APIResponse)
async def simple_test():
    """Simple test endpoint"""
    return APIResponse(
        success=True,
        message="Simple test works",
        data={"status": "ok"}
    )

@router.get("/auth-test", response_model=APIResponse)
async def auth_test(current_user: User = Depends(get_current_user)):
    """Test authentication without role check"""
    return APIResponse(
        success=True,
        message="Auth test works",
        data={"user_id": current_user.user_id, "email": current_user.email}
    )

@router.get("/db-test", response_model=APIResponse)
async def db_test():
    """Test database connection"""
    try:
        db = await get_database()
        # Simple database query
        count = await db.users.count_documents({})
        return APIResponse(
            success=True,
            message="DB test works",
            data={"user_count": count}
        )
    except Exception as e:
        logging.error(f"DB test error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
