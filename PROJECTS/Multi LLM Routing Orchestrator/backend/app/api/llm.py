from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.user import User
from ..models.request import Request
from ..schemas.llm import GenerateRequest, GenerateResponse, ModelsResponse, ModelInfo, ImageGenerateRequest, ImageGenerateResponse, TitleGenerateRequest, TitleGenerateResponse, ImageSummaryResponse
from ..services.router import RouterService
from ..services.image_generator import ImageGeneratorService
from ..services.image_summarizer import ImageSummarizerService
from ..api.auth import get_current_user

router = APIRouter(prefix="/llm", tags=["llm"])
router_service = RouterService()
image_service = ImageGeneratorService()
image_summarizer = ImageSummarizerService()


@router.post("/generate")
async def generate_content(
    request_data: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate content using intelligent routing (text or image)"""
    
    try:
        # Check if this is an image generation request
        is_image_request = router_service.is_image_generation_request(request_data.prompt)
        print(f"DEBUG: Prompt: '{request_data.prompt}' | Is image request: {is_image_request}")
        
        if is_image_request:
            # Convert to image generation request
            image_request = ImageGenerateRequest(
                prompt=request_data.prompt,
                model="stable-diffusion-xl",  # Default to high-quality model
                width=1024,
                height=1024,
                num_images=1,
                guidance_scale=7.5,
                num_inference_steps=50
            )
            
            # Generate image
            image_response = await image_service.generate_image(image_request)
            
            # Save request to database
            db_request = Request(
                user_id=current_user.id,
                prompt=request_data.prompt,
                response=f"Generated {len(image_response.images)} image(s)",
                model=image_response.model,
                provider=image_response.provider,
                latency_ms=image_response.latency_ms,
                status="success"
            )
            
            db.add(db_request)
            await db.commit()
            
            # Return as text response with image data
            return GenerateResponse(
                response=f"I've generated an image based on your prompt: \"{request_data.prompt}\"\n\n![Generated Image]({image_response.images[0]})",
                model=image_response.model,
                provider=image_response.provider,
                latency_ms=image_response.latency_ms,
                tokens_used=None
            )
        
        else:
            # Regular text generation
            response = await router_service.route_request(request_data)
            
            # Save request to database
            db_request = Request(
                user_id=current_user.id,
                prompt=request_data.prompt,
                response=response.response,
                model=response.model,
                provider=response.provider,
                latency_ms=response.latency_ms,
                status="success"
            )
            
            db.add(db_request)
            await db.commit()
            
            return response
        
    except Exception as e:
        # Save failed request
        db_request = Request(
            user_id=current_user.id,
            prompt=request_data.prompt,
            model=request_data.model or "auto",
            provider="unknown",
            status="failed",
            error_message=str(e)
        )
        
        db.add(db_request)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


@router.get("/models", response_model=ModelsResponse)
async def get_models():
    """Get list of available models"""
    
    try:
        models = router_service.get_available_models()
        
        # Convert to ModelInfo objects with better display names
        model_infos = []
        for model in models:
            # Determine max tokens based on model
            max_tokens = 8192 if "8192" in model["name"] else 8000
            if "70b" in model["name"].lower():
                max_tokens = 32000
            elif "9b" in model["name"]:
                max_tokens = 8192
            elif "7b" in model["name"]:
                max_tokens = 4096
            
            model_infos.append(ModelInfo(
                name=model["name"],
                provider=model["provider"],
                max_tokens=max_tokens,
                is_local=model["is_local"],
                is_available=model["is_available"]
            ))
        
        return ModelsResponse(
            models=model_infos,
            auto_routing_enabled=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get models: {str(e)}"
        )


@router.post("/generate-image", response_model=ImageGenerateResponse)
async def generate_image(
    request_data: ImageGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate high-quality images using Hugging Face models"""
    
    try:
        # Generate image
        response = await image_service.generate_image(request_data)
        
        # Save request to database
        db_request = Request(
            user_id=current_user.id,
            prompt=request_data.prompt,
            response=f"Generated {len(response.images)} image(s)",
            model=response.model,
            provider=response.provider,
            latency_ms=response.latency_ms,
            status="success"
        )
        
        db.add(db_request)
        await db.commit()
        
        return response
        
    except Exception as e:
        # Save failed request
        db_request = Request(
            user_id=current_user.id,
            prompt=request_data.prompt,
            model=request_data.model or "stable-diffusion-xl",
            provider="huggingface",
            status="failed",
            error_message=str(e)
        )
        
        db.add(db_request)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )


