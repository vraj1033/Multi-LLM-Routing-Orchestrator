import httpx
import asyncio
from typing import Optional
from ..core.config import settings


class ImageSummarizerService:
    """Summarize images (image captioning) using Hugging Face Inference API."""

    def __init__(self):
        # Prefer a strong captioning model; fallback if needed
        self.default_model = "Salesforce/blip-image-captioning-large"
        self.fallback_model = "nlpconnect/vit-gpt2-image-captioning"
        self.api_key = settings.huggingface_api_key
        self.base_url = "https://api-inference.huggingface.co/models"

    async def summarize_image(self, image_bytes: bytes, model: Optional[str] = None) -> tuple[str, str]:
        if not self.api_key:
            raise Exception("Hugging Face API key not configured")

        chosen_model = model or self.default_model
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            # Ensure model is warm and loaded
            try:
                status_resp = await client.get(
                    f"https://api-inference.huggingface.co/status/{chosen_model}",
                    headers=headers,
                )
                if status_resp.status_code == 200:
                    data = status_resp.json()
                    # If not loaded, ping a few times to warm up
                    if not data.get("loaded", False):
                        for i in range(5):
                            await asyncio.sleep(0.8 * (i + 1))
                            await client.get(
                                f"https://api-inference.huggingface.co/status/{chosen_model}",
                                headers=headers,
                            )
            except Exception:
                # Non-blocking if status endpoint fails
                pass

            # Try primary model
            response = await client.post(
                f"{self.base_url}/{chosen_model}",
                content=image_bytes,
                headers={**headers, "Content-Type": "application/octet-stream"},
            )

            # Handle model loading (HF returns 503 with 'Loading')
            if response.status_code in (503, 524):
                # Poll until model is ready (limited attempts)
                for _ in range(6):
                    await client.post(f"{self.base_url}/{chosen_model}", headers=headers, json={"inputs": "ping"})
                # Retry actual request
                response = await client.post(
                    f"{self.base_url}/{chosen_model}",
                    content=image_bytes,
                    headers={**headers, "Content-Type": "application/octet-stream"},
                )

            if response.status_code != 200 and chosen_model != self.fallback_model:
                # Retry with fallback
                response = await client.post(
                    f"{self.base_url}/{self.fallback_model}",
                    content=image_bytes,
                    headers={**headers, "Content-Type": "application/octet-stream"},
                )
                chosen_model = self.fallback_model

            if response.status_code != 200:
                try:
                    detail = response.json().get("error", response.text)
                except Exception:
                    detail = response.text
                # Provide friendlier hints
                if "authorization" in detail.lower() or "Unauthorized" in detail:
                    detail = "Hugging Face authorization failed. Check HUGGINGFACE_API_KEY."
                elif "loading" in detail.lower() or "currently loading" in detail.lower():
                    detail = "Model is loading. Please retry in a few seconds."
                raise Exception(f"Image captioning failed: {detail}")

            result = response.json()
            # HF returns a list of {generated_text: str}
            if isinstance(result, list) and result:
                generated = result[0].get("generated_text") or result[0].get("summary_text")
                if generated:
                    return generated, chosen_model

            # Fallback parsing
            return str(result), chosen_model


