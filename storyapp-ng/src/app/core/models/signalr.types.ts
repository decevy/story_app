// src/app/core/models/signalr.types.ts

import { PassageSegment } from './story.types';

export interface StoryEvent {
  userId: number;
  username: string;
  storyId: number;
  timestamp: string;
}

export interface TypingIndicator {
  userId: number;
  username?: string;
  storyId: number;
  isTyping?: boolean;
}

export interface PassageEdited {
  id: number;
  segments: PassageSegment[];
  editedAt: string;
}

export interface PassageDeleted {
  id: number;
  storyId: number;
}

export interface UserStatusChanged {
  userId: number;
  isOnline: boolean;
  lastSeen: string;
}
