# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.routes import alerts
from app.core.config import settings
from app.routes import components
from app.routes import boms
from app.routes import settings as settings_routes
from app.routes import csv
from app.routes import risk
from app.routes import webhooks

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup/shutdown events"""
    # Startup: DB connections, cache init, etc.
    logger.info("🚀 CraftStock Backend starting...")
    logger.info(f"📦 Project: {settings.PROJECT_NAME} v{settings.VERSION}")
    yield
    # Shutdown: Cleanup connections, close pools, etc.
    logger.info("🛑 CraftStock Backend shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Track raw materials and hidden consumables for Shopify products",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware - MUST be added BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://*.shopify.com",
        "https://*.myshopify.com",
        settings.SHOPIFY_APP_URL.rstrip("/") if settings.SHOPIFY_APP_URL else "",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API routers (v1)
app.include_router(components.router)
app.include_router(boms.router)
app.include_router(alerts.router)
app.include_router(settings_routes.router)
app.include_router(csv.router)
app.include_router(risk.router)
app.include_router(webhooks.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to CraftStock API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

# Health check endpoint (for load balancers, monitoring)
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "craftstock-backend",
        "version": settings.VERSION,
        "timestamp": None  # Will be auto-filled by FastAPI
    }

# Optional: Catch-all for undefined routes (404 handler)
from fastapi.responses import JSONResponse

@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all(path_name: str):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"The path '/{path_name}' does not exist",
            "available_endpoints": ["/", "/health", "/docs", "/api/v1/components", "/api/v1/boms"]
        }
    )