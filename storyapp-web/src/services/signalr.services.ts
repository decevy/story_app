// src/services/signalr.services.ts

import * as signalR from '@microsoft/signalr';
import { tokenService } from './token.service';
import config from '../config/env.config';
import { Beat, BeatSegmentInput, BeatTransition } from '../types/pulse.types';
import {
  PulseEvent,
  TypingIndicator,
  BeatEdited,
  BeatDeleted,
  UserStatusChanged,
} from '../types/signalr.types';

export type SignalREventHandlers = {
  onReceiveBeat?: (beat: Beat) => void;
  onBeatEdited?: (data: BeatEdited) => void;
  onBeatDeleted?: (data: BeatDeleted) => void;
  onUserJoinedPulse?: (data: PulseEvent) => void;
  onUserLeftPulse?: (data: PulseEvent) => void;
  onUserStartedTyping?: (data: TypingIndicator) => void;
  onUserStoppedTyping?: (data: TypingIndicator) => void;
  onUserStatusChanged?: (data: UserStatusChanged) => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onDisconnected?: () => void;
};

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private handlers: SignalREventHandlers = {};
  private connectionLock: Promise<void> = Promise.resolve();

  async connect(handlers: SignalREventHandlers): Promise<void> {
    this.connectionLock = this.connectionLock.then(async () => {
      if (this.connection?.state === signalR.HubConnectionState.Connected || this.connection?.state === signalR.HubConnectionState.Connecting) {
        return;
      }

      this.handlers = handlers;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(config.hubUrl, {
          accessTokenFactory: () => {
            const accessToken = tokenService.getAccessToken();
            if (!accessToken) {
              throw new Error('No access token available');
            }
            return accessToken;
          }
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupEventHandlers();

      try {
        await this.connection.start();
        console.log('SignalR Connection Started');
      } catch (error) {
        console.error('SignalR Connection Error:', error);
        throw error;
      }
    });
    return this.connectionLock;
  }

  async disconnect(): Promise<void> {
    this.connectionLock = this.connectionLock.then(async () => {
      if (this.connection !== null) {
        await this.connection.stop();
        this.connection = null;
      }
    });
    return this.connectionLock;
  }

  async joinPulse(pulseId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('JoinPulse', pulseId);
  }

  async leavePulse(pulseId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('LeavePulse', pulseId);
  }

  async sendBeat(
    pulseId: number,
    segments: BeatSegmentInput[],
    transitionOverride?: BeatTransition,
  ): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    if (transitionOverride == null) {
      await this.connection.invoke('SendBeat', pulseId, segments);
      return;
    }
    await this.connection.invoke('SendBeat', pulseId, segments, transitionOverride);
  }

  async editBeat(beatId: number, segments: BeatSegmentInput[]): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('EditBeat', beatId, segments);
  }

  async deleteBeat(beatId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('DeleteBeat', beatId);
  }

  async startTyping(pulseId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StartTyping', pulseId);
  }

  async stopTyping(pulseId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StopTyping', pulseId);
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('ReceiveBeat', (beat: Beat) => {
      this.handlers.onReceiveBeat?.(beat);
    });

    this.connection.on('BeatEdited', (data: BeatEdited) => {
      this.handlers.onBeatEdited?.(data);
    });

    this.connection.on('BeatDeleted', (data: BeatDeleted) => {
      this.handlers.onBeatDeleted?.(data);
    });

    this.connection.on('UserJoinedPulse', (data: PulseEvent) => {
      this.handlers.onUserJoinedPulse?.(data);
    });

    this.connection.on('UserLeftPulse', (data: PulseEvent) => {
      this.handlers.onUserLeftPulse?.(data);
    });

    this.connection.on('UserStartedTyping', (data: TypingIndicator) => {
      this.handlers.onUserStartedTyping?.(data);
    });

    this.connection.on('UserStoppedTyping', (data: TypingIndicator) => {
      this.handlers.onUserStoppedTyping?.(data);
    });

    this.connection.on('UserStatusChanged', (data: UserStatusChanged) => {
      this.handlers.onUserStatusChanged?.(data);
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR Reconnecting');
      this.handlers.onReconnecting?.();
    });

    this.connection.onreconnected(() => {
      console.log('SignalR Reconnected');
      this.handlers.onReconnected?.();
    });

    this.connection.onclose(() => {
      console.log('SignalR Disconnected');
      this.handlers.onDisconnected?.();
    });
  }
}

export const signalRService = new SignalRService();
