"""Auth service — wraps Supabase Auth + profile CRUD."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from gotrue import User as GoTrueUser

from app.core.supabase import get_supabase_admin
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SignUpRequest,
    SignUpResponse,
    UpdateProfileRequest,
    UserProfileResponse,
    UserType,
)


def _profile_from_row(row: dict) -> UserProfileResponse:
    return UserProfileResponse(
        id=row["id"],
        email=row["email"],
        full_name=row["full_name"],
        user_type=UserType(row["user_type"]),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


async def signup(req: SignUpRequest) -> SignUpResponse:
    """Create a new user via Supabase Auth and insert a profile row."""
    sb = get_supabase_admin()

    # 1. Create auth user
    auth_response = sb.auth.admin.create_user(
        {
            "email": req.email,
            "password": req.password,
            "email_confirm": True,  # auto-confirm for dev; change in prod
        }
    )
    user: GoTrueUser = auth_response.user
    if not user or not user.id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    # 2. Insert profile row
    now = datetime.now(timezone.utc).isoformat()
    profile_data = {
        "id": user.id,
        "email": req.email,
        "full_name": req.full_name,
        "user_type": req.user_type.value,
        "created_at": now,
        "updated_at": now,
    }
    sb.table("profiles").insert(profile_data).execute()

    return SignUpResponse(user_id=user.id, email=req.email)


async def login(req: LoginRequest) -> LoginResponse:
    """Sign in with email & password via Supabase Auth."""
    sb = get_supabase_admin()
    try:
        auth_response = sb.auth.sign_in_with_password(
            {"email": req.email, "password": req.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        ) from exc

    session = auth_response.session
    if not session or not session.access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )

    return LoginResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user_id=auth_response.user.id,
        email=req.email,
    )


async def get_profile(user_id: str) -> UserProfileResponse:
    """Fetch the profile for a given user ID."""
    sb = get_supabase_admin()
    result = (
        sb.table("profiles")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    return _profile_from_row(rows[0])


async def update_profile(
    user_id: str, req: UpdateProfileRequest
) -> UserProfileResponse:
    """Update profile fields for the given user."""
    sb = get_supabase_admin()
    updates: dict = {}
    if req.full_name is not None:
        updates["full_name"] = req.full_name
    if req.user_type is not None:
        updates["user_type"] = req.user_type.value
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    if updates:
        sb.table("profiles").update(updates).eq("id", user_id).execute()

    return await get_profile(user_id)


async def get_user_by_token(access_token: str) -> GoTrueUser:
    """Validate an access token and return the Supabase user."""
    sb = get_supabase_admin()
    try:
        auth_response = sb.auth.get_user(access_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
    return auth_response.user