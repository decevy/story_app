// src/types/pulse.types.ts

import { User } from './auth.types';

export interface Beat {
  id: number;
  passage: string;
  user: User;
  pulseId: number;
  createdAt: string;
  editedAt?: string;
}

export interface Pacer {
  userId: number;
  username: string;
  email: string;
  joinedAt: string;
}

export interface Pulse {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  pacers: Pacer[];
}

export interface PulseSummary {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  pacerCount: number;
  lastBeat?: Beat;
}

export interface CreatePulseRequest {
  name: string;
  description?: string;
  isPrivate: boolean;
}

export interface UpdatePulseRequest {
  name: string;
  description?: string;
}

export interface AddPacerRequest {
  userId: number;
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
