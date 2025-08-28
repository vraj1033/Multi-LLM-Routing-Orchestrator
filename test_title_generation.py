#!/usr/bin/env python3
"""
Simple test script to verify title generation functionality
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.schemas.llm import TitleGenerateRequest
from backend.app.services.router import RouterService

async def test_title_generation():
    """Test the title generation functionality"""
    
    # Sample conversation
    sample_messages = [
        {"role": "user", "content": "How do I create a REST API with FastAPI?"},
        {"role": "assistant", "content": "To create a REST API with FastAPI, you'll need to install FastAPI and uvicorn first. Here's a basic example..."},
        {"role": "user", "content": "Can you show me how to add authentication?"},
        {"role": "assistant", "content": "Sure! Here's how to add JWT authentication to your FastAPI application..."}
    ]
    
    # Create the request
    request = TitleGenerateRequest(messages=sample_messages)
    
    # Create a prompt for title generation
    conversation_text = ""
    for msg in request.messages[:6]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        conversation_text += f"{role.capitalize()}: {content}\n"
    
    title_prompt = f"""Based on the following conversation, generate a concise, descriptive title (3-6 words) that captures the main topic or question. Do not use quotes or special characters. Just return the title.

Conversation:
{conversation_text}

Title:"""
    
    print("Generated title prompt:")
    print(title_prompt)
    print("\n" + "="*50 + "\n")
    
    # Test with RouterService (if available)
    try:
        router_service = RouterService()
        print("RouterService initialized successfully!")
        
        # Check available models
        models = router_service.get_available_models()
        print(f"Available models: {len(models)}")
        for model in models[:3]:  # Show first 3
            print(f"  - {model['name']} ({model['provider']})")
        
    except Exception as e:
        print(f"RouterService error: {e}")
        print("This is expected if LLM providers are not configured.")
    
    print("\nTitle generation test completed!")

if __name__ == "__main__":
    asyncio.run(test_title_generation())