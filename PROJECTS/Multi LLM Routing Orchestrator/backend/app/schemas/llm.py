from pydantic import BaseModel
from typing import Optional, List


class GenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = None  # If None, use auto-routing
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7


class GenerateResponse(BaseModel):
    response: str
    model: str
    provider: str
    latency_ms: float
    tokens_used: Optional[int] = None


class ImageGenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = None  # If None, use default image model
    width: Optional[int] = 512
    height: Optional[int] = 512
    num_images: Optional[int] = 1
    guidance_scale: Optional[float] = 7.5
    num_inference_steps: Optional[int] = 50


class ImageGenerateResponse(BaseModel):
    images: List[str]  # Base64 encoded images
    model: str
    provider: str
    latency_ms: float
    prompt: str


class ImageSummaryResponse(BaseModel):
    summary: str
    model: str
    provider: str = "huggingface"
    latency_ms: Optional[float] = None


class ModelInfo(BaseModel):
    name: str
    provider: str
    max_tokens: int
    is_local: bool
    is_available: bool
    model_type: Optional[str] = "text"  # "text" or "image"


class ModelsResponse(BaseModel):
    models: List[ModelInfo]
    auto_routing_enabled: bool


class TitleGenerateRequest(BaseModel):
    messages: List[dict]  # List of messages with role and content


class TitleGenerateResponse(BaseModel):
    title: str
    model: str
    provider: str
    latency_ms: float




