import type { User } from '../models/user';

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

/**
 * `/auth/me` returns only the identity. The signed-in user is online by definition, so presence
 * fields are filled in locally.
 */
export function currentUserToUser(current: CurrentUserResponse, now = new Date()): User {
  return {
    id: current.userId,
    username: current.username,
    email: current.email,
    isOnline: true,
    lastSeen: now.toISOString(),
  };
}
