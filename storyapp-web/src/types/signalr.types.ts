// src/types/signalr.types.ts

import { BeatSegment } from './pulse.types';

export interface PulseEvent {
  userId: number;
  username: string;
  pulseId: number;
  timestamp: string;
}

export interface TypingIndicator {
  userId: number;
  username?: string;
  pulseId: number;
  isTyping?: boolean;
}

export interface BeatEdited {
  id: number;
  segments: BeatSegment[];
  editedAt: string;
}

export interface BeatDeleted {
  id: number;
  pulseId: number;
}

export interface UserStatusChanged {
  userId: number;
  isOnline: boolean;
  lastSeen: string;
}
