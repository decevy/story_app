// src/contexts/PulseContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { pulsesApi } from '../api/pulses.api';
import { signalRService } from '../services/signalr.services';
import {
  PulseSummary,
  Pulse,
  Beat,
  BeatSegmentInput,
  BeatTransition,
} from '../types/pulse.types';
import { useAuth } from './AuthContext';

interface PulseContextType {
  pulses: PulseSummary[];
  currentPulse: Pulse | null;
  beats: Beat[];
  lastBeat: Beat | null;
  isLoading: boolean;
  isConnected: boolean;

  loadPulses: () => Promise<void>;
  selectPulse: (pulseId: number) => Promise<void>;
  sendBeat: (
    segments: BeatSegmentInput[],
    transitionOverride?: BeatTransition,
  ) => Promise<void>;
  leaveCurrentPulse: () => Promise<void>;
}

const PulseContext = createContext<PulseContextType | undefined>(undefined);

interface PulseProviderProps {
  children: ReactNode;
}

export function PulseProvider({ children }: PulseProviderProps) {
  const { user } = useAuth();

  const [pulses, setPulses] = useState<PulseSummary[]>([]);
  const [currentPulse, setCurrentPulse] = useState<Pulse | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [lastBeat, setLastBeat] = useState<Beat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const currentPulseRef = useRef<Pulse | null>(null);
  useEffect(() => {
    currentPulseRef.current = currentPulse;
  }, [currentPulse]);

  const handleReceiveBeat = useCallback((beat: Beat) => {
    console.log('New beat received:', beat);
    if (currentPulseRef.current?.id !== beat.pulseId) {
      return;
    }
    setBeats((previousBeats) => [...previousBeats, beat]);
    setLastBeat(beat);
  }, []);

  const handleReconnecting = useCallback(() => {
    console.log('Reconnecting to SignalR');
    setIsConnected(false);
  }, []);

  const handleReconnected = useCallback(() => {
    console.log('Reconnected to SignalR');
    setIsConnected(true);
    if (currentPulseRef.current) {
      signalRService.joinPulse(currentPulseRef.current.id)
        .catch(error => console.error('Failed to rejoin pulse:', error));
    }
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('Disconnected from SignalR');
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    await signalRService.connect({
      onReceiveBeat: handleReceiveBeat,
      onReconnecting: handleReconnecting,
      onReconnected: handleReconnected,
      onDisconnected: handleDisconnected,
    });
  }, [handleReceiveBeat, handleReconnecting, handleReconnected, handleDisconnected]);

  const loadPulses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await pulsesApi.getUserPulses();
      setPulses(data);
      console.log('Loaded pulses:', data.length);
    } catch (error) {
      console.error('Failed to load pulses:', error);
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
        loadPulses();
      } catch (error) {
        console.error('SignalR Connection Failed:', error);
      }
    };
    void initializeConnection();

    return () => {
      signalRService.disconnect().catch(console.error);
    };
  }, [user, connect, loadPulses]);

  const selectPulse = useCallback(async (pulseId: number) => {
    setIsLoading(true);
    try {
      if (!signalRService.isConnected()) {
        await connect();
      }

      if (currentPulse) {
        await signalRService.leavePulse(currentPulse.id);
      }

      const [pulseData, beatsData] = await Promise.all([
        pulsesApi.getPulse(pulseId),
        pulsesApi.getPulseBeats(pulseId, 1, 50),
      ]);

      await signalRService.joinPulse(pulseId);

      setCurrentPulse(pulseData);
      setBeats(beatsData.items);
      const last = beatsData.items.length > 0 ? beatsData.items[beatsData.items.length - 1]! : null;
      setLastBeat(last);

      console.log(`Joined pulse: ${pulseData.id}`);
    } catch (error) {
      console.error(`Failed to select pulse ${pulseId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPulse, connect]);

  const sendBeat = useCallback(async (
    segments: BeatSegmentInput[],
    transitionOverride?: BeatTransition,
  ) => {
    if (!currentPulse || segments.length === 0) {
      return;
    }

    const hasText = segments.some((segment) => segment.text.trim().length > 0);
    if (!hasText) {
      return;
    }

    try {
      await signalRService.sendBeat(currentPulse.id, segments, transitionOverride);
      console.log(`Beat sent in pulse ${currentPulse.id}`);
    } catch (error) {
      console.error(`Failed to send beat in pulse ${currentPulse.id}:`, error);
      throw error;
    }
  }, [currentPulse]);

  const leaveCurrentPulse = useCallback(async () => {
    if (!currentPulse) {
      return;
    }

    try {
      await signalRService.leavePulse(currentPulse.id);
      setCurrentPulse(null);
      setBeats([]);
      setLastBeat(null);
      console.log(`Left pulse: ${currentPulse.id}`);
    } catch (error) {
      console.error(`Failed to leave pulse ${currentPulse.id}:`, error);
    }
  }, [currentPulse]);

  const value: PulseContextType = {
    pulses,
    currentPulse,
    beats,
    lastBeat,
    isLoading,
    isConnected,
    loadPulses,
    selectPulse,
    sendBeat,
    leaveCurrentPulse,
  };

  return (
    <PulseContext.Provider value={value}>
      {children}
    </PulseContext.Provider>
  );
}

export function usePulse(): PulseContextType {
  const context = useContext(PulseContext);

  if (context === undefined) {
    throw new Error('usePulse must be used within a PulseProvider');
  }

  return context;
}
