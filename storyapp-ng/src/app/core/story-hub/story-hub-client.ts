import { computed, effect, inject, Injectable, Injector, signal, untracked } from '@angular/core';
import type { HubConnection } from '@microsoft/signalr';
import { filter, map, type Observable, Subject } from 'rxjs';

import { AuthService } from '../auth/auth-service';
import { APP_CONFIG } from '../config/app-config';
import { DEV_MODE } from '../config/dev-mode';
import { Logger } from '../logging/logger';
import type { PassageSegmentInput, Seam } from '../models/story';
import { HUB_EVENT_NAMES, type HubEventName, type HubEvents, type HubMethods } from './hub-events';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

interface HubEventMessage {
  event: HubEventName;
  payload: unknown;
}

/** Client for the StoryHub: the connection, typed hub events and typed hub methods. */
@Injectable({ providedIn: 'root' })
export class StoryHubClient {
  private readonly config = inject(APP_CONFIG);
  private readonly auth = inject(AuthService);
  private readonly logger = inject(Logger);
  private readonly injector = inject(Injector);
  private readonly devMode = inject(DEV_MODE);

  private connection: HubConnection | null = null;
  private connectionLock: Promise<void> = Promise.resolve();

  private readonly state = signal<ConnectionState>('disconnected');
  readonly connectionState = this.state.asReadonly();
  /** 'reconnecting' counts as not connected. */
  readonly isConnected = computed(() => this.state() === 'connected');

  private readonly events = new Subject<HubEventMessage>();

  /** Payloads of one hub event, e.g. `on('ReceivePassage')`. Survives reconnects. */
  on<K extends HubEventName>(event: K): Observable<HubEvents[K]> {
    return this.events.pipe(
      filter((message) => message.event === event),
      // registerHandlers() pairs each payload with the event it came from.
      map((message) => message.payload as HubEvents[K]),
    );
  }

  /** Keeps the connection open while a user is signed in. Called once by `provideStoryHub()`. */
  connectWhileSignedIn(): void {
    effect(
      (onCleanup) => {
        if (!this.auth.isAuthenticated()) {
          return;
        }
        untracked(() => {
          // connect() logs its own failure; the connection status shows it to the user.
          this.connect().catch(() => undefined);
        });
        onCleanup(() => {
          this.disconnect().catch((error: unknown) => {
            this.logger.error('SignalR disconnect failed:', error);
          });
        });
      },
      { injector: this.injector },
    );
  }

  /**
   * Starts the connection; serialized with disconnect(). No-op while one is open or opening.
   * The SignalR client is loaded on first use, so it stays out of the initial bundle.
   */
  connect(): Promise<void> {
    return this.serialize(async () => {
      const { HubConnectionBuilder, HubConnectionState, LogLevel } =
        await import('@microsoft/signalr');
      const current = this.connection?.state;
      if (
        current === HubConnectionState.Connected ||
        current === HubConnectionState.Connecting ||
        current === HubConnectionState.Reconnecting
      ) {
        return;
      }

      const connection = new HubConnectionBuilder()
        .withUrl(this.config.hubUrl, {
          accessTokenFactory: () => this.auth.getFreshAccessToken(),
        })
        .withAutomaticReconnect()
        .configureLogging(this.devMode ? LogLevel.Information : LogLevel.Warning)
        .build();
      this.connection = connection;
      this.registerHandlers(connection);

      try {
        await connection.start();
        this.state.set('connected');
        this.logger.debug('SignalR connection started');
      } catch (error) {
        this.logger.error('SignalR connection failed:', error);
        throw error;
      }
    });
  }

  disconnect(): Promise<void> {
    return this.serialize(async () => {
      const connection = this.connection;
      if (connection === null) {
        return;
      }
      this.connection = null;
      this.state.set('disconnected');
      await connection.stop();
    });
  }

  joinStory(storyId: number): Promise<void> {
    return this.invoke('JoinStory', storyId);
  }

  leaveStory(storyId: number): Promise<void> {
    return this.invoke('LeaveStory', storyId);
  }

  /**
   * Always sends three arguments. SignalR does not apply the C# default
   * (`Seam? seamBefore = null`) and rejects a two-argument call, so an unset `seamBefore` is sent
   * as an explicit `null`.
   */
  sendPassage(storyId: number, segments: PassageSegmentInput[], seamBefore?: Seam): Promise<void> {
    return this.invoke('SendPassage', storyId, segments, seamBefore ?? null);
  }

  editPassage(passageId: number, segments: PassageSegmentInput[]): Promise<void> {
    return this.invoke('EditPassage', passageId, segments);
  }

  deletePassage(passageId: number): Promise<void> {
    return this.invoke('DeletePassage', passageId);
  }

  startTyping(storyId: number): Promise<void> {
    return this.invoke('StartTyping', storyId);
  }

  stopTyping(storyId: number): Promise<void> {
    return this.invoke('StopTyping', storyId);
  }

  private async invoke<K extends keyof HubMethods>(
    method: K,
    ...args: HubMethods[K]
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    await this.connection.invoke(method, ...args);
  }

  /**
   * Chains `task` after the previous connect/disconnect. A failed task does not poison the
   * chain, so a later connect() can still run.
   */
  private serialize(task: () => Promise<void>): Promise<void> {
    const run = this.connectionLock.then(task);
    this.connectionLock = run.catch(() => undefined);
    return run;
  }

  private registerHandlers(connection: HubConnection): void {
    for (const event of HUB_EVENT_NAMES) {
      connection.on(event, (payload: unknown) => {
        this.events.next({ event, payload });
      });
    }

    connection.onreconnecting(() => {
      this.logger.debug('SignalR reconnecting');
      this.state.set('reconnecting');
    });

    connection.onreconnected(() => {
      this.logger.debug('SignalR reconnected');
      this.state.set('connected');
    });

    connection.onclose(() => {
      this.logger.debug('SignalR disconnected');
      // Ignore close events from a connection that has already been replaced.
      if (this.connection === null || this.connection === connection) {
        this.state.set('disconnected');
      }
    });
  }
}
