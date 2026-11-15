import type { Passage, PassageSegment, PassageSegmentInput, Seam } from '../models/story';

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

/** Events the StoryHub sends to clients, by name, with their payload. */
export interface HubEvents {
  ReceivePassage: Passage;
  PassageEdited: PassageEdited;
  PassageDeleted: PassageDeleted;
  UserJoinedStory: StoryEvent;
  UserLeftStory: StoryEvent;
  UserStartedTyping: TypingIndicator;
  UserStoppedTyping: TypingIndicator;
  UserStatusChanged: UserStatusChanged;
}

export type HubEventName = keyof HubEvents;

// A record, so the compiler checks that every event is listed exactly once.
const HUB_EVENTS: Record<HubEventName, true> = {
  ReceivePassage: true,
  PassageEdited: true,
  PassageDeleted: true,
  UserJoinedStory: true,
  UserLeftStory: true,
  UserStartedTyping: true,
  UserStoppedTyping: true,
  UserStatusChanged: true,
};

/** Every event name, to register the handlers on a new connection. */
export const HUB_EVENT_NAMES = Object.keys(HUB_EVENTS) as HubEventName[];

/** Methods clients invoke on the StoryHub, by name, with their arguments. */
export interface HubMethods {
  JoinStory: [storyId: number];
  LeaveStory: [storyId: number];
  SendPassage: [storyId: number, segments: PassageSegmentInput[], seamBefore: Seam | null];
  EditPassage: [passageId: number, segments: PassageSegmentInput[]];
  DeletePassage: [passageId: number];
  StartTyping: [storyId: number];
  StopTyping: [storyId: number];
}
