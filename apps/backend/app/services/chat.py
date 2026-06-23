"""Chat service — conversation & message CRUD + AI streaming."""

from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import HTTPException, status

from app.core.supabase import get_supabase_admin
from app.models.llm import get_llm_provider
from app.schemas.chat import (
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
    SendMessageRequest,
    SendMessageResponse,
)


SYSTEM_PROMPT = (
    "You are an expert actuarial assistant. "
    "Answer questions clearly and concisely. "
    "Use plain language and provide examples where helpful."
)


def _conversation_from_row(row: dict) -> ConversationResponse:
    return ConversationResponse(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def _message_from_row(row: dict) -> MessageResponse:
    return MessageResponse(
        id=row["id"],
        conversation_id=row["conversation_id"],
        role=row["role"],
        content=row["content"],
        created_at=row.get("created_at"),
    )


async def create_conversation(
    user_id: str, req: CreateConversationRequest
) -> ConversationResponse:
    sb = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "user_id": user_id,
        "title": req.title,
        "created_at": now,
        "updated_at": now,
    }
    result = sb.table("conversations").insert(data).execute()
    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation",
        )
    return _conversation_from_row(rows[0])


async def list_conversations(user_id: str) -> list[ConversationResponse]:
    sb = get_supabase_admin()
    result = (
        sb.table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return [_conversation_from_row(r) for r in result.data]


async def get_conversation(
    conversation_id: str, user_id: str
) -> ConversationResponse:
    sb = get_supabase_admin()
    result = (
        sb.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return _conversation_from_row(rows[0])


async def list_messages(
    conversation_id: str, user_id: str
) -> list[MessageResponse]:
    # Verify ownership first
    await get_conversation(conversation_id, user_id)

    sb = get_supabase_admin()
    result = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", asc=True)
        .execute()
    )
    return [_message_from_row(r) for r in result.data]


async def send_message(
    user_id: str,
    conversation_id: str,
    req: SendMessageRequest,
) -> SendMessageResponse:
    """Save user message, call LLM, save assistant reply, return both."""
    # 1. Verify conversation ownership
    conv = await get_conversation(conversation_id, user_id)

    sb = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()

    # 2. Insert user message
    user_msg_data = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": req.content,
        "created_at": now,
    }
    user_result = sb.table("messages").insert(user_msg_data).execute()
    user_msg = _message_from_row(user_result.data[0])

    # 3. Build message history for LLM
    history_result = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", asc=True)
        .execute()
    )
    llm_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in history_result.data
    ]

    # 4. Call LLM
    provider = get_llm_provider()
    full_response = ""
    async for chunk in provider.generate_stream(SYSTEM_PROMPT, llm_messages):
        full_response += chunk

    # 5. Insert assistant message
    assistant_data = {
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": full_response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    assistant_result = sb.table("messages").insert(assistant_data).execute()
    assistant_msg = _message_from_row(assistant_result.data[0])

    # 6. Update conversation title if it's the first user message
    if conv.title == "New Conversation":
        new_title = req.content[:80] + ("..." if len(req.content) > 80 else "")
        sb.table("conversations").update(
            {"title": new_title, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", conversation_id).execute()

    return SendMessageResponse(
        user_message=user_msg,
        assistant_message=assistant_msg,
    )


async def stream_message(
    user_id: str,
    conversation_id: str,
    req: SendMessageRequest,
) -> AsyncGenerator[str, None]:
    """Save user message, then stream LLM response chunk-by-chunk as SSE."""
    # 1. Verify ownership
    conv = await get_conversation(conversation_id, user_id)

    sb = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()

    # 2. Insert user message
    user_msg_data = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": req.content,
        "created_at": now,
    }
    sb.table("messages").insert(user_msg_data).execute()

    # 3. Build history
    history_result = (
        sb.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", asc=True)
        .execute()
    )
    llm_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in history_result.data
    ]

    # 4. Stream from LLM
    provider = get_llm_provider()
    full_response = ""
    async for chunk in provider.generate_stream(SYSTEM_PROMPT, llm_messages):
        full_response += chunk
        yield chunk

    # 5. Save assistant message after streaming completes
    assistant_data = {
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": full_response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    sb.table("messages").insert(assistant_data).execute()

    # 6. Update title if first message
    if conv.title == "New Conversation":
        new_title = req.content[:80] + ("..." if len(req.content) > 80 else "")
        sb.table("conversations").update(
            {"title": new_title, "updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", conversation_id).execute()