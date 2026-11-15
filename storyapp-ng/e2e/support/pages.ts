import { expect, type Locator, type Page } from '@playwright/test';

import { type TestUser } from './users';

/** The login page (`/login`). */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async signIn(user: TestUser): Promise<void> {
    await this.page.getByTestId('login-email').fill(user.email);
    await this.page.getByTestId('login-password').fill(user.password);
    await this.page.getByTestId('login-submit').click();
  }
}

/** The story area (`/` and `/stories/:id`): list, book page and draft. */
export class StoryPage {
  readonly connectionStatus: Locator;
  readonly storyItems: Locator;
  readonly passages: Locator;
  readonly composer: Locator;
  readonly endPassage: Locator;

  constructor(private readonly page: Page) {
    this.connectionStatus = page.getByTestId('connection-status');
    this.storyItems = page.getByTestId('story-list-item');
    this.passages = page.getByTestId('passages');
    this.composer = page.getByRole('textbox', { name: 'Story continuation' });
    this.endPassage = page.getByTestId('end-passage');
  }

  async goto(storyId?: number): Promise<void> {
    await this.page.goto(storyId === undefined ? '/' : `/stories/${storyId}`);
  }

  async expectConnected(): Promise<void> {
    await expect(this.connectionStatus).toContainText('Connected');
  }

  async expectStoryOpen(name: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 2, name })).toBeVisible();
  }

  /** Opens the story at `index` in the list and returns its name. */
  async openStoryAt(index: number): Promise<string> {
    const item = this.storyItems.nth(index);
    const name = (await item.locator('h3').innerText()).trim();
    await item.click();
    await this.expectStoryOpen(name);
    return name;
  }

  /** Types `text` into the draft and sends it with "End passage". */
  async writePassage(text: string): Promise<void> {
    await expect(this.composer).toHaveAttribute('contenteditable', 'true');
    await this.composer.click();
    await this.page.keyboard.type(text);
    await expect(this.endPassage).toBeEnabled();
    await this.endPassage.click();
  }
}
