"""Auth API routes — signup, login, profile CRUD."""

from fastapi import APIRouter, Depends, Header
from gotrue import User as GoTrueUser

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SignUpRequest,
    SignUpResponse,
    UpdateProfileRequest,
    UserProfileResponse,
)
from app.services.auth import (
    get_profile,
    get_user_by_token,
    login,
    signup,
    update_profile,
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _require_user(authorization: str = Header(...)) -> GoTrueUser:
    """Dependency: extract & validate Bearer token, return Supabase user."""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    return await get_user_by_token(token)


@router.post("/signup", response_model=SignUpResponse, status_code=201)
async def signup_route(req: SignUpRequest) -> SignUpResponse:
    return await signup(req)


@router.post("/login", response_model=LoginResponse)
async def login_route(req: LoginRequest) -> LoginResponse:
    return await login(req)


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(user: GoTrueUser = Depends(_require_user)) -> UserProfileResponse:
    return await get_profile(user.id)


@router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(
    req: UpdateProfileRequest,
    user: GoTrueUser = Depends(_require_user),
) -> UserProfileResponse:
    return await update_profile(user.id, req)