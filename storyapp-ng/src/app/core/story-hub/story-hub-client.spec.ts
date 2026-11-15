import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as signalR from '@microsoft/signalr';

import { AuthService } from '../auth/auth-service';
import { APP_CONFIG } from '../config/app-config';
import { type Passage, Seam } from '../models/story';
import type { TypingIndicator } from './hub-events';
import { StoryHubClient } from './story-hub-client';

type Handler = (...args: unknown[]) => void;

/** Stand-in for signalR.HubConnection with the parts StoryHubClient uses. */
class FakeConnection {
  state = signalR.HubConnectionState.Disconnected;
  readonly handlers = new Map<string, Handler>();
  reconnecting?: Handler;
  reconnected?: Handler;
  close?: Handler;

  start = vi.fn(async () => {
    this.state = signalR.HubConnectionState.Connected;
  });
  stop = vi.fn(async () => {
    this.state = signalR.HubConnectionState.Disconnected;
    this.close?.();
  });
  invoke = vi.fn(async () => undefined);
  on = vi.fn((name: string, handler: Handler) => this.handlers.set(name, handler));
  onreconnecting = vi.fn((handler: Handler) => (this.reconnecting = handler));
  onreconnected = vi.fn((handler: Handler) => (this.reconnected = handler));
  onclose = vi.fn((handler: Handler) => (this.close = handler));
}

describe('StoryHubClient', () => {
  let service: StoryHubClient;
  let connections: FakeConnection[];
  let withUrl: ReturnType<typeof vi.spyOn>;
  const getFreshAccessToken = vi.fn(async () => 'token');
  const isAuthenticated = signal(false);

  beforeEach(() => {
    connections = [];
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    withUrl = vi.spyOn(signalR.HubConnectionBuilder.prototype, 'withUrl');
    vi.spyOn(signalR.HubConnectionBuilder.prototype, 'build').mockImplementation(() => {
      const connection = new FakeConnection();
      connections.push(connection);
      return connection as unknown as signalR.HubConnection;
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: { apiUrl: '', hubUrl: '/storyHub' } },
        { provide: AuthService, useValue: { getFreshAccessToken, isAuthenticated } },
      ],
    });
    isAuthenticated.set(false);
    service = TestBed.inject(StoryHubClient);
  });

  afterEach(() => vi.restoreAllMocks());

  it('connects to the hub URL with a fresh access token', async () => {
    await service.connect();

    expect(withUrl).toHaveBeenCalledWith('/storyHub', expect.any(Object));
    const options = withUrl.mock.calls[0]![1] as signalR.IHttpConnectionOptions;
    await expect(options.accessTokenFactory!()).resolves.toBe('token');
    expect(getFreshAccessToken).toHaveBeenCalled();
    expect(service.connectionState()).toBe('connected');
    expect(service.isConnected()).toBe(true);
  });

  it('does not open a second connection while connected', async () => {
    await service.connect();
    await service.connect();
    expect(connections).toHaveLength(1);
  });

  it('serializes connect and disconnect, and recovers after a failed connect', async () => {
    const first = service.connect();
    const stop = service.disconnect();
    await first;
    await stop;
    expect(connections[0]!.stop).toHaveBeenCalledOnce();
    expect(service.connectionState()).toBe('disconnected');

    vi.mocked(signalR.HubConnectionBuilder.prototype.build).mockImplementationOnce(() => {
      const connection = new FakeConnection();
      connection.start.mockRejectedValueOnce(new Error('offline'));
      connections.push(connection);
      return connection as unknown as signalR.HubConnection;
    });
    await expect(service.connect()).rejects.toThrow('offline');

    await service.connect();
    expect(connections).toHaveLength(3);
    expect(service.connectionState()).toBe('connected');
  });

  it('forwards hub events to the matching observables', async () => {
    await service.connect();
    const received: Passage[] = [];
    const typing: TypingIndicator[] = [];
    service.on('ReceivePassage').subscribe((passage) => received.push(passage));
    service.on('UserStartedTyping').subscribe((event) => typing.push(event));

    const passage = { id: 1 } as Passage;
    connections[0]!.handlers.get('ReceivePassage')!(passage);
    connections[0]!.handlers.get('UserStartedTyping')!({ userId: 2, storyId: 3 });

    expect(received).toEqual([passage]);
    expect(typing).toEqual([{ userId: 2, storyId: 3 }]);
    expect([...connections[0]!.handlers.keys()]).toEqual([
      'ReceivePassage',
      'PassageEdited',
      'PassageDeleted',
      'UserJoinedStory',
      'UserLeftStory',
      'UserStartedTyping',
      'UserStoppedTyping',
      'UserStatusChanged',
    ]);
  });

  it('tracks reconnecting and reconnected', async () => {
    await service.connect();

    connections[0]!.reconnecting!();
    expect(service.connectionState()).toBe('reconnecting');
    expect(service.isConnected()).toBe(false);

    connections[0]!.reconnected!();
    expect(service.connectionState()).toBe('connected');
  });

  it('does not open a second connection while reconnecting', async () => {
    await service.connect();
    connections[0]!.state = signalR.HubConnectionState.Reconnecting;
    await service.connect();
    expect(connections).toHaveLength(1);
  });

  it('connects while a user is signed in and disconnects on logout', async () => {
    TestBed.runInInjectionContext(() => {
      service.connectWhileSignedIn();
    });
    TestBed.tick();
    expect(connections).toHaveLength(0);

    isAuthenticated.set(true);
    TestBed.tick();
    await vi.waitFor(() => {
      expect(service.connectionState()).toBe('connected');
    });

    isAuthenticated.set(false);
    TestBed.tick();
    await vi.waitFor(() => {
      expect(service.connectionState()).toBe('disconnected');
    });
    expect(connections[0]!.stop).toHaveBeenCalledOnce();
  });

  it('ignores close events from a replaced connection', async () => {
    await service.connect();
    const old = connections[0]!;
    await service.disconnect();
    await service.connect();

    old.close!();
    expect(service.connectionState()).toBe('connected');
  });

  it('always sends seamBefore, as null when unset', async () => {
    await service.connect();
    const segments = [{ order: 0, text: 'Hi ' }];

    await service.sendPassage(3, segments);
    expect(connections[0]!.invoke).toHaveBeenLastCalledWith('SendPassage', 3, segments, null);

    await service.sendPassage(3, segments, Seam.Section);
    expect(connections[0]!.invoke).toHaveBeenLastCalledWith('SendPassage', 3, segments, 2);
  });

  it('invokes the other hub methods by name', async () => {
    await service.connect();
    const invoke = connections[0]!.invoke;

    await service.joinStory(3);
    await service.leaveStory(3);
    await service.editPassage(5, []);
    await service.deletePassage(5);
    await service.startTyping(3);
    await service.stopTyping(3);

    expect(invoke.mock.calls).toEqual([
      ['JoinStory', 3],
      ['LeaveStory', 3],
      ['EditPassage', 5, []],
      ['DeletePassage', 5],
      ['StartTyping', 3],
      ['StopTyping', 3],
    ]);
  });

  it('rejects hub calls without a connection', async () => {
    await expect(service.joinStory(3)).rejects.toThrow('Not connected');
  });
});
