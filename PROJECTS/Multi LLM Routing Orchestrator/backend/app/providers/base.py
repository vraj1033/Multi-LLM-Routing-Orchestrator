from abc import ABC, abstractmethod
from typing import Optional
from ..schemas.llm import GenerateRequest, GenerateResponse


class BaseProvider(ABC):
    """Base class for all LLM providers"""
    
    def __init__(self, name: str, is_local: bool = False):
        self.name = name
        self.is_local = is_local
        self.is_available = True
    
    @abstractmethod
    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        """Generate response from the LLM provider"""
        pass
    
    @abstractmethod
    async def is_model_available(self, model: str) -> bool:
        """Check if a specific model is available"""
        pass
    
    async def health_check(self) -> bool:
        """Check if the provider is healthy and available"""
        return self.is_available
    
    def get_models(self) -> list[str]:
        """Get list of available models for this provider"""
        return []







