import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { CrudSettingsPage } from '../pages/CrudSettingsPage';

test.describe('Permission System - Field Level', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('admin user should see all fields in profile', async ({ page }) => {
    // Login as admin
    await loginPage.goto();
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Admin should see all fields
    await expect(profilePage.isSectionVisible('authData')).resolves.toBe(true);
    await expect(profilePage.isSectionVisible('personalData')).resolves.toBe(true);
    await expect(profilePage.isSectionVisible('roleOrganization')).resolves.toBe(true);
    await expect(profilePage.isSectionVisible('newEmployment')).resolves.toBe(true);
  });

  test('limited user should not see sensitive fields', async ({ page }) => {
    // Login as limited user
    await loginPage.goto();
    await loginPage.discoverTenants('limited@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Limited user should not see employment/salary fields
    await expect(profilePage.isSectionVisible('newEmployment')).resolves.toBe(
      false,
    );
  });

  test('admin user can edit all fields', async ({ page }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.editAuthDataSection();

    // Admin can edit auth data fields
    await expect(profilePage.isFieldEnabled('authData.name')).resolves.toBe(true);
    await expect(profilePage.isFieldEnabled('authData.email')).resolves.toBe(true);
  });

  test('limited user cannot edit restricted fields', async ({ page }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('limited@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.editAuthDataSection();

    // Limited user cannot edit email (assuming restriction)
    await expect(profilePage.isFieldDisabled('authData.email')).resolves.toBe(true);
  });

  test('viewer user cannot edit any field', async ({ page }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('viewer@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    // Viewer user cannot see edit buttons
    const editButtons = page.getByRole('button', { name: /edit/i });
    await expect(editButtons).toHaveCount(0);
  });
});

test.describe('Permission System - Page Level', () => {
  let loginPage: LoginPage;

  test('admin user can access all pages', async ({ page }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    // Admin can access all pages
    await page.goto('/t/acme/setup/people');
    await expect(page.url()).toContain('/setup/people');

    await page.goto('/t/acme/setup/settings');
    await expect(page.url()).toContain('/setup/settings');

    await page.goto('/t/acme/projects');
    await expect(page.url()).toContain('/projects');
  });

  test('viewer user cannot access settings pages', async ({ page }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('viewer@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    // Viewer should be redirected or shown error when accessing settings
    await page.goto('/t/acme/setup/settings');
    await page.waitForTimeout(2000); // Wait for redirect

    // Should either be redirected to a different page or show an error
    const isOnSettings = await page.url().includes('/setup/settings');
    const hasForbiddenError = await page
      .getByText(/forbidden|access.*denied/i)
      .isVisible();
    const isRedirectedToDashboard = await page.url().includes('/dashboard');

    expect(
      isOnSettings === false || hasForbiddenError || isRedirectedToDashboard,
    ).toBe(true);
  });

  test('limited user can access people list but not all settings', async ({
    page,
  }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('limited@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    // Limited user can access people list
    await page.goto('/t/acme/setup/people');
    await expect(page.url()).toContain('/setup/people');

    // But maybe not all settings subpages
    await page.goto('/t/acme/setup/settings/seniority-levels');
    await page.waitForTimeout(2000);

    const isOnSeniorityPage = await page.url().includes('seniority-levels');
    const hasForbiddenError = await page
      .getByText(/forbidden|access.*denied/i)
      .isVisible();

    expect(
      isOnSeniorityPage === false || hasForbiddenError,
    ).toBe(true);
  });
});

test.describe('Permission System - Operation Level', () => {
  let loginPage: LoginPage;

  test('admin user can create and delete records', async ({ page }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('seniority-levels');

    // Admin can create new
    await expect(crudPage.isCreateButtonVisible()).resolves.toBe(true);

    // Admin can delete (after creating one, in a real scenario)
    // This assumes there's at least one record
    await crudPage.waitForTable();
    const rowCount = await crudPage.getRowCount();
    if (rowCount > 0) {
      await crudPage.editRow(0); // First row
      await expect(crudPage.isDeleteButtonVisible()).resolves.toBe(true);
    }
  });

  test('viewer user cannot create or delete records', async ({ page }) => {
    await loginPage.goto();
    await loginPage.discoverTenants('viewer@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();

    const crudPage = new CrudSettingsPage(page);
    await crudPage.goto('seniority-levels');

    // Viewer cannot create
    await expect(crudPage.isCreateButtonVisible()).resolves.toBe(false);

    // Viewer cannot delete
    await crudPage.waitForTable();
    const rowCount = await crudPage.getRowCount();
    if (rowCount > 0) {
      await crudPage.editRow(0);
      await expect(crudPage.isDeleteButtonVisible()).resolves.toBe(false);
    }
  });
});
