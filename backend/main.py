import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from .database.indexes import create_indexes
from .routers import auth, grievances, admin, user, media, chat
from .routers.admin_analytics import router as analytics_router

load_dotenv()

app = FastAPI(
    title="AI-Powered Public Grievance Redressal System",
    description=(
        "Production backend with AI department assignment, priority scoring, "
        "admin approval workflow, department-level RBAC, and audit trail."
    ),
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        # LAN access – other devices on the local network
        "http://192.168.0.181:3000",
        "http://192.168.0.181:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static files (media uploads) ────────────────────────
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── Startup ─────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    try:
        from .database.connection import check_connection
        if await check_connection():
            await create_indexes()
            print("✅ DB connected and indexes created.")
        else:
            print("⚠️  Could not connect to MongoDB. Running in degraded mode.")
    except Exception as e:
        print(f"⚠️  Startup error: {e}")

# ─── Global error handler ────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"DEBUG ERROR: Global exception caught: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

# ─── Routers ─────────────────────────────────────────────
app.include_router(auth.router,       prefix="/api")
app.include_router(grievances.router, prefix="/api")
app.include_router(admin.router,      prefix="/api")
app.include_router(analytics_router,  prefix="/api")
app.include_router(user.router,       prefix="/api")
app.include_router(media.router,      prefix="/api")
app.include_router(chat.router,       prefix="/api")

# ─── Health check ────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "version": "3.0.0",
        "message": "AI Grievance Redressal API operational",
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
async def health():
    from .database.connection import check_connection
    db_ok = await check_connection()
    return {"api": "ok", "database": "ok" if db_ok else "unavailable"}
