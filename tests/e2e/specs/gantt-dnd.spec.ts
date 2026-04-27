import { expect, test, type Page } from '@playwright/test';

async function gotoGantt(page: Page) {
  await page.goto('/design-system', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Gantt Progetto' }).scrollIntoViewIfNeeded();
  await expect(page.locator('[data-task-id="1"]')).toBeVisible();
}

async function boxFor(page: Page, taskId: string) {
  const box = await page.locator(`[data-task-id="${taskId}"]`).boundingBox();
  if (!box) throw new Error(`Missing box for task ${taskId}`);
  return box;
}

async function dragBar(page: Page, taskId: string, deltaX: number) {
  const box = await boxFor(page, taskId);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(250);
}

async function resizeRight(page: Page, taskId: string, deltaX: number) {
  const box = await boxFor(page, taskId);
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + deltaX, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(250);
}

async function resizeRightIntoAutoscroll(page: Page, taskId: string) {
  const timeline = page.locator('[class*="timeline"]').first();
  const timelineBox = await timeline.boundingBox();
  if (!timelineBox) throw new Error('Missing timeline box');
  const box = await boxFor(page, taskId);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 2, y);
  await page.mouse.down();
  await page.mouse.move(timelineBox.x + timelineBox.width - 8, y, { steps: 20 });
  await page.waitForTimeout(450);
  const during = await boxFor(page, taskId);
  await page.mouse.up();
  await page.waitForTimeout(300);
  return during;
}

async function inlineTransform(page: Page, taskId: string) {
  return page.locator(`[data-task-id="${taskId}"]`).evaluate(el => (el as HTMLElement).style.transform);
}

async function dragBackwardIntoAutoscroll(page: Page, taskId: string) {
  const timeline = page.locator('[class*="timeline"]').first();
  const timelineBox = await timeline.boundingBox();
  if (!timelineBox) throw new Error('Missing timeline box');
  const box = await boxFor(page, taskId);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(timelineBox.x + 8, y, { steps: 20 });
  await page.waitForTimeout(450);
  const during = await boxFor(page, taskId);
  await page.mouse.up();
  await page.waitForTimeout(300);
  return during;
}

async function dragIntoAutoscroll(page: Page, taskId: string) {
  const timeline = page.locator('[class*="timeline"]').first();
  const timelineBox = await timeline.boundingBox();
  if (!timelineBox) throw new Error('Missing timeline box');
  const box = await boxFor(page, taskId);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(timelineBox.x + timelineBox.width - 8, y, { steps: 20 });
  await page.waitForTimeout(450);
  const during = await boxFor(page, taskId);
  await page.mouse.up();
  await page.waitForTimeout(300);
  return during;
}

