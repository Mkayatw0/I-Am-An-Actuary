"""Model router abstraction — pluggable LLM providers.

Each provider implements `generate_stream` which yields content chunks.
Currently only Qwen3 is implemented as the temporary model.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator

import httpx

from app.core.config import settings


class LLMProvider(ABC):
    """Abstract base for an LLM provider."""

    @abstractmethod
    async def generate_stream(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """Stream a response.

        Args:
            system_prompt: System-level instruction.
            messages: List of {role, content} dicts (user/assistant history).

        Yields:
            Content chunks as they are generated.
        """
        ...


class Qwen3Provider(LLMProvider):
    """Qwen3 via OpenAI-compatible API."""

    def __init__(self) -> None:
        self.api_key = settings.QWEN3_API_KEY
        self.api_url = settings.QWEN3_API_URL.rstrip("/")
        self.model = settings.QWEN3_MODEL

    async def generate_stream(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages,
            ],
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{self.api_url}/chat/completions",
                headers=headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data: "):
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            break
                        import json

                        try:
                            chunk = json.loads(data)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue


def get_llm_provider() -> LLMProvider:
    """Return the configured LLM provider."""
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "qwen3":
        return Qwen3Provider()
    # Future: add AnthropicProvider, OpenAIProvider, etc.
    raise ValueError(f"Unknown LLM provider: {provider_name}")