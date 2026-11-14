import { expect, test } from '@playwright/test';

// Seeded by StoryApp.Infrastructure/Data/StoryDbSeeder.cs.
const USER = { email: 'aya@test.com', password: 'test123' };

test('a writer sends a passage that appears in the story', async ({ page }) => {
  const text = `E2E passage ${Date.now()}.`;

  await page.goto('/login');
  await page.getByTestId('login-email').fill(USER.email);
  await page.getByTestId('login-password').fill(USER.password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('connection-status')).toContainText('Connected');

  const story = page.getByTestId('story-list-item').first();
  const storyName = (await story.locator('h3').innerText()).trim();
  await story.click();
  await expect(page.getByRole('heading', { level: 2, name: storyName })).toBeVisible();

  const field = page.getByTestId('composer-field');
  await expect(field).toHaveAttribute('contenteditable', 'true');
  await field.click();
  await page.keyboard.type(text);

  const endPassage = page.getByTestId('end-passage');
  await expect(endPassage).toBeEnabled();
  await endPassage.click();

  await expect(page.getByTestId('passages')).toContainText(text);
  // The draft is cleared after a successful send.
  await expect(endPassage).toBeDisabled();
});
