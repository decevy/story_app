// src/contexts/StoryContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { storiesApi } from '../api/stories.api';
import { signalRService } from '../services/signalr.services';
import {
  StorySummary,
  Story,
  Passage,
  PassageSegmentInput,
  Seam,
} from '../types/story.types';
import { useAuth } from './AuthContext';

interface StoryContextType {
  stories: StorySummary[];
  currentStory: Story | null;
  passages: Passage[];
  lastPassage: Passage | null;
  isLoading: boolean;
  isConnected: boolean;

  loadStories: () => Promise<void>;
  selectStory: (storyId: number) => Promise<void>;
  sendPassage: (
    segments: PassageSegmentInput[],
    seamBefore?: Seam,
  ) => Promise<void>;
  leaveCurrentStory: () => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

interface StoryProviderProps {
  children: ReactNode;
}

export function StoryProvider({ children }: StoryProviderProps) {
  const { user } = useAuth();

  const [stories, setStories] = useState<StorySummary[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [lastPassage, setLastPassage] = useState<Passage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const currentStoryRef = useRef<Story | null>(null);
  useEffect(() => {
    currentStoryRef.current = currentStory;
  }, [currentStory]);

  const handleReceivePassage = useCallback((passage: Passage) => {
    console.log('New passage received:', passage);
    if (currentStoryRef.current?.id !== passage.storyId) {
      return;
    }
    setPassages((previousPassages) => [...previousPassages, passage]);
    setLastPassage(passage);
  }, []);

  const handleReconnecting = useCallback(() => {
    console.log('Reconnecting to SignalR');
    setIsConnected(false);
  }, []);

  const handleReconnected = useCallback(() => {
    console.log('Reconnected to SignalR');
    setIsConnected(true);
    if (currentStoryRef.current) {
      signalRService.joinStory(currentStoryRef.current.id)
        .catch(error => console.error('Failed to rejoin story:', error));
    }
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('Disconnected from SignalR');
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    await signalRService.connect({
      onReceivePassage: handleReceivePassage,
      onReconnecting: handleReconnecting,
      onReconnected: handleReconnected,
      onDisconnected: handleDisconnected,
    });
  }, [handleReceivePassage, handleReconnecting, handleReconnected, handleDisconnected]);

  const loadStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await storiesApi.getUserStories();
      setStories(data);
      console.log('Loaded stories:', data.length);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const initializeConnection = async () => {
      try {
        await connect();
        setIsConnected(true);
        loadStories();
      } catch (error) {
        console.error('SignalR Connection Failed:', error);
      }
    };
    void initializeConnection();

    return () => {
      signalRService.disconnect().catch(console.error);
    };
  }, [user, connect, loadStories]);

  const selectStory = useCallback(async (storyId: number) => {
    setIsLoading(true);
    try {
      if (!signalRService.isConnected()) {
        await connect();
      }

      if (currentStory) {
        await signalRService.leaveStory(currentStory.id);
      }

      const [storyData, passagesData] = await Promise.all([
        storiesApi.getStory(storyId),
        storiesApi.getStoryPassages(storyId, 1, 50),
      ]);

      await signalRService.joinStory(storyId);

      setCurrentStory(storyData);
      setPassages(passagesData.items);
      const last = passagesData.items.length > 0 ? passagesData.items[passagesData.items.length - 1]! : null;
      setLastPassage(last);

      console.log(`Joined story: ${storyData.id}`);
    } catch (error) {
      console.error(`Failed to select story ${storyId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [currentStory, connect]);

  const sendPassage = useCallback(async (
    segments: PassageSegmentInput[],
    seamBefore?: Seam,
  ) => {
    if (!currentStory || segments.length === 0) {
      return;
    }

    const hasText = segments.some((segment) => segment.text.trim().length > 0);
    if (!hasText) {
      return;
    }

    try {
      await signalRService.sendPassage(currentStory.id, segments, seamBefore);
      console.log(`Passage sent in story ${currentStory.id}`);
    } catch (error) {
      console.error(`Failed to send passage in story ${currentStory.id}:`, error);
      throw error;
    }
  }, [currentStory]);

  const leaveCurrentStory = useCallback(async () => {
    if (!currentStory) {
      return;
    }

    try {
      await signalRService.leaveStory(currentStory.id);
      setCurrentStory(null);
      setPassages([]);
      setLastPassage(null);
      console.log(`Left story: ${currentStory.id}`);
    } catch (error) {
      console.error(`Failed to leave story ${currentStory.id}:`, error);
    }
  }, [currentStory]);

  const value: StoryContextType = {
    stories,
    currentStory,
    passages,
    lastPassage,
    isLoading,
    isConnected,
    loadStories,
    selectStory,
    sendPassage,
    leaveCurrentStory,
  };

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStory(): StoryContextType {
  const context = useContext(StoryContext);

  if (context === undefined) {
    throw new Error('useStory must be used within a StoryProvider');
  }

  return context;
}
