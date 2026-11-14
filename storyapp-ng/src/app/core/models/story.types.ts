// src/app/core/models/story.types.ts

import { User } from './auth.types';

export enum Seam {
  Inline = 0,
  Paragraph = 1,
  Section = 2,
  MajorSection = 3,
  Chapter = 4,
}

export interface PassageSegment {
  id: number;
  order: number;
  text: string;
  seamAfter?: Seam;
}

/** Payload for SendPassage / EditPassage hub calls (no server-assigned id). */
export interface PassageSegmentInput {
  order: number;
  text: string;
  seamAfter?: Seam;
}

export interface Passage {
  id: number;
  order: number;
  seamBefore?: Seam;
  segments: PassageSegment[];
  user: User;
  storyId: number;
  createdAt: string;
  editedAt?: string;
}

export function passageText(passage: Passage): string {
  return [...passage.segments]
    .sort((a, b) => a.order - b.order)
    .map((segment) => segment.text)
    .join('');
}

export function sortedPassageSegments(passage: Passage): PassageSegment[] {
  return [...passage.segments].sort((a, b) => a.order - b.order);
}

export function lastPassageEndsWithStructuralSeam(passage: Passage): boolean {
  const segments = sortedPassageSegments(passage);
  const last = segments[segments.length - 1];
  return (
    last?.seamAfter === Seam.Paragraph ||
    last?.seamAfter === Seam.Section ||
    last?.seamAfter === Seam.MajorSection ||
    last?.seamAfter === Seam.Chapter
  );
}

export function lastPassageSeam(passage: Passage): Seam | undefined {
  const segments = sortedPassageSegments(passage);
  return segments[segments.length - 1]?.seamAfter;
}

export interface Writer {
  userId: number;
  username: string;
  email: string;
  joinedAt: string;
}

export interface Story {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  writers: Writer[];
}

export interface StorySummary {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  writerCount: number;
  lastPassage?: Passage;
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

export interface AddWriterRequest {
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
