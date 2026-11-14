// src/services/signalr.services.ts

import * as signalR from '@microsoft/signalr';
import { tokenService } from './token.service';
import config from '../config/env.config';
import { Passage, PassageSegmentInput, Seam } from '../types/story.types';
import {
  StoryEvent,
  TypingIndicator,
  PassageEdited,
  PassageDeleted,
  UserStatusChanged,
} from '../types/signalr.types';

export type SignalREventHandlers = {
  onReceivePassage?: (passage: Passage) => void;
  onPassageEdited?: (data: PassageEdited) => void;
  onPassageDeleted?: (data: PassageDeleted) => void;
  onUserJoinedStory?: (data: StoryEvent) => void;
  onUserLeftStory?: (data: StoryEvent) => void;
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

  async joinStory(storyId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('JoinStory', storyId);
  }

  async leaveStory(storyId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('LeaveStory', storyId);
  }

  async sendPassage(
    storyId: number,
    segments: PassageSegmentInput[],
    seamBefore?: Seam,
  ): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    if (seamBefore == null) {
      await this.connection.invoke('SendPassage', storyId, segments);
      return;
    }
    await this.connection.invoke('SendPassage', storyId, segments, seamBefore);
  }

  async editPassage(passageId: number, segments: PassageSegmentInput[]): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('EditPassage', passageId, segments);
  }

  async deletePassage(passageId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('DeletePassage', passageId);
  }

  async startTyping(storyId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StartTyping', storyId);
  }

  async stopTyping(storyId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StopTyping', storyId);
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('ReceivePassage', (passage: Passage) => {
      this.handlers.onReceivePassage?.(passage);
    });

    this.connection.on('PassageEdited', (data: PassageEdited) => {
      this.handlers.onPassageEdited?.(data);
    });

    this.connection.on('PassageDeleted', (data: PassageDeleted) => {
      this.handlers.onPassageDeleted?.(data);
    });

    this.connection.on('UserJoinedStory', (data: StoryEvent) => {
      this.handlers.onUserJoinedStory?.(data);
    });

    this.connection.on('UserLeftStory', (data: StoryEvent) => {
      this.handlers.onUserLeftStory?.(data);
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
