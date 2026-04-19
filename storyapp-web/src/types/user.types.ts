// src/types/user.types.ts

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    isOnline: boolean;
    lastSeen: string | null;
  }
  
  export interface UpdateProfileRequest {
    username?: string;
    email?: string;
  }
  
  export interface UserSearchResult {
    id: number;
    username: string;
    email: string;
    isOnline: boolean;
  }