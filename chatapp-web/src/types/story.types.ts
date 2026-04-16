// src/types/story.types.ts

import { User } from './auth.types';

export enum TurnType {
  Text = 0,
  Image = 1,
  File = 2,
  System = 3,
}

export interface Turn {
  id: number;
  content: string;
  user: User;
  storyId: number;
  createdAt: string;
  editedAt?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  type: TurnType;
  reactions: TurnReaction[];
}

export interface TurnReaction {
  emoji: string;
  users: User[];
  count: number;
}

export interface StoryMember {
  userId: number;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface Story {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  members: StoryMember[];
}

export interface StorySummary {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  memberCount: number;
  lastTurn?: Turn;
}

export interface CreateStoryRequest {
  name: string;
  description?: string;
  isPrivate: boolean;
}

export interface UpdateStoryRequest {
  name: string;
  description?: string;
}

export interface AddStoryMemberRequest {
  userId: number;
  isAdmin: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
