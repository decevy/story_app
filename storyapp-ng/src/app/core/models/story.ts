import type { User } from './user';

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

export function sortedPassageSegments(passage: Passage): PassageSegment[] {
  return [...passage.segments].sort((a, b) => a.order - b.order);
}

export function passageText(passage: Passage): string {
  return sortedPassageSegments(passage)
    .map((segment) => segment.text)
    .join('');
}

export function lastPassageSeam(passage: Passage): Seam | undefined {
  return sortedPassageSegments(passage).at(-1)?.seamAfter;
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
