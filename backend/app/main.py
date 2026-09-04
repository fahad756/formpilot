"""
FormPilot — FastAPI application entry point.

This module wires together:
  - CORS middleware (configured from environment)
  - All API routers with versioned prefixes
  - Global exception handlers for clean error responses
  - Health check endpoint for load balancer / uptime monitoring

Adding a new feature area:
  1. Create routes/my_feature.py with an APIRouter
  2. Import and include it here with `app.include_router(...)`
  No other changes needed — the middleware and error handling apply globally.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routes import auth, autofill, applications, profile, resumes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle hook. Validate config at startup."""
    settings = get_settings()
    # Fail fast: if required env vars are missing, crash here not on first request
    assert settings.supabase_url, "SUPABASE_URL must be set"
    assert settings.supabase_service_role_key, "SUPABASE_SERVICE_ROLE_KEY must be set"
    # supabase_jwt_secret is optional — new projects use ECC signing verified via API
    yield
    # Cleanup (if needed) goes here


app = FastAPI(
    title="FormPilot API",
    description="Backend for the FormPilot job application autofill platform.",
    version="1.0.0",
    lifespan=lifespan,
    # Disable automatic /docs in production to avoid leaking schema
    docs_url=None if get_settings().is_production else "/docs",
    redoc_url=None if get_settings().is_production else "/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handlers ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all for unhandled exceptions — returns a generic 500 rather than
    leaking stack traces to the client. Log the full error server-side.
    """
    # In production, swap print() for a proper logger (structlog, loguru, etc.)
    print(f"Unhandled error on {request.method} {request.url}: {exc!r}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
API_V1 = "/api/v1"

app.include_router(auth.router, prefix=API_V1, tags=["auth"])
app.include_router(profile.router, prefix=API_V1, tags=["profile"])
app.include_router(resumes.router, prefix=API_V1, tags=["resumes"])
app.include_router(applications.router, prefix=API_V1, tags=["applications"])
app.include_router(autofill.router, prefix=API_V1, tags=["autofill"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"], include_in_schema=False)
async def health_check():
    """Minimal liveness probe — returns 200 if the process is up."""
    return {"status": "ok", "version": app.version}