@router.get("/image-models")
async def get_image_models():
    """Get list of available image generation models"""
    
    try:
        models = image_service.get_available_models()
        return {
            "models": models,
            "service_available": image_service.is_available
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get image models: {str(e)}"
        )


@router.post("/test-image-detection")
async def test_image_detection(request_data: dict):
    """Test endpoint to check image detection"""
    prompt = request_data.get("prompt", "")
    is_image = router_service.is_image_generation_request(prompt)
    return {
        "prompt": prompt,
        "is_image_generation": is_image,
        "debug_info": {
            "prompt_lower": prompt.lower(),
            "contains_create_image": "create image" in prompt.lower(),
            "contains_create_a_image": "create a image" in prompt.lower(),
            "contains_create_an_image": "create an image" in prompt.lower()
        }
    }


@router.post("/summarize-image", response_model=ImageSummaryResponse)
async def summarize_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Summarize an uploaded image (jpg/jpeg/png)."""
    try:
        if file.content_type not in ("image/jpeg", "image/jpg", "image/png"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only jpg, jpeg, and png are supported")

        image_bytes = await file.read()
        summary, used_model = await image_summarizer.summarize_image(image_bytes)
        return ImageSummaryResponse(summary=summary, model=used_model)
    except HTTPException:
        raise
    except Exception as e:
        # Provide clearer error for common HF failures
        detail = str(e)
        if "Image captioning failed" not in detail:
            detail = f"Image captioning failed: {detail}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)

@router.post("/generate-title", response_model=TitleGenerateResponse)
async def generate_chat_title(
    request_data: TitleGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a concise title for a chat session based on the conversation"""
    
    try:
        # Create a prompt to generate a title based on the conversation
        conversation_text = ""
        for msg in request_data.messages[:6]:  # Use first 6 messages to avoid token limits
            role = msg.get("role", "user")
            content = msg.get("content", "")
            conversation_text += f"{role.capitalize()}: {content}\n"
        
        title_prompt = f"""Based on the following conversation, generate a concise, descriptive title (3-6 words) that captures the main topic or question. Do not use quotes or special characters. Just return the title.

Conversation:
{conversation_text}

Title:"""
        
        # Use a fast, efficient model for title generation
        title_request = GenerateRequest(
            prompt=title_prompt,
            model=None,  # Use auto-routing to pick the best available model
            max_tokens=20,  # Keep it short
            temperature=0.3  # Lower temperature for more consistent titles
        )
        
        response = await router_service.route_request(title_request)
        
        # Clean up the title
        title = response.response.strip()
        # Remove common prefixes and clean up
        title = title.replace("Title:", "").strip()
        title = title.replace('"', '').replace("'", "").strip()
        
        # Fallback if title is too long or empty
        if len(title) > 50 or len(title) < 3:
            # Extract key words from first user message
            first_user_msg = next((msg["content"] for msg in request_data.messages if msg.get("role") == "user"), "")
            words = first_user_msg.split()[:4]
            title = " ".join(words) if words else "New Chat"
        
        # Save the title generation request (optional, for analytics)
        db_request = Request(
            user_id=current_user.id,
            prompt=title_prompt,
            response=title,
            model=response.model,
            provider=response.provider,
            latency_ms=response.latency_ms,
            status="success"
        )
        
        db.add(db_request)
        await db.commit()
        
        return TitleGenerateResponse(
            title=title,
            model=response.model,
            provider=response.provider,
            latency_ms=response.latency_ms
        )
        
    except Exception as e:
        # Fallback title generation
        first_user_msg = next((msg["content"] for msg in request_data.messages if msg.get("role") == "user"), "")
        words = first_user_msg.split()[:4]
        fallback_title = " ".join(words) if words else "New Chat"
        
        return TitleGenerateResponse(
            title=fallback_title,
            model="fallback",
            provider="local",
            latency_ms=0.0
        )


@router.get("/health")
async def health_check():
    """Check health of all LLM providers"""
    
    try:
        health_status = await router_service.health_check()
        image_health = await image_service.health_check()
        
        health_status["image_generation"] = {
            "status": "healthy" if image_health else "unhealthy",
            "is_local": False,
            "models": [model["name"] for model in image_service.get_available_models()]
        }
        
        return {
            "status": "healthy",
            "providers": health_status
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }




