"""Chat-related Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CreateConversationRequest(BaseModel):
    title: str = Field(default="New Conversation", max_length=200)


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str  # 'user' | 'assistant' | 'system'
    content: str
    created_at: Optional[datetime] = None


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)


class SendMessageResponse(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse


class ConversationListResponse(BaseModel):
    conversations: list[ConversationResponse]


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]