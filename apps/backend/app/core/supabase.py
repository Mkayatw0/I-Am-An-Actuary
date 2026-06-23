"""Supabase admin client for backend operations."""

from supabase import create_client, Client

from app.core.config import settings


_supabase_admin: Client | None = None


def get_supabase_admin() -> Client:
    """Return a singleton Supabase admin client (service-role)."""
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )
    return _supabase_admin