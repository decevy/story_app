// Test data builders shared by specs. Only spec files may import from src/testing.
import { User } from '../app/core/models/auth.types';
import { Passage, Story, StorySummary } from '../app/core/models/story.types';

export const testUser: User = {
  id: 1,
  username: 'aya',
  email: 'aya@test.com',
  isOnline: true,
  lastSeen: '',
};

export function makeStory(overrides: Partial<Story> = {}): Story {
  const id = overrides.id ?? 1;
  return {
    id,
    name: `Story ${id}`,
    isPrivate: false,
    creator: testUser,
    createdAt: '',
    writers: [],
    ...overrides,
  };
}

export function makeStorySummary(overrides: Partial<StorySummary> = {}): StorySummary {
  const id = overrides.id ?? 1;
  return {
    id,
    name: `Story ${id}`,
    isPrivate: false,
    creator: testUser,
    createdAt: '',
    writerCount: 1,
    ...overrides,
  };
}

/** A passage with one segment, `p<id> `, unless `segments` is given. */
export function makePassage(overrides: Partial<Passage> = {}): Passage {
  const id = overrides.id ?? 1;
  return {
    id,
    order: id,
    storyId: 1,
    user: testUser,
    createdAt: '',
    segments: [{ id, order: 0, text: `p${id} ` }],
    ...overrides,
  };
}
