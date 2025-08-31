import httpx
import time
from typing import Optional
from .base import BaseProvider
from ..schemas.llm import GenerateRequest, GenerateResponse
from ..core.config import settings


class OllamaProvider(BaseProvider):
    """Ollama local model provider"""
    
    def __init__(self):
        super().__init__("ollama", is_local=True)
        self.base_url = settings.ollama_base_url
        # Common Ollama models (user needs to pull these locally)
        self.models = [
            "llama3.1:8b",      # Most common and reliable
            "llama3:8b",        # Alternative
            "mistral:7b",       # Good for various tasks
            "gemma2:9b",        # Google's model
            "codellama:7b"      # For coding tasks
        ]
        
        print(f"DEBUG: Ollama base URL: {self.base_url}")
        print(f"DEBUG: Ollama provider initialized as available: {self.is_available}")
    
    async def is_model_available(self, model: str) -> bool:
        """Check if model is available locally"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    available_models = response.json().get("models", [])
                    return any(m["name"] == model for m in available_models)
        except Exception:
            pass
        return False
    
    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        """Generate response using Ollama"""
        start_time = time.time()
        
        # Use specified model or default to most common model
        model = request.model or "llama3.1:8b"
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": model,
                    "prompt": request.prompt,
                    "stream": False,
                    "options": {
                        "temperature": request.temperature or 0.7,
                        "num_predict": request.max_tokens or 1000
                    }
                }
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    latency = (time.time() - start_time) * 1000
                    
                    return GenerateResponse(
                        response=result.get("response", ""),
                        model=model,
                        provider="ollama",
                        latency_ms=latency,
                        tokens_used=result.get("eval_count")
                    )
                else:
                    raise Exception(f"Ollama API error: {response.status_code}")
                    
        except Exception as e:
            self.is_available = False
            raise Exception(f"Ollama generation failed: {str(e)}")
    
    def get_models(self) -> list[str]:
        """Get available Ollama models"""
        return self.models
