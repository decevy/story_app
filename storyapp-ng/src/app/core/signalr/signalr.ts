import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';

import { AuthService } from '../../auth/auth';
import { APP_CONFIG } from '../config/app-config';
import {
  PassageDeleted,
  PassageEdited,
  StoryEvent,
  TypingIndicator,
  UserStatusChanged,
} from '../models/signalr.types';
import { Passage, PassageSegmentInput, Seam } from '../models/story.types';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

/** Port of storyapp-web/src/services/signalr.services.ts; handlers become observables. */
@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly config = inject(APP_CONFIG);
  private readonly auth = inject(AuthService);

  private connection: signalR.HubConnection | null = null;
  private connectionLock: Promise<void> = Promise.resolve();

  private readonly state = signal<ConnectionState>('disconnected');
  readonly connectionState = this.state.asReadonly();

  private readonly passageReceived = new Subject<Passage>();
  private readonly passageEdited = new Subject<PassageEdited>();
  private readonly passageDeleted = new Subject<PassageDeleted>();
  private readonly userJoinedStory = new Subject<StoryEvent>();
  private readonly userLeftStory = new Subject<StoryEvent>();
  private readonly userStartedTyping = new Subject<TypingIndicator>();
  private readonly userStoppedTyping = new Subject<TypingIndicator>();
  private readonly userStatusChanged = new Subject<UserStatusChanged>();
  private readonly reconnected = new Subject<void>();

  readonly passageReceived$: Observable<Passage> = this.passageReceived.asObservable();
  readonly passageEdited$: Observable<PassageEdited> = this.passageEdited.asObservable();
  readonly passageDeleted$: Observable<PassageDeleted> = this.passageDeleted.asObservable();
  readonly userJoinedStory$: Observable<StoryEvent> = this.userJoinedStory.asObservable();
  readonly userLeftStory$: Observable<StoryEvent> = this.userLeftStory.asObservable();
  readonly userStartedTyping$: Observable<TypingIndicator> = this.userStartedTyping.asObservable();
  readonly userStoppedTyping$: Observable<TypingIndicator> = this.userStoppedTyping.asObservable();
  readonly userStatusChanged$: Observable<UserStatusChanged> = this.userStatusChanged.asObservable();
  /** Emits after an automatic reconnect succeeds. */
  readonly reconnected$: Observable<void> = this.reconnected.asObservable();

  /** Starts the connection; calls are serialized with disconnect() (React connectionLock). */
  connect(): Promise<void> {
    return this.serialize(async () => {
      if (
        this.connection?.state === signalR.HubConnectionState.Connected ||
        this.connection?.state === signalR.HubConnectionState.Connecting
      ) {
        return;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.config.hubUrl, {
          accessTokenFactory: () => this.auth.getFreshAccessToken(),
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupEventHandlers(this.connection);

      try {
        await this.connection.start();
        this.state.set('connected');
        console.log('SignalR Connection Started');
      } catch (error) {
        console.error('SignalR Connection Error:', error);
        throw error;
      }
    });
  }

  disconnect(): Promise<void> {
    return this.serialize(async () => {
      if (this.connection !== null) {
        const connection = this.connection;
        this.connection = null;
        await connection.stop();
        this.state.set('disconnected');
      }
    });
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  async joinStory(storyId: number): Promise<void> {
    await this.requireConnection().invoke('JoinStory', storyId);
  }

  async leaveStory(storyId: number): Promise<void> {
    await this.requireConnection().invoke('LeaveStory', storyId);
  }

  async sendPassage(storyId: number, segments: PassageSegmentInput[], seamBefore?: Seam): Promise<void> {
    const connection = this.requireConnection();
    if (seamBefore == null) {
      await connection.invoke('SendPassage', storyId, segments);
      return;
    }
    await connection.invoke('SendPassage', storyId, segments, seamBefore);
  }

  async editPassage(passageId: number, segments: PassageSegmentInput[]): Promise<void> {
    await this.requireConnection().invoke('EditPassage', passageId, segments);
  }

  async deletePassage(passageId: number): Promise<void> {
    await this.requireConnection().invoke('DeletePassage', passageId);
  }

  async startTyping(storyId: number): Promise<void> {
    await this.requireConnection().invoke('StartTyping', storyId);
  }

  async stopTyping(storyId: number): Promise<void> {
    await this.requireConnection().invoke('StopTyping', storyId);
  }

  /**
   * Chains `task` after the previous connect/disconnect. Unlike the React lock, a failed
   * task does not poison the chain, so a later connect() can still run.
   */
  private serialize(task: () => Promise<void>): Promise<void> {
    const run = this.connectionLock.then(task);
    this.connectionLock = run.catch(() => undefined);
    return run;
  }

  private requireConnection(): signalR.HubConnection {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    return this.connection;
  }

  private setupEventHandlers(connection: signalR.HubConnection): void {
    connection.on('ReceivePassage', (passage: Passage) => this.passageReceived.next(passage));
    connection.on('PassageEdited', (data: PassageEdited) => this.passageEdited.next(data));
    connection.on('PassageDeleted', (data: PassageDeleted) => this.passageDeleted.next(data));
    connection.on('UserJoinedStory', (data: StoryEvent) => this.userJoinedStory.next(data));
    connection.on('UserLeftStory', (data: StoryEvent) => this.userLeftStory.next(data));
    connection.on('UserStartedTyping', (data: TypingIndicator) => this.userStartedTyping.next(data));
    connection.on('UserStoppedTyping', (data: TypingIndicator) => this.userStoppedTyping.next(data));
    connection.on('UserStatusChanged', (data: UserStatusChanged) => this.userStatusChanged.next(data));

    connection.onreconnecting(() => {
      console.log('SignalR Reconnecting');
      this.state.set('reconnecting');
    });

    connection.onreconnected(() => {
      console.log('SignalR Reconnected');
      this.state.set('connected');
      this.reconnected.next();
    });

    connection.onclose(() => {
      console.log('SignalR Disconnected');
      // Ignore close events from a connection that has already been replaced.
      if (this.connection === null || this.connection === connection) {
        this.state.set('disconnected');
      }
    });
  }
}
