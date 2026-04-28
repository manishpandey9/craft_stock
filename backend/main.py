# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.routes import components

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 CraftStock Backend starting...")
    yield
    # Shutdown
    logger.info("🛑 CraftStock Backend shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.shopify.com",
        "https://*.myshopify.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(components.router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "craftstock-backend",
        "version": "0.1.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to CraftStock API",
        "docs": "/docs"
    }