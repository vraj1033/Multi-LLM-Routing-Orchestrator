import re
from typing import List, Optional
from ..providers.base import BaseProvider
from ..providers.ollama import OllamaProvider
from ..providers.groq import GroqProvider
from ..providers.huggingface import HuggingFaceProvider
from ..schemas.llm import GenerateRequest, GenerateResponse


class RouterService:
    """Intelligent routing service for LLM requests"""
    
    def __init__(self):
        self.providers = {
            "ollama": OllamaProvider(),
            "groq": GroqProvider(),
            "huggingface": HuggingFaceProvider()
        }
        
        # Log provider availability for debugging
        for name, provider in self.providers.items():
            print(f"DEBUG: Provider {name} is_available: {provider.is_available}")
        
        # Task classification patterns - Enhanced for better detection
        self.patterns = {
            "image_generation": [
                r"\b(generate|create|make|draw|paint|sketch|illustrate|design)\s+(an?\s+)?(image|picture|photo|drawing|painting|artwork|visual)\b",
                r"\b(generate|create|make)\s+(an?\s+)?(image|picture|photo|drawing|painting)\s+of\b",
                r"\b(draw|paint|sketch|illustrate)\s+(me\s+)?(an?\s+)?\w+",
                r"\b(show|visualize|render)\s+(an?\s+)?(image|picture|visual)\b",
                r"\b(image|picture|photo|drawing|painting)\s+of\s+\w+",
                r"\b(art|artwork|visual)\s+(of|showing|depicting)\b"
            ],
            "reasoning": [
                r"\b(explain|explanation|describe|detail|analysis|analyze|why|how|what|when|where)\b",
                r"\b(think|reason|logic|problem|solve|calculate|understand)\b",
                r"\b(step by step|logical|rational|deduce|infer|because|therefore)\b",
                r"\b(detailed|comprehensive|thorough|in-depth|elaborate)\b"
            ],
            "coding": [
                r"\b(code|program|function|class|algorithm|bug|debug|implement|write|script)\b",
                r"\b(python|javascript|java|c\+\+|html|css|sql|api|programming)\b",
                r"\b(loop|if|else|while|for|try|catch|exception|variable|array|list)\b",
                r"\b(reverse|sort|filter|map|reduce|iterate|return)\b"
            ],
            "creative": [
                r"\b(write|create|story|poem|song|design|imagine|creative|compose)\b",
                r"\b(narrative|fiction|fantasy|adventure|romance|mystery|novel)\b",
                r"\b(describe|lyrics|character|plot|scene)\b"
            ],
            "summarization": [
                r"\b(summarize|summary|brief|overview|key points|main ideas|outline)\b",
                r"\b(condense|shorten|abbreviate|extract|highlight|recap)\b",
                r"\b(tl;dr|too long|didn't read|in short|briefly)\b"
            ],
            "historical": [
                r"\b(history|historical|war|world war|battle|ancient|medieval|century)\b",
                r"\b(timeline|chronology|events|dates|period|era|age)\b",
                r"\b(civilization|empire|revolution|independence|treaty)\b"
            ],
            "educational": [
                r"\b(learn|teach|education|lesson|course|study|academic)\b",
                r"\b(definition|concept|theory|principle|formula|equation)\b",
                r"\b(university|school|college|student|professor|research)\b"
            ],
            "casual": [
                r"\b(hello|hi|hey|how are you|what's up|chat|talk)\b",
                r"\b(weather|food|movie|book|music|hobby|interest)\b",
                r"\b(opinion|thought|feel|like|dislike|prefer)\b"
            ]
        }
    
    def is_image_generation_request(self, prompt: str) -> bool:
        """Check if the request is for image generation"""
        prompt_lower = prompt.lower().strip()
        
        # Direct keyword combinations that indicate image generation
        image_keywords = [
            "generate image", "generate an image", "generate a image",
            "create image", "create an image", "create a image", 
            "make image", "make an image", "make a image",
            "draw image", "draw an image", "draw a image",
            "paint image", "paint an image", "paint a image",
            "sketch image", "sketch an image", "sketch a image",
            "design image", "design an image", "design a image",
            "generate picture", "generate a picture", "generate an picture",
            "create picture", "create a picture", "create an picture",
            "make picture", "make a picture", "make an picture",
            "draw picture", "draw a picture", "draw an picture",
            "paint picture", "paint a picture", "paint an picture",
            "generate photo", "create photo", "make photo",
            "generate art", "create art", "make art",
            "generate artwork", "create artwork", "make artwork",
            "draw me", "paint me", "sketch me", "show me",
            "visualize", "render"
        ]
        
        # Check for direct keyword matches first
        for keyword in image_keywords:
            if keyword in prompt_lower:
                return True
        
        # Check for pattern-based matches
        for pattern in self.patterns["image_generation"]:
            if re.search(pattern, prompt_lower):
                return True
        
        # Additional checks for common image request patterns
        if re.search(r"\b(image|picture|photo|drawing|painting)\s+of\s+", prompt_lower):
            return True
            
        if re.search(r"\b(draw|paint|sketch|illustrate|design|create|generate|make)\s+.*\b(car|bmw|landscape|person|animal|building|scene)", prompt_lower):
            return True
        
        return False
    
    def classify_task(self, prompt: str) -> str:
        """Classify the task type based on prompt content"""
        prompt_lower = prompt.lower()
        scores = {}
        
        for task_type, patterns in self.patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, prompt_lower))
                score += matches * 2  # Weight pattern matches
                
                # Bonus for exact matches
                if re.search(pattern, prompt_lower):
                    score += 1
            
            scores[task_type] = score
        
        # Return task with highest score, default to casual
        best_task = max(scores.items(), key=lambda x: x[1])
        return best_task[0] if best_task[1] > 0 else "casual"
    
    def get_provider_priority(self) -> List[str]:
        """Get provider priority order based on availability and speed"""
        priority = []
        
        # Check each provider's availability and add to priority list
        if self.providers["groq"].is_available:
            priority.append("groq")  # Fastest, prioritize first
        
        if self.providers["huggingface"].is_available:
            priority.append("huggingface")  # Good fallback
            
        if self.providers["ollama"].is_available:
            priority.append("ollama")  # Local fallback, slowest
            
        return priority

    def get_optimal_model(self, task_type: str, preference: str = "balanced") -> tuple[str, str]:
        """Get optimal model and provider for task type with smart fallback"""
        
        # Enhanced routing rules - using only confirmed working models
        routing_rules = {
            "reasoning": [
                ("gemma2-9b-it", "groq"),                # Best available for reasoning
                ("llama-3.1-8b-instant", "groq"),        # Fast and reliable
                ("microsoft/Phi-3-mini", "huggingface"), # Good reasoning fallback
                ("llama3.1:8b", "ollama")                 # Local fallback
            ],
            "coding": [
                ("llama-3.1-8b-instant", "groq"),        # Excellent for code
                ("gemma2-9b-it", "groq"),                # Alternative for complex code
                ("codellama:7b", "ollama")                # Specialized coding model
            ],
            "creative": [
                ("gemma2-9b-it", "groq"),                # Creative and capable
                ("llama-3.1-8b-instant", "groq"),        # Fast creative tasks
                ("microsoft/Phi-3-mini", "huggingface"), # Creative fallback
                ("llama3.1:8b", "ollama")                 # Local fallback
            ],
            "summarization": [
                ("llama-3.1-8b-instant", "groq"),        # Fast summarization
                ("gemma2-9b-it", "groq"),                # Detailed summaries
                ("mistral:7b", "ollama")                  # Local fallback
            ],
            "historical": [
                ("gemma2-9b-it", "groq"),                # Best for detailed explanations
                ("llama-3.1-8b-instant", "groq"),        # Fast alternative
                ("llama3.1:8b", "ollama")                 # Local fallback
            ],
            "educational": [
                ("gemma2-9b-it", "groq"),                # Detailed explanations
                ("llama-3.1-8b-instant", "groq"),        # Fast learning content
                ("llama3.1:8b", "ollama")                 # Local fallback
            ],
            "casual": [
                ("llama-3.1-8b-instant", "groq"),        # Fast for casual chat
                ("gemma2-9b-it", "groq"),                # More detailed responses
                ("llama3.1:8b", "ollama")                 # Local fallback
            ]
        }
        
        # Get the routing options for this task type
        options = routing_rules.get(task_type, routing_rules["casual"])
        
        # Try each option in order, checking availability
        for model, provider in options:
            if self.providers[provider].is_available:
                return model, provider
        
        # Ultimate fallback - try any available provider
        priority = self.get_provider_priority()
        if priority:
            if priority[0] == "groq":
                return "llama-3.1-8b-instant", "groq"  # Most reliable Groq model
            elif priority[0] == "huggingface":
                return "microsoft/Phi-3-mini", "huggingface"
            elif priority[0] == "ollama":
                return "llama3:8b", "ollama"
        
        # Last resort
        return "llama3:8b", "ollama"
    
    async def route_request(self, request: GenerateRequest, user_preference: str = "balanced") -> GenerateResponse:
        """Route request to optimal provider with intelligent fallback"""
        
        # If specific model is requested, try it first but still fallback
        if request.model:
            for provider_name, provider in self.providers.items():
                if await provider.is_model_available(request.model):
                    try:
                        return await provider.generate(request)
                    except Exception as e:
                        print(f"Specific model {request.model} on {provider_name} failed: {e}")
                        continue
        
        # Auto-routing based on task classification
        task_type = self.classify_task(request.prompt)
        print(f"DEBUG: Classified task as: {task_type} for prompt: '{request.prompt[:50]}...'")
        
        # Get provider priority list
        provider_priority = self.get_provider_priority()
        print(f"DEBUG: Provider priority: {provider_priority}")
        
        # Try providers in priority order with appropriate models
        for provider_name in provider_priority:
            try:
                provider = self.providers[provider_name]
                if not provider.is_available:
                    print(f"DEBUG: Provider {provider_name} not available, skipping")
                    continue
                
                # Get models to try for this provider (only confirmed working models)
                models_to_try = []
                
                if provider_name == "groq":
                    if task_type in ["coding", "reasoning", "historical", "educational"]:
                        # For complex tasks, try larger models first
                        models_to_try = ["gemma2-9b-it", "llama-3.1-8b-instant", "llama3-8b-8192"]
                    else:
                        # For simple tasks, use fastest models
                        models_to_try = ["llama-3.1-8b-instant", "gemma2-9b-it"]
                elif provider_name == "huggingface":
                    models_to_try = ["microsoft/Phi-3-mini"]
                else:  # ollama
                    if task_type == "coding":
                        models_to_try = ["codellama:7b", "llama3.1:8b"]
                    elif task_type == "summarization":
                        models_to_try = ["mistral:7b", "llama3.1:8b"]
                    else:
                        models_to_try = ["llama3.1:8b", "llama3:8b"]
                
                # Try each model for this provider
                for model in models_to_try:
                    try:
                        print(f"DEBUG: Trying {provider_name} with model {model}")
                        
                        # Create a copy of the request with the selected model
                        request_copy = GenerateRequest(
                            prompt=request.prompt,
                            model=model,
                            max_tokens=request.max_tokens,
                            temperature=request.temperature
                        )
                        
                        response = await provider.generate(request_copy)
                        print(f"DEBUG: Success with {provider_name} using {model}")
                        return response
                        
                    except Exception as model_error:
                        print(f"DEBUG: Model {model} on {provider_name} failed: {model_error}")
                        continue
                
            except Exception as e:
                print(f"DEBUG: Provider {provider_name} completely failed: {e}")
                continue
        
        # If all providers failed, raise a comprehensive error
        available_providers = [name for name, provider in self.providers.items() if provider.is_available]
        raise Exception(f"All providers failed. Available providers: {available_providers}. Please check your API keys and network connection.")
    
    def get_available_models(self) -> List[dict]:
        """Get list of only confirmed working models across providers"""
        models = []
        
        # Only include confirmed working models
        confirmed_models = {
            "groq": [
                "llama-3.1-8b-instant",
                "gemma2-9b-it", 
                "llama3-8b-8192",
                "gemma-7b-it"
            ],
            "huggingface": [
                "microsoft/Phi-3-mini"
            ],
            "ollama": [
                "llama3.1:8b",
                "llama3:8b", 
                "mistral:7b",
                "gemma2:9b",
                "codellama:7b"
            ]
        }
        
        for provider_name, provider in self.providers.items():
            if provider.is_available and provider_name in confirmed_models:
                for model in confirmed_models[provider_name]:
                    models.append({
                        "name": model,
                        "provider": provider_name,
                        "is_local": provider.is_local,
                        "is_available": True
                    })
        
        return models
    
    async def health_check(self) -> dict:
        """Check health of all providers"""
        health_status = {}
        
        for provider_name, provider in self.providers.items():
            try:
                is_healthy = await provider.health_check()
                health_status[provider_name] = {
                    "status": "healthy" if is_healthy else "unhealthy",
                    "is_local": provider.is_local,
                    "models": provider.get_models()
                }
            except Exception as e:
                health_status[provider_name] = {
                    "status": "error",
                    "error": str(e),
                    "is_local": provider.is_local,
                    "models": []
                }
        
        return health_status







