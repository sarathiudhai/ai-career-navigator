from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import os

# Import routers
from routers import auth, learners, trainers, policymakers, courses, ai_chat
from database import connect_to_mongodb, disconnect_from_mongodb

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS origins from environment (comma-separated) with localhost defaults
DEFAULT_ORIGINS = "http://localhost:5173,http://localhost:3000,http://localhost:5174,http://localhost:5175"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    try:
        await connect_to_mongodb()
        
        # Initialize ML Predictor
        from ml.predictor import MLPredictor
        app.state.ml_predictor = MLPredictor()
        logger.info("ML Predictor initialized")
        
        logger.info("Application startup completed")
        yield
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    finally:
        # Shutdown
        await disconnect_from_mongodb()
        logger.info("Application shutdown completed")

# Create FastAPI application
app = FastAPI(
    title="AI Career Navigator API",
    description="A comprehensive platform for vocational education and career development using NSQF framework",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(learners.router, prefix="/api")
app.include_router(trainers.router, prefix="/api")
app.include_router(policymakers.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(ai_chat.router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Career Navigator",
        "version": "2.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "AI Career Navigator API",
        "version": "2.0.0",
        "description": "A comprehensive platform for vocational education and career development",
        "endpoints": {
            "authentication": "/api/auth",
            "learners": "/api/learners",
            "trainers": "/api/trainers",
            "policymakers": "/api/policymakers",
            "courses": "/api/courses",
            "docs": "/docs",
            "health": "/health"
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error occurred",
            "detail": str(exc) if getattr(app.state, "debug", False) else "Internal server error"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc}")
    # Return structured APIResponse format for validation errors
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation Error",
            "detail": exc.errors()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
