import httpx
import time
from typing import Optional
from .base import BaseProvider
from ..schemas.llm import GenerateRequest, GenerateResponse
from ..core.config import settings


class HuggingFaceProvider(BaseProvider):
    """Hugging Face Inference API provider (free tier)"""
    
    def __init__(self):
        super().__init__("huggingface", is_local=False)
        self.api_key = settings.huggingface_api_key
        self.base_url = "https://api-inference.huggingface.co"
        self.models = [
            "tiiuae/falcon-7b-instruct",
            "microsoft/Phi-3-mini"
        ]
        
        print(f"DEBUG: HuggingFace API key loaded: {'Yes' if self.api_key else 'No'} (length: {len(self.api_key) if self.api_key else 0})")
        
        if not self.api_key:
            self.is_available = False
            print("DEBUG: HuggingFace provider disabled - no API key")
    
    async def is_model_available(self, model: str) -> bool:
        """Check if model is available in Hugging Face"""
        return model in self.models and self.is_available
    
    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        """Generate response using Hugging Face API"""
        if not self.api_key:
            raise Exception("Hugging Face API key not configured")
        
        start_time = time.time()
        
        # Use specified model or default to Phi-3-mini
        model = request.model or "microsoft/Phi-3-mini"
        
        if model not in self.models:
            raise Exception(f"Model {model} not available in Hugging Face")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Format prompt based on model
            if "phi" in model.lower():
                formatted_prompt = f"<|user|>\n{request.prompt}<|end|>\n<|assistant|>\n"
            elif "falcon" in model.lower():
                formatted_prompt = f"User: {request.prompt}\nAssistant:"
            else:
                formatted_prompt = request.prompt
            
            payload = {
                "inputs": formatted_prompt,
                "parameters": {
                    "max_new_tokens": request.max_tokens or 1000,
                    "temperature": request.temperature or 0.7,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/models/{model}",
                    json=payload,
                    headers=headers,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    latency = (time.time() - start_time) * 1000
                    
                    # Extract generated text from response
                    if isinstance(result, list) and len(result) > 0:
                        generated_text = result[0].get("generated_text", "")
                        # Remove the input prompt from the response
                        if formatted_prompt in generated_text:
                            generated_text = generated_text.replace(formatted_prompt, "").strip()
                    else:
                        generated_text = str(result)
                    
                    return GenerateResponse(
                        response=generated_text,
                        model=model,
                        provider="huggingface",
                        latency_ms=latency,
                        tokens_used=None  # HF API doesn't always provide token count
                    )
                else:
                    error_msg = response.json().get("error", "Unknown error")
                    raise Exception(f"Hugging Face API error: {error_msg}")
                    
        except Exception as e:
            self.is_available = False
            raise Exception(f"Hugging Face generation failed: {str(e)}")
    
    def get_models(self) -> list[str]:
        """Get available Hugging Face models"""
        return self.models if self.is_available else []







