// src/contexts/StoryContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { storiesApi } from '../api/stories.api';
import { signalRService } from '../services/signalr.services';
import { StorySummary, Story, Turn } from '../types/story.types';
import { useAuth } from './AuthContext';

interface StoryContextType {
  stories: StorySummary[];
  currentStory: Story | null;
  turns: Turn[];
  lastTurn: Turn | null;
  isLoading: boolean;
  isConnected: boolean;

  loadStories: () => Promise<void>;
  selectStory: (storyId: number) => Promise<void>;
  sendTurn: (content: string) => Promise<void>;
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
  const [turns, setTurns] = useState<Turn[]>([]);
  const [lastTurn, setLastTurn] = useState<Turn | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const currentStoryRef = useRef<Story | null>(null);
  useEffect(() => {
    currentStoryRef.current = currentStory;
  }, [currentStory]);

  const handleReceiveTurn = useCallback((turn: Turn) => {
    console.log('New turn received:', turn);
    if (currentStoryRef.current?.id !== turn.storyId) {
      return;
    }
    setTurns(previousTurns => [...previousTurns, turn]);
    setLastTurn(turn);
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
      onReceiveTurn: handleReceiveTurn,
      onReconnecting: handleReconnecting,
      onReconnected: handleReconnected,
      onDisconnected: handleDisconnected,
    });
  }, [handleReceiveTurn, handleReconnecting, handleReconnected, handleDisconnected]);

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
    initializeConnection();

    return () => {
      signalRService.disconnect();
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

      const [storyData, turnsData] = await Promise.all([
        storiesApi.getStory(storyId),
        storiesApi.getStoryTurns(storyId, 1, 50)
      ]);

      await signalRService.joinStory(storyId);

      setCurrentStory(storyData);
      setTurns(turnsData.items);

      console.log(`Joined story: ${storyData.id}`);
    } catch (error) {
      console.error(`Failed to select story ${storyId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [currentStory, connect]);

  const sendTurn = useCallback(async (content: string) => {
    if (!currentStory || !content.trim())
      return;

    try {
      await signalRService.sendTurn(currentStory.id, content);
      console.log(`Turn sent in story ${currentStory.id}`);
    } catch (error) {
      console.error(`Failed to send turn in story ${currentStory.id}:`, error);
    }
  }, [currentStory]);

  const leaveCurrentStory = useCallback(async () => {
    if (!currentStory) return;

    try {
      await signalRService.leaveStory(currentStory.id);
      setCurrentStory(null);
      setTurns([]);
      console.log(`Left story: ${currentStory.id}`);
    } catch (error) {
      console.error(`Failed to leave story ${currentStory.id}:`, error);
    }
  }, [currentStory]);

  const value: StoryContextType = {
    stories,
    currentStory,
    turns,
    lastTurn,
    isLoading,
    isConnected,
    loadStories,
    selectStory,
    sendTurn,
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
