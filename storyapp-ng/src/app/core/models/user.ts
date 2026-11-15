/** A user as embedded in stories, passages and auth responses. */
export interface User {
  id: number;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

/** `GET /users/me` and `GET /users/:id`. */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  isOnline: boolean;
  lastSeen: string | null;
}

/** `PUT /users/me`. */
export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

/** `GET /users/search?query=...`. */
export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
  isOnline: boolean;
}
