from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    app_name: str = "Multi-LLM Router"
    debug: bool = False
    
    # Database
    database_url: str
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API Keys
    groq_api_key: str = ""
    huggingface_api_key: str = ""
    
    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()








