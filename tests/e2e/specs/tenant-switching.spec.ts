import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TenantSwitcher } from '../pages/TenantSwitcher';

test.describe('Tenant Switching', () => {
  let loginPage: LoginPage;
  let tenantSwitcher: TenantSwitcher;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    tenantSwitcher = new TenantSwitcher(page);

    // Login as a multi-tenant user
    await loginPage.goto();
    await loginPage.discoverTenants('multitenant@cucu.local');
    await loginPage.waitForTenantList();
    await loginPage.selectTenant('acme');
    await loginPage.enterPassword('password123');
    await loginPage.submitLogin();
    await loginPage.waitForDashboard();
  });

  test('should show tenant switcher in header', async ({ page }) => {
    await expect(tenantSwitcher.isTenantSwitcherVisible()).resolves.toBe(true);
  });

  test('should show current tenant', async ({ page }) => {
    const currentTenant = await tenantSwitcher.getCurrentTenantSlug();
    expect(currentTenant).toContain('acme');
  });

  test('should open tenant list on click', async ({ page }) => {
    await tenantSwitcher.openTenantSwitcher();
    await expect(tenantSwitcher.isTenantListVisible()).resolves.toBe(true);
  });

  test('should list all available tenants for multi-tenant user', async ({
    page,
  }) => {
    await tenantSwitcher.openTenantSwitcher();
    const tenants = await tenantSwitcher.getAvailableTenants();
    expect(tenants.length).toBeGreaterThan(1);
  });

  test('should switch to another tenant', async ({ page }) => {
    await tenantSwitcher.openTenantSwitcher();
    await tenantSwitcher.selectTenant('globex');
    await tenantSwitcher.waitForTenantSwitch('globex');

    const currentTenant = await tenantSwitcher.getCurrentTenantSlug();
    expect(currentTenant).toContain('globex');
  });

  test('should update tenant context after switch', async ({ page }) => {
    const initialTenant = await tenantSwitcher.getCurrentTenantSlug();

    await tenantSwitcher.openTenantSwitcher();
    await tenantSwitcher.selectTenant('globex');
    await tenantSwitcher.waitForTenantSwitch('globex');

    const newTenant = await tenantSwitcher.getCurrentTenantSlug();

    expect(newTenant).not.toBe(initialTenant);
    expect(newTenant).toContain('globex');
  });

  test('should redirect to setup after tenant switch', async ({ page }) => {
    // Navigate to a different page first
    await page.goto('/t/acme/projects');

    await tenantSwitcher.openTenantSwitcher();
    await tenantSwitcher.selectTenant('globex');
    await tenantSwitcher.waitForTenantSwitch('globex');

    // Should redirect to setup or dashboard
    await expect(page.url()).toMatch(/\/(setup|dashboard)/);
  });

  test('should preserve authentication after tenant switch', async ({ page }) => {
    await tenantSwitcher.openTenantSwitcher();
    await tenantSwitcher.selectTenant('globex');
    await tenantSwitcher.waitForTenantSwitch('globex');

    // Should still be authenticated (not redirected to login)
    await expect(page.url()).not.toContain('/login');
  });

  test('should switch back to original tenant', async ({ page }) => {
    await tenantSwitcher.openTenantSwitcher();
    await tenantSwitcher.selectTenant('globex');
    await tenantSwitcher.waitForTenantSwitch('globex');

    await tenantSwitcher.openTenantSwitcher();
    await tenantSwitcher.selectTenant('acme');
    await tenantSwitcher.waitForTenantSwitch('acme');

    const currentTenant = await tenantSwitcher.getCurrentTenantSlug();
    expect(currentTenant).toContain('acme');
  });
});
