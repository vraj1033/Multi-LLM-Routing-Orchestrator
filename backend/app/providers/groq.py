import httpx
import time
from typing import Optional
from .base import BaseProvider
from ..schemas.llm import GenerateRequest, GenerateResponse
from ..core.config import settings


class GroqProvider(BaseProvider):
    """Groq API provider (free tier)"""
    
    def __init__(self):
        super().__init__("groq", is_local=False)
        self.api_key = settings.groq_api_key
        self.base_url = "https://api.groq.com/openai/v1"
        # Only confirmed working models as of December 2024
        self.models = [
            "llama-3.1-8b-instant",    # Most reliable and fast
            "llama3-8b-8192",          # Alternative 8B model
            "gemma2-9b-it",            # Google's model, good performance
            "gemma-7b-it"              # Smaller Google model
        ]
        
        print(f"DEBUG: Groq API key loaded: {'Yes' if self.api_key else 'No'} (length: {len(self.api_key) if self.api_key else 0})")
        
        if not self.api_key:
            self.is_available = False
            print("DEBUG: Groq provider disabled - no API key")
    
    async def is_model_available(self, model: str) -> bool:
        """Check if model is available in Groq"""
        return model in self.models and self.is_available
    
    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        """Generate response using Groq API"""
        if not self.api_key:
            raise Exception("Groq API key not configured")
        
        start_time = time.time()
        
        # Use specified model or default to most reliable model
        model = request.model or "llama-3.1-8b-instant"
        if model not in self.models:
            raise Exception(f"Model {model} not available in Groq")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {"role": "user", "content": request.prompt}
                ],
                "max_tokens": request.max_tokens or 1000,
                "temperature": request.temperature or 0.7,
                "stream": False
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    latency = (time.time() - start_time) * 1000
                    
                    return GenerateResponse(
                        response=result["choices"][0]["message"]["content"],
                        model=model,
                        provider="groq",
                        latency_ms=latency,
                        tokens_used=result["usage"]["total_tokens"]
                    )
                else:
                    error_msg = response.json().get("error", {}).get("message", "Unknown error")
                    raise Exception(f"Groq API error: {error_msg}")
                    
        except Exception as e:
            self.is_available = False
            raise Exception(f"Groq generation failed: {str(e)}")
    
    def get_models(self) -> list[str]:
        """Get available Groq models"""
        return self.models if self.is_available else []







