from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import User, TokenData
from database import get_database
import os
import logging

_auth_logger = logging.getLogger(__name__)

# JWT Configuration
_default_secret = "a1b9c8f3e7d24a6b0e5f1c9d8a7b6e4f2d3c1a0b9e8f7d6c5a4b3e2f1d0c9a8"
SECRET_KEY = os.getenv("SECRET_KEY", _default_secret)
if SECRET_KEY == _default_secret:
    _auth_logger.warning("⚠️  Using fallback JWT SECRET_KEY. Set a unique SECRET_KEY in .env for production!")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer
security = HTTPBearer()

class AuthManager:
    """Handles authentication and authorization"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        # Truncate password if longer than 72 bytes (bcrypt limit)
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password[:72]
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        # Truncate password if longer than 72 bytes (bcrypt limit)
        if len(password.encode('utf-8')) > 72:
            password = password[:72]
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> TokenData:
        """Verify JWT token and extract user data"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            role: str = payload.get("role")
            if email is None or role is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            token_data = TokenData(email=email, role=role)
            return token_data
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    token_data = AuthManager.verify_token(token)
    
    db = await get_database()
    user = await db.users.find_one({"email": token_data.email})
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return User(**user)

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user (additional validation if needed)"""
    # Add any additional user validation here
    return current_user

# Role-based access control
def role_required(required_role: str):
    """Decorator to require specific role"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}",
            )
        return current_user
    return role_checker

# Multiple roles allowed
def roles_required(allowed_roles: list):
    """Decorator to allow multiple roles"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker

# First login check
async def check_first_login(current_user: User = Depends(get_current_user)) -> User:
    """Check if user is logging in for the first time"""
    if current_user.first_login:
        raise HTTPException(
            status_code=status.HTTP_302_FOUND,
            detail="First login - profile setup required",
            headers={"Location": "/profile-setup"},
        )
    return current_user

# Token blacklist for logout (in production, use Redis or database)
token_blacklist = set()

def add_token_to_blacklist(token: str):
    """Add token to blacklist"""
    token_blacklist.add(token)

def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted"""
    return token in token_blacklist

async def verify_token_not_blacklisted(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify token is not blacklisted"""
    token = credentials.credentials
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials

# ── Typed Role Dependencies ───────────────────────────────────

async def get_current_learner(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to get current user only if they are a learner"""
    if current_user.role != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Learners only"
        )
    return current_user

async def get_current_trainer(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to get current user only if they are a trainer"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Trainers only"
        )
    return current_user

async def get_current_policymaker(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to get current user only if they are a policymaker"""
    if current_user.role != "policymaker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Policymakers only"
        )
    return current_user
