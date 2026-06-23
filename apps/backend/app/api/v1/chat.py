"""Chat API routes — CRUD for conversations & messages + streaming."""

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from gotrue import User as GoTrueUser

from app.schemas.chat import (
    ConversationListResponse,
    ConversationResponse,
    CreateConversationRequest,
    MessageListResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.auth import get_user_by_token
from app.services.chat import (
    create_conversation,
    get_conversation,
    list_conversations,
    list_messages,
    send_message,
    stream_message,
)

router = APIRouter(prefix="/chat", tags=["chat"])


async def _require_user(authorization: str = Header(...)) -> GoTrueUser:
    """Dependency: extract & validate Bearer token."""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    return await get_user_by_token(token)


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation_route(
    req: CreateConversationRequest,
    user: GoTrueUser = Depends(_require_user),
) -> ConversationResponse:
    return await create_conversation(user.id, req)


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations_route(
    user: GoTrueUser = Depends(_require_user),
) -> ConversationListResponse:
    convs = await list_conversations(user.id)
    return ConversationListResponse(conversations=convs)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation_route(
    conversation_id: str,
    user: GoTrueUser = Depends(_require_user),
) -> ConversationResponse:
    return await get_conversation(conversation_id, user.id)


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessageListResponse,
)
async def list_messages_route(
    conversation_id: str,
    user: GoTrueUser = Depends(_require_user),
) -> MessageListResponse:
    msgs = await list_messages(conversation_id, user.id)
    return MessageListResponse(messages=msgs)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=SendMessageResponse,
)
async def send_message_route(
    conversation_id: str,
    req: SendMessageRequest,
    user: GoTrueUser = Depends(_require_user),
) -> SendMessageResponse:
    return await send_message(user.id, conversation_id, req)


@router.post(
    "/conversations/{conversation_id}/messages/stream",
)
async def stream_message_route(
    conversation_id: str,
    req: SendMessageRequest,
    user: GoTrueUser = Depends(_require_user),
):
    """Stream an AI response as server-sent events (SSE)."""
    generator = stream_message(user.id, conversation_id, req)

    async def event_stream():
        async for chunk in generator:
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )