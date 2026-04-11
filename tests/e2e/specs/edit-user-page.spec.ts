import { test, expect } from '@playwright/test';
import { login, logout, waitForPermissionsToLoad } from './helpers/auth';
import { EditUserPage } from './pages/EditUserPage';

test.describe('Edit User Page — Permissioned Pattern', () => {
  let userId: string;
  let tenantSlug: string;

  test.beforeAll(async () => {
    // In a real scenario, you'd create a test user here
    // For now, assume there's an existing test user
    userId = 'test-user-id';
    tenantSlug = 'acme';
  });

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('view mode shows all sections', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    // Verify all sections are visible
    await expect(editUserPage.isSectionVisible('Dati anagrafici')).resolves.toBe(true);
    await expect(editUserPage.isSectionVisible('Dati personali')).resolves.toBe(true);
    await expect(editUserPage.isSectionVisible('Ruolo e organizzazione')).resolves.toBe(true);
    await expect(editUserPage.isSectionVisible('Gruppi')).resolves.toBe(true);
    await expect(editUserPage.isSectionVisible('Impiego')).resolves.toBe(true);
  });

  test('view mode auth data fields are disabled (read-only)', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    // Verify auth data fields are disabled
    await expect(editUserPage.isFieldDisabled('Nome')).resolves.toBe(true);
    await expect(editUserPage.isFieldDisabled('Cognome')).resolves.toBe(true);
    await expect(editUserPage.isFieldDisabled('Email')).resolves.toBe(true);
  });

  test('view mode personal data fields are disabled (read-only)', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    // Verify personal data fields are disabled
    await expect(editUserPage.isFieldDisabled('Data di nascita')).resolves.toBe(true);
    await expect(editUserPage.isFieldDisabled('Luogo di nascita')).resolves.toBe(true);
    await expect(editUserPage.isFieldDisabled('Cittadinanza')).resolves.toBe(true);
  });

  test('edit mode enables auth data fields', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await waitForPermissionsToLoad(page);

    // Verify fields are enabled for editing
    await expect(editUserPage.isFieldEnabled('Nome')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Cognome')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Email')).resolves.toBe(true);
  });

  test('edit mode enables personal data fields', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await waitForPermissionsToLoad(page);

    // Verify fields are enabled for editing
    await expect(editUserPage.isFieldEnabled('Data di nascita')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Luogo di nascita')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Cittadinanza')).resolves.toBe(true);
  });

  test('edit mode enables role organization fields', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await waitForPermissionsToLoad(page);

    // Verify fields are enabled for editing
    await expect(editUserPage.isFieldEnabled('Seniority level')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Job roles')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Supervisors')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Company')).resolves.toBe(true);
  });

  test('edit mode enables employment fields', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await waitForPermissionsToLoad(page);

    // Verify employment fields are enabled for editing
    await expect(editUserPage.isFieldEnabled('Data di assunzione')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Località')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('RAL')).resolves.toBe(true);
  });

  test('cancel edit returns to view mode', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await editUserPage.cancelEditMode();

    // Verify back to view mode (fields disabled again)
    await expect(editUserPage.isFieldDisabled('Nome')).resolves.toBe(true);
  });

  test('save form updates data', async ({ page }) => {
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await editUserPage.fillField('Nome', 'Giuseppe');
    await editUserPage.saveForm();

    // Verify save button disappears (back to view mode)
    await editUserPage.waitForViewMode();

    // Verify new value is visible
    const nameValue = await editUserPage.getFieldValue('Nome');
    expect(nameValue).toBe('Giuseppe');
  });

  test('limited user cannot edit auth data (permissions check)', async ({ page }) => {
    await login(page, 'limited-user');
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await waitForPermissionsToLoad(page);

    // If user has no edit permissions, fields should be disabled
    await expect(editUserPage.isFieldDisabled('Nome')).resolves.toBe(true);
  });

  test('limited user cannot edit personal data (permissions check)', async ({ page }) => {
    await login(page, 'limited-user');
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    await editUserPage.enableEditMode();
    await waitForPermissionsToLoad(page);

    await expect(editUserPage.isFieldDisabled('Data di nascita')).resolves.toBe(true);
  });

  test('admin user can edit all sections', async ({ page }) => {
    await login(page, 'admin');
    const editUserPage = new EditUserPage(page);
    await editUserPage.goto(userId);

    // Enable edit mode
    await editUserPage.enableEditMode();
    await waitForPermissionsToLoad(page);

    // Test all sections
    await expect(editUserPage.isFieldEnabled('Nome')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Data di nascita')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Seniority level')).resolves.toBe(true);
    await expect(editUserPage.isFieldEnabled('Data di assunzione')).resolves.toBe(true);
  });
});
