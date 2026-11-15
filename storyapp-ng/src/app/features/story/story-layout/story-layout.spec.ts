import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../core/auth/auth';
import { User } from '../../../core/models/auth.types';
import { ConnectionState, SignalRService } from '../../../core/signalr/signalr';
import { StoryLayout } from './story-layout';

@Component({
  imports: [StoryLayout],
  template: `<app-story-layout>
    <p storySidebar>sidebar content</p>
    <p storyMain>main content</p>
  </app-story-layout>`,
})
class Host {}

const user: User = { id: 1, username: 'aya', email: 'aya@test.com', isOnline: true, lastSeen: '' };

describe('StoryLayout', () => {
  const connectionState = signal<ConnectionState>('connected');
  const logout = vi.fn(async () => undefined);

  beforeEach(() => {
    connectionState.set('connected');
    logout.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal(user), logout } },
        { provide: SignalRService, useValue: { connectionState } },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the signed-in user', async () => {
    const { element } = await render();
    expect(element.querySelector('header')!.textContent).toContain('aya');
    expect(element.querySelector('header')!.textContent).toContain('aya@test.com');
  });

  it('projects the sidebar and main content', async () => {
    const { element } = await render();
    expect(element.querySelector('aside')!.textContent).toContain('sidebar content');
    expect(element.querySelector('main')!.textContent).toContain('main content');
  });

  it('shows the connection status; reconnecting counts as disconnected', async () => {
    const { fixture, element } = await render();
    const status = () => element.querySelector('[data-testid="connection-status"]')!.textContent;
    expect(status()).toContain('Connected');

    connectionState.set('reconnecting');
    await fixture.whenStable();
    expect(status()).toContain('Disconnected');
  });

  it('logs out and goes to /login', async () => {
    const { element } = await render();
    element.querySelector<HTMLButtonElement>('header button')!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(logout).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });
});
