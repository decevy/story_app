import { AuthService } from '@core/auth/auth-service';
import { StoryHubClient } from '@core/story-hub/story-hub-client';
import { fakeAuth, type FakeHub, fakeHub } from '@testing/fakes';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { StoryLayout } from './story-layout';

describe('StoryLayout', () => {
  let auth: ReturnType<typeof fakeAuth>;
  let hub: FakeHub;

  beforeEach(() => {
    auth = fakeAuth();
    hub = fakeHub('connected');
  });

  function setup() {
    return render(
      `<sa-story-layout>
        <p storySidebar>sidebar content</p>
        <p storyMain>main content</p>
      </sa-story-layout>`,
      {
        imports: [StoryLayout],
        providers: [
          { provide: AuthService, useValue: auth },
          { provide: StoryHubClient, useValue: hub },
        ],
      },
    );
  }

  it('shows the signed-in user', async () => {
    await setup();
    const header = screen.getByRole('banner');
    expect(header.textContent).toContain('aya');
    expect(header.textContent).toContain('aya@test.com');
  });

  it('projects the sidebar and main content', async () => {
    await setup();
    expect(screen.getByRole('complementary').textContent).toContain('sidebar content');
    expect(screen.getByRole('main').textContent).toContain('main content');
  });

  it('shows the connection status; reconnecting counts as disconnected', async () => {
    const { fixture } = await setup();
    const status = screen.getByTestId('connection-status');
    expect(status.textContent).toContain('Connected');

    hub.connectionState.set('reconnecting');
    await fixture.whenStable();
    expect(status.textContent).toContain('Disconnected');
  });

  it('logs out (AuthService then goes to /login)', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(auth.logout).toHaveBeenCalledOnce();
  });
});
