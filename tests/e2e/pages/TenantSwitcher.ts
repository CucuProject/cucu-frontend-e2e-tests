import { Page, expect } from '@playwright/test';

export class TenantSwitcher {
  constructor(private page: Page) {}

  async openTenantSwitcher() {
    // Tenant switcher typically in header
    const switcherButton = this.page.getByRole('button', {
      name: /switch.*tenant|cambia.*tenant/i,
    });
    await switcherButton.click();
  }

  async selectTenant(tenantSlug: string) {
    const tenantOption = this.page.getByText(tenantSlug, { exact: false });
    await tenantOption.click();
  }

  async getCurrentTenantSlug(): Promise<string> {
    const tenantIndicator = this.page.locator('[data-testid="current-tenant"]');
    return await tenantIndicator.textContent() ?? '';
  }

  async isTenantSwitcherVisible(): Promise<boolean> {
    const switcher = this.page.locator('[data-testid="tenant-switcher"]');
    return await switcher.isVisible();
  }

  async isTenantListVisible(): Promise<boolean> {
    const tenantList = this.page.locator('[data-testid="tenant-list"]');
    return await tenantList.isVisible();
  }

  async getAvailableTenants(): Promise<string[]> {
    const tenantItems = this.page.locator('[data-testid="tenant-list"] li');
    const tenants = await tenantItems.allTextContents();
    return tenants;
  }

  async waitForTenantSwitch(tenantSlug: string, timeout: number = 10000) {
    await this.page.waitForURL(new RegExp(tenantSlug), { timeout });
  }

  async isTenantSelected(tenantSlug: string): Promise<boolean> {
    const currentTenant = await this.getCurrentTenantSlug();
    return currentTenant.includes(tenantSlug);
  }
}
