// src/types/auth.types.ts

export interface User {
  id: number;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CurrentUserResponse {
  userId: number;
  username: string;
  email: string;
}