/**
 * Gantt — Product e2e tests
 *
 * These tests target the real project page (`/projects/[id]`), not the design-system
 * showcase. They require an environment seeded with:
 * - E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD, defaulting to bootstrap user admin@local.cucu / Test1234!
 * - at least one project visible to that user
 * - at least one milestone rendered in the project Gantt
 *
 * If the selected environment is not seeded, the tests fail with a clear fixture
 * error. They must not skip: missing seed data is a broken e2e environment.
 */
import { expect, test, type Page } from '@playwright/test';

const E2E_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@local.cucu',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'Test1234!',
};

async function loginAsAdmin(page: Page) {
  const { email, password } = E2E_ADMIN;

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.getByRole('button', { name: /continue|continua|discover|next/i }).click();

  const passwordInput = page.locator('input[type="password"]');
  const tenantList = page.locator('[data-testid="tenant-list"]');
  const accountMissingMessage = page.getByText(/no account found|account.*not.*found|utente.*non.*trovato|account.*non.*trovato/i);

  const state = await Promise.race([
    passwordInput.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'password' as const),
    tenantList.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'tenant' as const),
    accountMissingMessage.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'missing-account' as const),
  ]).catch(() => 'timeout' as const);

  if (state === 'tenant') {
    await tenantList.locator('[data-testid="tenant-option"]').first().click();
    await expect(passwordInput, `Password step did not appear for ${email} after tenant selection`).toBeVisible({ timeout: 5000 });
  }

  expect(state, `Login fixture unavailable: ${email} is not seeded or password step did not appear`).not.toMatch(/missing-account|timeout/);
  await expect(passwordInput, `Password field should be visible for ${email}`).toBeVisible();

  await passwordInput.fill(password);
  await page.getByRole('button', { name: /login|accedi|sign.?in|entra/i }).click();

  await page.waitForURL(/\/(dashboard|projects|t\/)/, { timeout: 10000 });
}

async function openFirstProjectWithGantt(page: Page): Promise<string> {
  await page.goto('/projects');

  const projectList = page.locator('[data-testid="project-list"]');
  await expect(projectList, 'Project list should render for the e2e admin').toBeVisible({ timeout: 10000 });

  const firstCard = page.locator('[data-testid="project-card"]').first();
  await expect(firstCard, 'At least one project-card must be seeded for product Gantt e2e').toBeVisible({ timeout: 5000 });

  const projectName = ((await firstCard.textContent().catch(() => null)) ?? 'unknown').trim();
  await firstCard.click();

  await expect(
    page.locator('[data-task-id]').first(),
    `First seeded project (${projectName}) must render at least one Gantt milestone`,
  ).toBeVisible({ timeout: 15000 });

  return projectName;
}

async function prepareProjectGantt(page: Page): Promise<string> {
  await loginAsAdmin(page);
  return openFirstProjectWithGantt(page);
}

async function boxFor(page: Page, taskId: string) {
  const el = page.locator(`[data-task-id="${taskId}"]`);
  const box = await el.boundingBox();
  if (!box) throw new Error(`Missing box for task ${taskId}`);
  return box;
}

async function dragBar(page: Page, taskId: string, deltaX: number) {
  const box = await boxFor(page, taskId);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

async function resizeRight(page: Page, taskId: string, deltaX: number) {
  const box = await boxFor(page, taskId);
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + deltaX, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

async function firstTaskId(page: Page): Promise<string> {
  const id = await page.locator('[data-task-id]').first().getAttribute('data-task-id');
  if (!id) throw new Error('First Gantt bar has no data-task-id');
  return id;
}

test.describe('Gantt — Project page e2e', () => {
  test('opens a project page and renders the Gantt chart', async ({ page }) => {
    await prepareProjectGantt(page);

    const bars = page.locator('[data-task-id]');
    await expect(bars.first()).toBeVisible();
    await expect.poll(() => bars.count()).toBeGreaterThanOrEqual(1);
  });

  test('displays Gantt toolbar with view switchers', async ({ page }) => {
    await prepareProjectGantt(page);

    await expect(page.getByRole('button', { name: /week/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /month/i })).toBeVisible();
  });

  test('drags a milestone bar and it moves', async ({ page }) => {
    await prepareProjectGantt(page);

    const id = await firstTaskId(page);
    const before = await boxFor(page, id);
    await dragBar(page, id, 60);
    const after = await boxFor(page, id);

    expect(after.x).toBeGreaterThan(before.x + 20);
  });

  test('resizes a milestone bar right edge', async ({ page }) => {
    await prepareProjectGantt(page);

    const id = await firstTaskId(page);
    const before = await boxFor(page, id);
    await resizeRight(page, id, 50);
    const after = await boxFor(page, id);

    expect(after.width).toBeGreaterThan(before.width + 20);
  });

  test('switches to week view and bars remain visible', async ({ page }) => {
    await prepareProjectGantt(page);

    await page.getByRole('button', { name: /week/i }).click();
    await expect(page.locator('[data-task-id]').first()).toBeVisible();
  });

  test('switches to month view and bars remain visible', async ({ page }) => {
    await prepareProjectGantt(page);

    await page.getByRole('button', { name: /month/i }).click();
    await expect(page.locator('[data-task-id]').first()).toBeVisible();
  });

  test('does not open drawer on sub-dead-zone bar movement', async ({ page }) => {
    await prepareProjectGantt(page);

    const id = await firstTaskId(page);
    const before = await boxFor(page, id);
    await dragBar(page, id, 3);
    const after = await boxFor(page, id);

    expect(Math.abs(after.x - before.x)).toBeLessThan(1);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});
