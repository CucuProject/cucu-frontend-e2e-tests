import { Page, expect } from '@playwright/test';

export class SignupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/signup');
  }

  async fillEmail(email: string) {
    await this.page.fill('input[type="email"]', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('input[type="password"]', password);
  }

  async fillTenantName(tenantName: string) {
    const tenantNameInput = this.page.getByLabel(/tenant.*name|company.*name/i);
    await tenantNameInput.fill(tenantName);
  }

  async fillTenantSlug(tenantSlug: string) {
    const tenantSlugInput = this.page.getByLabel(/tenant.*slug|company.*slug/i);
    await tenantSlugInput.fill(tenantSlug);
  }

  async fillAdminName(adminName: string) {
    const adminNameInput = this.page.getByLabel(/admin.*name|your.*name/i);
    await adminNameInput.fill(adminName);
  }

  async submitSignup() {
    const submitButton = this.page.getByRole('button', {
      name: /signup|registrati|crea.*tenant/i,
    });
    await submitButton.click();
  }

  async isTenantSlugAutoFilled(): Promise<boolean> {
    const tenantSlugInput = this.page.getByLabel(/tenant.*slug/i);
    const value = await tenantSlugInput.inputValue();
    return value !== '';
  }

  async getTenantSlugValue(): Promise<string> {
    const tenantSlugInput = this.page.getByLabel(/tenant.*slug/i);
    return await tenantSlugInput.inputValue();
  }

  async waitForDashboard(timeout: number = 10000) {
    await this.page.waitForURL(/\/dashboard/, { timeout });
  }

  async isOnSignupPage(): Promise<boolean> {
    return await this.page.url().includes('/signup');
  }

  async isOnDashboard(): Promise<boolean> {
    return await this.page.url().includes('/dashboard');
  }

  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  async isTenantNameRequiredErrorVisible(): Promise<boolean> {
    const errorElement = this.page.getByText(/tenant.*name.*required/i, {
      exact: false,
    });
    return await errorElement.isVisible();
  }

  async isEmailRequiredErrorVisible(): Promise<boolean> {
    const errorElement = this.page.getByText(/email.*required/i, {
      exact: false,
    });
    return await errorElement.isVisible();
  }

  async isPasswordRequiredErrorVisible(): Promise<boolean> {
    const errorElement = this.page.getByText(/password.*required/i, {
      exact: false,
    });
    return await errorElement.isVisible();
  }
}
