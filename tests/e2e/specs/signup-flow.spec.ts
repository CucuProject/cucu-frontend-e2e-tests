import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage';

test.describe('Signup Flow - Multi-Tenant', () => {
  let signupPage: SignupPage;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    await signupPage.goto();
  });

  test('should show all required fields', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/tenant.*name/i)).toBeVisible();
    await expect(page.getByLabel(/admin.*name/i)).toBeVisible();
  });

  test('should auto-generate tenant slug from tenant name', async ({ page }) => {
    await signupPage.fillTenantName('My Company Inc');
    await expect(signupPage.isTenantSlugAutoFilled()).resolves.toBe(true);
    const slug = await signupPage.getTenantSlugValue();
    expect(slug).toBe('my-company-inc');
  });

  test('should show validation errors for missing required fields', async ({
    page,
  }) => {
    // Submit without filling any fields
    await signupPage.submitSignup();

    await expect(signupPage.isEmailRequiredErrorVisible()).resolves.toBe(true);
    await expect(signupPage.isPasswordRequiredErrorVisible()).resolves.toBe(true);
    await expect(
      signupPage.isTenantNameRequiredErrorVisible(),
    ).resolves.toBe(true);
  });

  test('should create new tenant and user successfully', async ({ page }) => {
    const uniqueEmail = `signup-test-${Date.now()}@test.com`;
    const tenantName = 'Test Company';
    const tenantSlug = 'test-company';
    const adminName = 'Test Admin';

    await signupPage.fillEmail(uniqueEmail);
    await signupPage.fillPassword('password123');
    await signupPage.fillTenantName(tenantName);
    await signupPage.fillAdminName(adminName);
    await signupPage.submitSignup();

    // Should redirect to dashboard after auto-login
    await signupPage.waitForDashboard();
    await expect(signupPage.isOnDashboard()).resolves.toBe(true);
  });

  test('should handle duplicate tenant slug', async ({ page }) => {
    const tenantName = 'Existing Company'; // Assume this already exists

    await signupPage.fillEmail('newuser@test.com');
    await signupPage.fillPassword('password123');
    await signupPage.fillTenantName(tenantName);
    await signupPage.fillAdminName('Test Admin');
    await signupPage.submitSignup();

    const error = await signupPage.getErrorMessage();
    expect(error).toContain(/already.*exists|taken/i);
  });

  test('should handle duplicate email', async ({ page }) => {
    const existingEmail = 'admin@cucu.local'; // Assume this already exists

    await signupPage.fillEmail(existingEmail);
    await signupPage.fillPassword('password123');
    await signupPage.fillTenantName('New Company');
    await signupPage.fillAdminName('Test Admin');
    await signupPage.submitSignup();

    const error = await signupPage.getErrorMessage();
    expect(error).toContain(/email.*already.*exists/i);
  });

  test('should auto-login user after successful signup', async ({ page }) => {
    const uniqueEmail = `auto-login-${Date.now()}@test.com`;

    await signupPage.fillEmail(uniqueEmail);
    await signupPage.fillPassword('password123');
    await signupPage.fillTenantName('Auto Login Company');
    await signupPage.fillAdminName('Auto Login Admin');
    await signupPage.submitSignup();

    // Should be on dashboard, not redirected to login
    await signupPage.waitForDashboard();
    await expect(signupPage.isOnDashboard()).resolves.toBe(true);
    await expect(signupPage.isOnSignupPage()).resolves.toBe(false);
  });
});
