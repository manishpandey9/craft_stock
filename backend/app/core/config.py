# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CraftStock Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://*.shopify.com",
        "https://*.myshopify.com"
    ]
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/craftstock_dev"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Shopify
    SHOPIFY_API_KEY: str = ""
    SHOPIFY_API_SECRET: str = ""
    SHOPIFY_APP_URL: str = "http://localhost:8000"
    SHOPIFY_SCOPES: str = "read_products,read_variants,read_orders,write_inventory"
    
    # Security
    SECRET_KEY: str = "dev-secret-change-in-prod"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()