import { expect, test } from '@playwright/test';

const prefsKey = 'gantt-prefs-design-system-gantt-e2e';

function isWeekendIso(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getDay() === 0 || d.getDay() === 6;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, JSON.stringify({
      zoom: 'day',
      showToday: false,
      showNonWorkingDays: true,
      displayUnit: 'hours',
      expandedTasks: ['5'],
    }));
  }, prefsKey);
});

test('Gantt drag keeps milestone and allocations out of day-off dates', async ({ page }) => {
  await page.goto('/design-system', { waitUntil: 'networkidle' });

  const heading = page.getByRole('heading', { name: 'Gantt Progetto' });
  await heading.scrollIntoViewIfNeeded();

  const bar = page.getByTestId('gantt-bar-5');
  await expect(bar).toBeVisible();

  const overlay = page.getByTestId('gantt-allocation-overlay-5-m2u-frontend-dev');
  await expect(overlay).toBeVisible();

  // Empty day cell insertion must open the inline allocation input.
  await overlay.click({ position: { x: 58, y: 10 } });
  await expect(page.locator('input[type="number"]')).toBeVisible();
  await page.keyboard.press('Escape');

  const barBox = await bar.boundingBox();
  expect(barBox).not.toBeNull();

  // Drag the milestone by roughly one week. The fixture has rawEndDate on Saturday;
  // the Gantt must snap the rendered/saved boundary back to Friday.
  await page.mouse.move(barBox!.x + barBox!.width / 2, barBox!.y + barBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(barBox!.x + barBox!.width / 2 + 23 * 7, barBox!.y + barBox!.height / 2, { steps: 10 });
  await page.mouse.up();

  await expect(bar).toHaveAttribute('data-start', '2026-03-09');
  await expect(bar).toHaveAttribute('data-end', '2026-03-13');
  const end = await bar.getAttribute('data-end');
  expect(end).toBeTruthy();
  expect(isWeekendIso(end!)).toBe(false);

  // The allocation that would land past the snapped milestone boundary must be removed.
  await expect(page.getByTestId('gantt-allocation-cell-m2u-frontend-dev-2026-03-13')).toBeVisible();
  await expect(page.getByTestId('gantt-allocation-cell-m2u-frontend-dev-2026-03-16')).toHaveCount(0);

  const allocationDates = await page.locator('[data-testid^="gantt-allocation-cell-m2u-frontend-dev-"]').evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).dataset.date).filter(Boolean),
  );
  expect(allocationDates).toEqual(['2026-03-13']);
});
