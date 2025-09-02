import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db  # your async DB init
from app.api import auth, llm, searches, metrics, payments, subscription


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / Shutdown events"""
    try:
        await init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
    yield
    print("🔄 Shutting down application...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Multi-LLM Routing Orchestrator API",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(llm.router, prefix="/api")
app.include_router(searches.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(subscription.router, prefix="/api")


# Root & Health
@app.get("/")
async def root():
    return {"message": settings.app_name, "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.app_name}


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.debug else "Something went wrong"
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=settings.debug)







