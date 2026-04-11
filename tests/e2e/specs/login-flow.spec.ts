import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Flow - Universal Auth', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should show email input on initial page load', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).not.toBeVisible();
  });

  test('should discover tenants for valid email', async () => {
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await expect(loginPage.isTenantListVisible()).resolves.toBe(true);
  });

  test('should show error for unknown email', async () => {
    await loginPage.discoverTenants('unknown@nonexistent.com');

    // Should show error or stay on email step
    const error = await loginPage.getErrorMessage();
    if (error) {
      expect(error).toContain(/not found|email/i);
    } else {
      await expect(loginPage.isOnLoginPage()).resolves.toBe(true);
    }
  });

  test('should show tenant selection after email discovery', async () => {
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await expect(loginPage.isTenantSelectVisible()).resolves.toBe(true);
  });

  test('should login successfully with correct credentials', async ({ page }) => {
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();
    await loginPage.waitForDashboard();
    await expect(loginPage.isOnDashboard()).resolves.toBe(true);
  });

  test('should show error for incorrect password', async ({ page }) => {
    await loginPage.discoverTenants('admin@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('wrongpassword');
    await loginPage.submitLogin();

    const error = await loginPage.getErrorMessage();
    expect(error).toContain(/incorrect|invalid/i);
    await expect(loginPage.isOnLoginPage()).resolves.toBe(true);
  });

  test('should redirect to login on protected page access without auth', async ({ page }) => {
    // Try to access a protected page directly
    await page.goto('/t/acme/setup/people');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page.url()).toContain('/login');
  });

  test('should handle multi-tenant user with multiple memberships', async ({
    page,
  }) => {
    // User belongs to multiple tenants
    await loginPage.discoverTenants('multitenant@cucu.local');
    await loginPage.waitForTenantList();
    const tenants = await loginPage.getAvailableTenants();
    expect(tenants.length).toBeGreaterThan(1);

    // Select first tenant
    await loginPage.selectTenant(tenants[0]);
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();
    await loginPage.waitForDashboard();
    await expect(loginPage.isOnDashboard()).resolves.toBe(true);
  });
});
