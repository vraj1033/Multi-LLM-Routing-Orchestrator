import os
import secrets
import string

def generate_secret_key(length=64):
    """Generate a secure random secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_env_file():
    """Create .env file with secure settings"""
    secret_key = generate_secret_key()
    
    env_content = f"""# Database
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_gOWDK3YCqm7Q@ep-purple-recipe-a8zelltt-pooler.eastus2.azure.neon.tech/LLM?ssl=require

# JWT - Generated secure key
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys (Free Tiers)
GROQ_API_KEY=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
HUGGINGFACE_API_KEY=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

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# App Settings
APP_NAME=Multi-LLM Router
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env file created successfully!")
    print(f"🔑 JWT Secret Key generated: {secret_key[:20]}...")
    print("🚀 You can now start the backend!")

if __name__ == "__main__":
    create_env_file()





