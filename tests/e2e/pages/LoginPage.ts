import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async gotoWithSlug(tenantSlug: string) {
    await this.page.goto(`/t/${tenantSlug}/login`);
  }

  async enterEmail(email: string) {
    await this.page.fill('input[type="email"]', email);
  }

  async discoverTenants(email: string) {
    await this.enterEmail(email);

    // Click discover/next button
    const discoverButton = this.page.getByRole('button', {
      name: /continua|discover|next/i,
    });
    await discoverButton.click();
  }

  async selectTenant(tenantSlug: string) {
    const tenantOption = this.page.getByText(tenantSlug, { exact: false });
    await tenantOption.click();
  }

  async enterPassword(password: string) {
    const passwordInput = this.page.getByLabel(/password/i);
    await passwordInput.fill(password);
  }

  async submitLogin() {
    const submitButton = this.page.getByRole('button', {
      name: /login|accedi|accedi/i,
    });
    await submitButton.click();
  }

  async isTenantSelectVisible(): Promise<boolean> {
    const tenantSelect = this.page.getByText(/select.*tenant|seleziona.*tenant/i);
    return await tenantSelect.isVisible();
  }

  async isTenantListVisible(): Promise<boolean> {
    const tenantList = this.page.locator('[data-testid="tenant-list"]');
    return await tenantList.isVisible();
  }

  async waitForDashboard(timeout: number = 10000) {
    await this.page.waitForURL(/\/dashboard/, { timeout });
  }

  async isOnLoginPage(): Promise<boolean> {
    return await this.page.url().includes('/login');
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

  async waitForTenantList(timeout: number = 5000) {
    await expect(this.page.locator('[data-testid="tenant-list"]')).toBeVisible({
      timeout,
    });
  }

  async getAvailableTenants(): Promise<string[]> {
    const tenantItems = this.page.locator('[data-testid="tenant-option"]');
    const tenants: string[] = [];
    const count = await tenantItems.count();
    for (let i = 0; i < count; i++) {
      const text = await tenantItems.nth(i).textContent();
      if (text) tenants.push(text);
    }
    return tenants;
  }
}
