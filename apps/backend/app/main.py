from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router

app = FastAPI(
    title="I Am An Actuary API",
    version="0.1.0",
    description="AI-powered actuarial platform backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://iamanactuary.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["health"])
app.include_router(auth_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "I Am An Actuary API", "version": "0.1.0"}