"use client";

import type {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  UpdateProfileRequest,
  UserProfile,
} from "@repo/shared-types";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL || "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function signUp(data: SignUpRequest): Promise<SignUpResponse> {
  return request<SignUpResponse>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProfile(token: string): Promise<UserProfile> {
  return request<UserProfile>("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateProfile(
  token: string,
  data: UpdateProfileRequest
): Promise<UserProfile> {
  return request<UserProfile>("/api/v1/auth/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<void> {
  // Frontend-side logout is handled by clearing the Supabase session
  // and the local auth store. No server endpoint needed.
}