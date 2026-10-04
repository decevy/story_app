// src/types/pulse.types.ts

import { User } from './auth.types';

export enum BeatTransition {
  SameParagraph = 0,
  NewParagraph = 1,
  NewSection = 2,
  NewSectionMajor = 3,
  NewChapter = 4,
}

export interface BeatSegment {
  id: number;
  order: number;
  text: string;
  transitionAfter?: BeatTransition;
}

/** Payload for SendBeat / EditBeat hub calls (no server-assigned id). */
export interface BeatSegmentInput {
  order: number;
  text: string;
  transitionAfter?: BeatTransition;
}

export interface Beat {
  id: number;
  order: number;
  transitionOverride?: BeatTransition;
  segments: BeatSegment[];
  user: User;
  pulseId: number;
  createdAt: string;
  editedAt?: string;
}

export function beatText(beat: Beat): string {
  return [...beat.segments]
    .sort((a, b) => a.order - b.order)
    .map((segment) => segment.text)
    .join('');
}

export function sortedBeatSegments(beat: Beat): BeatSegment[] {
  return [...beat.segments].sort((a, b) => a.order - b.order);
}

export function lastBeatEndsWithStructuralBreak(beat: Beat): boolean {
  const segments = sortedBeatSegments(beat);
  const last = segments[segments.length - 1];
  return (
    last?.transitionAfter === BeatTransition.NewParagraph ||
    last?.transitionAfter === BeatTransition.NewSection ||
    last?.transitionAfter === BeatTransition.NewSectionMajor ||
    last?.transitionAfter === BeatTransition.NewChapter
  );
}

export function lastBeatSegmentTransition(beat: Beat): BeatTransition | undefined {
  const segments = sortedBeatSegments(beat);
  return segments[segments.length - 1]?.transitionAfter;
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