test.describe('Gantt milestone drag and resize (design-system smoke)', () => {
  test('treats sub-dead-zone movement as click and keeps the bar in place', async ({ page }) => {
    await gotoGantt(page);

    const before = await boxFor(page, '1');
    await dragBar(page, '1', 3);
    const after = await boxFor(page, '1');

    expect(Math.abs(after.x - before.x)).toBeLessThan(1);
    await expect(page.getByText('Discovery & Ricerca').first()).toBeVisible();
  });

  test('moves and reorders a milestone in day view', async ({ page }) => {
    await gotoGantt(page);

    const before = await boxFor(page, '1');
    await dragBar(page, '1', 60);
    const after = await boxFor(page, '1');

    expect(after.x).toBeGreaterThan(before.x + 20);
    expect(await inlineTransform(page, '1')).toBe('');
  });

  test('resizes the right edge in day view', async ({ page }) => {
    await gotoGantt(page);

    const before = await boxFor(page, '1');
    await resizeRight(page, '1', 50);
    const after = await boxFor(page, '1');

    expect(after.width).toBeGreaterThan(before.width + 20);
    expect(Math.abs(after.x - before.x)).toBeLessThan(30);
  });

  test('keeps drag working in week and month views', async ({ page }) => {
    await gotoGantt(page);

    await page.getByRole('button', { name: /week/i }).click();
    const weekBefore = await boxFor(page, '1');
    await dragBar(page, '1', 80);
    const weekAfter = await boxFor(page, '1');
    expect(weekAfter.x).toBeGreaterThan(weekBefore.x + 20);

    await page.getByRole('button', { name: /month/i }).click();
    const monthBefore = await boxFor(page, '1');
    await dragBar(page, '1', 120);
    const monthAfter = await boxFor(page, '1');
    const monthDelta = monthAfter.x - monthBefore.x;
    expect(monthDelta).toBeGreaterThan(30);
    expect(monthDelta).toBeLessThan(220);
  });

  test('keeps month view drag delta bounded to the pointer movement', async ({ page }) => {
    await gotoGantt(page);

    await page.getByRole('button', { name: /month/i }).click();
    const before = await boxFor(page, '1');
    await dragBar(page, '1', 120);
    const after = await boxFor(page, '1');

    expect(after.x - before.x).toBeGreaterThan(30);
    expect(after.x - before.x).toBeLessThan(220);
    expect(await inlineTransform(page, '1')).toBe('');
  });

  test('does not drag or resize a locked/read-only milestone', async ({ page }) => {
    await gotoGantt(page);

    const before = await boxFor(page, '6');
    await dragBar(page, '6', 80);
    const afterDrag = await boxFor(page, '6');
    expect(Math.abs(afterDrag.x - before.x)).toBeLessThan(1);
    expect(Math.abs(afterDrag.width - before.width)).toBeLessThan(1);

    await resizeRight(page, '6', 80);
    const afterResize = await boxFor(page, '6');
    expect(Math.abs(afterResize.x - before.x)).toBeLessThan(1);
    expect(Math.abs(afterResize.width - before.width)).toBeLessThan(1);
  });

  test('keeps backward drag bounded at the left autoscroll edge', async ({ page }) => {
    await gotoGantt(page);

    const before = await boxFor(page, '5');
    const during = await dragBackwardIntoAutoscroll(page, '5');
    const after = await boxFor(page, '5');

    expect(during.width).toBeGreaterThan(10);
    expect(before.x - during.x).toBeLessThan(700);
    expect(before.x - after.x).toBeLessThan(700);
    expect(await inlineTransform(page, '5')).toBe('');
  });

  test('keeps the dragged milestone visible during autoscroll', async ({ page }) => {
    await gotoGantt(page);

    const before = await boxFor(page, '1');
    const during = await dragIntoAutoscroll(page, '1');
    const after = await boxFor(page, '1');
    const timelineBox = await page.locator('[class*="timeline"]').first().boundingBox();
    if (!timelineBox) throw new Error('Missing timeline box');

    expect(during.width).toBeGreaterThan(10);
    expect(during.x).toBeGreaterThan(before.x + 40);
    expect(during.x + during.width).toBeGreaterThan(timelineBox.x);
    expect(during.x).toBeLessThan(timelineBox.x + timelineBox.width + 20);
    expect(after.width).toBeGreaterThan(10);
    expect(await inlineTransform(page, '1')).toBe('');
  });

  test('keeps resource allocation totals coherent after drag and drawer open', async ({ page }) => {
    await gotoGantt(page);

    await page.getByText('Sviluppo Frontend').scrollIntoViewIfNeeded();
    await page.getByText('Sviluppo Frontend').locator('..').getByRole('button').first().click();
    await expect(page.getByText('Giulia Greco')).toBeVisible();
    await expect(page.getByText('160h').first()).toBeVisible();

    await dragBar(page, '5', 80);
    await page.getByText('Sviluppo Frontend').click();

    await expect(page.getByText('Giulia Greco')).toBeVisible();
    await expect(page.getByText('160h').first()).toBeVisible();
    await expect(page.getByText('120h')).toHaveCount(0);
  });

  test('keeps week and month allocation cells read-only', async ({ page }) => {
    await gotoGantt(page);

    await page.getByText('Sviluppo Frontend').scrollIntoViewIfNeeded();
    await page.getByText('Sviluppo Frontend').locator('..').getByRole('button').first().click();
    await expect(page.getByText('Giulia Greco')).toBeVisible();

    await page.getByRole('button', { name: /week/i }).click();
    await expect(page.locator('[class*="allocationWeekCell"]').first()).toBeVisible();
    await page.locator('[class*="allocationOverlay"]').first().click();
    await expect(page.locator('[class*="allocationInput"]')).toHaveCount(0);

    await page.getByRole('button', { name: /month/i }).click();
    await expect(page.locator('[class*="allocationMonthCell"]').first()).toBeVisible();
    await page.locator('[class*="allocationOverlay"]').first().click();
    await expect(page.locator('[class*="allocationInput"]')).toHaveCount(0);
  });

  test('right resize shifts dependent milestones', async ({ page }) => {
    await gotoGantt(page);

    const dependentBefore = await boxFor(page, '2');
    await resizeRight(page, '1', 50);
    const dependentAfter = await boxFor(page, '2');

    expect(dependentAfter.x).toBeGreaterThan(dependentBefore.x + 20);
  });

  test('resizes through the right autoscroll edge', async ({ page }) => {
    await gotoGantt(page);

    const before = await boxFor(page, '1');
    const during = await resizeRightIntoAutoscroll(page, '1');
    const after = await boxFor(page, '1');

    expect(Math.max(during.width, after.width)).toBeGreaterThan(before.width + 40);
    expect(after.width).toBeGreaterThan(before.width + 20);
  });
});
