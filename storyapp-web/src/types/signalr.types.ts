// src/types/signalr.types.ts

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

export interface TurnEdited {
  id: number;
  content: string;
  editedAt: string;
}

export interface TurnDeleted {
  id: number;
  storyId: number;
}

export interface UserStatusChanged {
  userId: number;
  isOnline: boolean;
  lastSeen: string;
}
