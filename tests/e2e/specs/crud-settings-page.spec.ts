import { test, expect } from '@playwright/test';
import { login, logout, waitForPermissionsToLoad } from './helpers/auth';
import { CrudSettingsPage } from './pages/CrudSettingsPage';

test.describe('CRUD Settings Page — Permissioned Pattern', () => {
  let tenantSlug: string;

  test.beforeAll(async () => {
    tenantSlug = 'acme';
  });

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('view mode shows table with rows', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Verify table is visible
    await crudPage.waitForTable();

    // Verify there are rows
    const rowCount = await crudPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('view mode row is read-only', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Verify edit buttons are visible
    const editButtons = page.getByRole('button', { name: /modifica|edit/i });
    await expect(editButtons.first()).toBeVisible();
  });

  test('edit mode enables form fields', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Edit first row
    await crudPage.editRow(0);
    await waitForPermissionsToLoad(page);

    // Verify form fields are enabled
    await expect(crudPage.isFieldEnabled('Order')).resolves.toBe(true);
    await expect(crudPage.isFieldEnabled('Name')).resolves.toBe(true);
    await expect(crudPage.isFieldEnabled('Description')).resolves.toBe(true);
  });

  test('edit mode form has save and cancel buttons', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Edit first row
    await crudPage.editRow(0);

    // Verify save and cancel buttons are visible
    await expect(page.getByRole('button', { name: /salva|save/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /annulla|cancel/i })).toBeVisible();
  });

  test('cancel edit returns to view mode', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Edit first row
    await crudPage.editRow(0);

    // Cancel edit
    await crudPage.cancelForm();

    // Verify back to view mode (form hidden)
    await expect(page.getByRole('button', { name: /salva|save/i })).not.toBeVisible();
  });

  test('save form updates data', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Edit first row
    await crudPage.editRow(0);
    await crudPage.fillField('Name', 'Updated Role Name');
    await crudPage.saveForm();

    // Verify save button disappears (back to view mode)
    await crudPage.waitForViewMode();
  });

  test('create new item shows form', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Create new item
    await crudPage.createNew();

    // Verify form fields are visible
    await expect(crudPage.isFieldVisible('Order')).resolves.toBe(true);
    await expect(crudPage.isFieldVisible('Name')).resolves.toBe(true);
    await expect(crudPage.isFieldVisible('Description')).resolves.toBe(true);

    // Verify save and cancel buttons are visible
    await expect(page.getByRole('button', { name: /salva|save/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /annulla|cancel/i })).toBeVisible();
  });

  test('create new item with save adds row', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Get initial row count
    const initialCount = await crudPage.getRowCount();

    // Create new item
    await crudPage.createNew();
    await crudPage.fillField('Order', '100');
    await crudPage.fillField('Name', 'New Role');
    await crudPage.fillField('Description', 'A new job role');
    await crudPage.saveForm();

    // Verify new row is added
    await crudPage.waitForViewMode();
    const newCount = await crudPage.getRowCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test('delete item removes row', async ({ page }) => {
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Get initial row count
    const initialCount = await crudPage.getRowCount();

    // Delete first row
    await crudPage.deleteRow(0);
    await crudPage.confirmDelete();

    // Verify row is removed
    await crudPage.waitForTable();
    const newCount = await crudPage.getRowCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test('limited user can view but cannot edit (permissions check)', async ({ page }) => {
    await login(page, 'limited-user');
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Verify table is visible
    await crudPage.waitForTable();

    // Verify edit buttons are NOT visible (or disabled)
    const editButtons = page.getByRole('button', { name: /modifica|edit/i });
    await expect(editButtons.first()).not.toBeVisible();
  });

  test('limited user cannot create new item (permissions check)', async ({ page }) => {
    await login(page, 'limited-user');
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Verify create button is NOT visible (or disabled)
    const createButton = page.getByRole('button', { name: /nuovo|create|add/i });
    await expect(createButton).not.toBeVisible();
  });

  test('limited user cannot delete item (permissions check)', async ({ page }) => {
    await login(page, 'limited-user');
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Verify delete buttons are NOT visible (or disabled)
    const deleteButtons = page.getByRole('button', { name: /elimina|delete/i });
    await expect(deleteButtons.first()).not.toBeVisible();
  });

  test('admin user can edit all fields', async ({ page }) => {
    await login(page, 'admin');
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Edit first row
    await crudPage.editRow(0);
    await waitForPermissionsToLoad(page);

    // Verify all fields are enabled
    await expect(crudPage.isFieldEnabled('Order')).resolves.toBe(true);
    await expect(crudPage.isFieldEnabled('Name')).resolves.toBe(true);
    await expect(crudPage.isFieldEnabled('Description')).resolves.toBe(true);
  });

  test('admin user can create new item', async ({ page }) => {
    await login(page, 'admin');
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Create new item
    await crudPage.createNew();

    // Verify form is visible
    await expect(crudPage.isFieldVisible('Order')).resolves.toBe(true);
  });

  test('admin user can delete item', async ({ page }) => {
    await login(page, 'admin');
    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('job-roles');

    // Verify delete button is visible
    const deleteButtons = page.getByRole('button', { name: /elimina|delete/i });
    await expect(deleteButtons.first()).toBeVisible();
  });
});
