import { expect, test } from '@playwright/test';

import { sharedStory, signedInContext } from './support/api';
import { LoginPage, StoryPage } from './support/pages';
import { AYA, BOBBY } from './support/users';

test.describe('signing in', () => {
  test('a writer signs in and connects', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(AYA);

    await expect(page).toHaveURL('/');
    await new StoryPage(page).expectConnected();
  });

  test('a deep link survives the login', async ({ page, request }) => {
    const story = await sharedStory(request, AYA);
    await page.goto(`/stories/${story.id}`);
    await expect(page).toHaveURL(/\/login\?returnUrl=/);

    await new LoginPage(page).signIn(AYA);

    await expect(page).toHaveURL(`/stories/${story.id}`);
    await new StoryPage(page).expectStoryOpen(story.name);
  });
});

test.describe('writing', () => {
  test('a writer sends a passage that appears in the story', async ({
    browser,
    request,
    baseURL,
  }) => {
    const context = await signedInContext(browser, request, baseURL!, AYA);
    const page = await context.newPage();
    const stories = new StoryPage(page);
    const text = `E2E passage ${Date.now()}.`;

    await stories.goto();
    await stories.expectConnected();
    await stories.openStoryAt(0);
    await expect(page).toHaveURL(/\/stories\/\d+$/);

    await stories.writePassage(text);

    await expect(stories.passages).toContainText(text);
    // The draft is cleared after a successful send.
    await expect(stories.endPassage).toBeDisabled();

    // The URL keeps the story open across a reload.
    await page.reload();
    await expect(stories.passages).toContainText(text);
    await context.close();
  });

  test('a passage reaches the other writers in real time', async ({
    browser,
    request,
    baseURL,
  }) => {
    const story = await sharedStory(request, AYA, BOBBY);
    const ayaContext = await signedInContext(browser, request, baseURL!, AYA);
    const bobbyContext = await signedInContext(browser, request, baseURL!, BOBBY);
    const aya = new StoryPage(await ayaContext.newPage());
    const bobby = new StoryPage(await bobbyContext.newPage());
    const text = `Real-time passage ${Date.now()}.`;

    for (const writer of [aya, bobby]) {
      await writer.goto(story.id);
      await writer.expectConnected();
      await writer.expectStoryOpen(story.name);
    }

    await aya.writePassage(text);

    await expect(bobby.passages).toContainText(text);
    await ayaContext.close();
    await bobbyContext.close();
  });
});
