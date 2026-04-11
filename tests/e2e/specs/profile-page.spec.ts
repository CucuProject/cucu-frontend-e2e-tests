import { test, expect } from '@playwright/test';
import { login, logout, waitForPermissionsToLoad } from './helpers/auth';
import { ProfilePage } from './pages/ProfilePage';

test.describe('Profile Page — Permissioned Pattern', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('view mode shows all sections', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Verify all sections are visible
    await expect(profilePage.isSectionVisible('Dati anagrafici')).resolves.toBe(true);
    await expect(profilePage.isSectionVisible('Dati personali')).toBeVisible();
    await expect(profilePage.isSectionVisible('Ruolo e organizzazione')).toBeVisible();
  });

  test('view mode auth data fields are disabled (read-only)', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Verify auth data fields are disabled
    await expect(profilePage.isFieldDisabled('Nome')).resolves.toBe(true);
    await expect(profilePage.isFieldDisabled('Cognome')).resolves.toBe(true);
    await expect(profilePage.isFieldDisabled('Email')).resolves.toBe(true);
  });

  test('view mode personal data fields are disabled (read-only)', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Verify personal data fields are disabled
    await expect(profilePage.isFieldDisabled('Data di nascita')).resolves.toBe(true);
    await expect(profilePage.isFieldDisabled('Luogo di nascita')).resolves.toBe(true);
    await expect(profilePage.isFieldDisabled('Cittadinanza')).resolves.toBe(true);
  });

  test('view mode role organization fields are disabled (read-only)', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Verify role/organization fields are disabled
    await expect(profilePage.isFieldDisabled('Seniority level')).resolves.toBe(true);
    await expect(profilePage.isFieldDisabled('Job roles')).resolves.toBe(true);
    await expect(profilePage.isFieldDisabled('Supervisors')).resolves.toBe(true);
  });

  test('edit mode enables auth data fields', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.editAuthDataSection();
    await waitForPermissionsToLoad(page);

    // Verify fields are enabled for editing
    await expect(profilePage.isFieldEnabled('Nome')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('Cognome')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('Email')).resolves.toBe(true);
  });

  test('edit mode enables personal data fields', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.editPersonalDataSection();
    await waitForPermissionsToLoad(page);

    // Verify fields are enabled for editing
    await expect(profilePage.isFieldEnabled('Data di nascita')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('Luogo di nascita')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('Cittadinanza')).resolves.toBe(true);
  });

  test('edit mode enables role organization fields', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.editRoleOrganizationSection();
    await waitForPermissionsToLoad(page);

    // Verify fields are enabled for editing
    await expect(profilePage.isFieldEnabled('Seniority level')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('Job roles')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('Supervisors')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('Company')).resolves.toBe(true);
  });

  test('cancel edit returns to view mode', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.editAuthDataSection();
    await profilePage.cancelForm();

    // Verify back to view mode (fields disabled again)
    await expect(profilePage.isFieldDisabled('Nome')).resolves.toBe(true);
  });

  test('save form updates data', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.editAuthDataSection();
    await profilePage.fillField('Nome', 'Mario');
    await profilePage.saveForm();

    // Verify save button disappears (back to view mode)
    await profilePage.waitForViewMode();

    // Verify new value is visible
    const nameValue = await profilePage.getFieldValue('Nome');
    expect(nameValue).toBe('Mario');
  });

  test('limited user cannot edit auth data (permissions check)', async ({ page }) => {
    await login(page, 'limited-user');
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.editAuthDataSection();
    await waitForPermissionsToLoad(page);

    // If user has no edit permissions, fields should be disabled
    await expect(profilePage.isFieldDisabled('Nome')).resolves.toBe(true);
  });

  test('limited user cannot edit personal data (permissions check)', async ({ page }) => {
    await login(page, 'limited-user');
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.editPersonalDataSection();
    await waitForPermissionsToLoad(page);

    await expect(profilePage.isFieldDisabled('Data di nascita')).resolves.toBe(true);
  });

  test('admin user can edit all sections', async ({ page }) => {
    await login(page, 'admin');
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Test all sections
    await profilePage.editAuthDataSection();
    await waitForPermissionsToLoad(page);
    await expect(profilePage.isFieldEnabled('Nome')).resolves.toBe(true);
    await profilePage.cancelForm();

    await profilePage.editPersonalDataSection();
    await waitForPermissionsToLoad(page);
    await expect(profilePage.isFieldEnabled('Data di nascita')).resolves.toBe(true);
    await profilePage.cancelForm();

    await profilePage.editRoleOrganizationSection();
    await waitForPermissionsToLoad(page);
    await expect(profilePage.isFieldEnabled('Seniority level')).resolves.toBe(true);
  });
});
