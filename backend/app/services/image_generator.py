import httpx
import time
import base64
import io
from typing import List
from ..schemas.llm import ImageGenerateRequest, ImageGenerateResponse
from ..core.config import settings


class ImageGeneratorService:
    """High-quality image generation service using Hugging Face"""
    
    def __init__(self):
        self.api_key = settings.huggingface_api_key
        self.base_url = "https://api-inference.huggingface.co"
        
        # High-quality image generation models
        self.models = {
            "stable-diffusion-xl": "stabilityai/stable-diffusion-xl-base-1.0",
            "stable-diffusion-2.1": "stabilityai/stable-diffusion-2-1",
            "flux-schnell": "black-forest-labs/FLUX.1-schnell",
            "playground-v2.5": "playgroundai/playground-v2.5-1024px-aesthetic",
            "realistic-vision": "SG161222/Realistic_Vision_V6.0_B1_noVAE"
        }
        
        self.is_available = bool(self.api_key)
    
    async def generate_image(self, request: ImageGenerateRequest) -> ImageGenerateResponse:
        """Generate high-quality images using Hugging Face models"""
        if not self.api_key:
            raise Exception("Hugging Face API key not configured")
        
        start_time = time.time()
        
        # Use specified model or default to SDXL
        model_key = request.model or "stable-diffusion-xl"
        model_name = self.models.get(model_key, self.models["stable-diffusion-xl"])
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Enhance prompt for better quality
            enhanced_prompt = self._enhance_prompt(request.prompt)
            
            payload = {
                "inputs": enhanced_prompt,
                "parameters": {
                    "width": request.width or 1024,
                    "height": request.height or 1024,
                    "num_inference_steps": request.num_inference_steps or 50,
                    "guidance_scale": request.guidance_scale or 7.5,
                    "negative_prompt": "blurry, low quality, distorted, deformed, ugly, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, out of frame, ugly, extra limbs, bad anatomy, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, out of frame, ugly, extra limbs, bad anatomy, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry"
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/models/{model_name}",
                    json=payload,
                    headers=headers,
                    timeout=120.0  # Longer timeout for image generation
                )
                
                if response.status_code == 200:
                    # Convert image bytes to base64
                    image_bytes = response.content
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    
                    latency = (time.time() - start_time) * 1000
                    
                    return ImageGenerateResponse(
                        images=[f"data:image/png;base64,{image_base64}"],
                        model=model_key,
                        provider="huggingface",
                        latency_ms=latency,
                        prompt=request.prompt
                    )
                else:
                    error_msg = response.text
                    try:
                        error_json = response.json()
                        error_msg = error_json.get("error", error_msg)
                    except:
                        pass
                    raise Exception(f"Image generation failed: {error_msg}")
                    
        except Exception as e:
            raise Exception(f"Image generation error: {str(e)}")
    
    def _enhance_prompt(self, prompt: str) -> str:
        """Enhance prompt for better image quality"""
        quality_terms = [
            "high quality", "detailed", "sharp focus", "professional",
            "8k resolution", "masterpiece", "best quality", "ultra detailed"
        ]
        
        # Check if prompt already has quality terms
        prompt_lower = prompt.lower()
        has_quality_terms = any(term in prompt_lower for term in quality_terms)
        
        if not has_quality_terms:
            # Add quality enhancement
            enhanced = f"{prompt}, high quality, detailed, sharp focus, professional photography, 8k resolution, masterpiece"
            return enhanced
        
        return prompt
    
    def get_available_models(self) -> List[dict]:
        """Get available image generation models"""
        if not self.is_available:
            return []
        
        return [
            {
                "name": "stable-diffusion-xl",
                "display_name": "Stable Diffusion XL",
                "description": "High-quality, versatile image generation",
                "provider": "huggingface",
                "model_type": "image",
                "is_available": True
            },
            {
                "name": "flux-schnell",
                "display_name": "FLUX.1 Schnell",
                "description": "Fast, high-quality image generation",
                "provider": "huggingface",
                "model_type": "image",
                "is_available": True
            },
            {
                "name": "playground-v2.5",
                "display_name": "Playground v2.5",
                "description": "Aesthetic, high-resolution images",
                "provider": "huggingface",
                "model_type": "image",
                "is_available": True
            },
            {
                "name": "realistic-vision",
                "display_name": "Realistic Vision",
                "description": "Photorealistic image generation",
                "provider": "huggingface",
                "model_type": "image",
                "is_available": True
            }
        ]
    
    async def health_check(self) -> bool:
        """Check if image generation service is healthy"""
        if not self.api_key:
            return False
        
        try:
            # Test with a simple request
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/models/stabilityai/stable-diffusion-xl-base-1.0",
                    headers=headers,
                    timeout=10.0
                )
                return response.status_code in [200, 503]  # 503 means model is loading
        except:
            return False