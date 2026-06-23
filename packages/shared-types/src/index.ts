// Shared type definitions for I Am An Actuary

export type Role = 'student' | 'professional' | 'admin';

export type UserType = 'student' | 'actuary' | 'investor' | 'general_user';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  full_name: string;
  user_type: UserType;
}

export interface SignUpResponse {
  user_id: string;
  email: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user_id: string;
  email: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  user_type?: UserType;
}