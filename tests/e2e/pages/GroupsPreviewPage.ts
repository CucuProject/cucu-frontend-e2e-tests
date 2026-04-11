import { Page, expect } from '@playwright/test';

export class GroupsPreviewPage {
  constructor(private page: Page) {}

  async goto(groupId: string) {
    await this.page.goto(`/setup/groups/preview/${groupId}`);
  }

  async gotoWithSlug(tenantSlug: string, groupId: string) {
    await this.page.goto(`/t/${tenantSlug}/setup/groups/preview/${groupId}`);
  }

  // Section visibility checks
  async isSectionVisible(title: string): Promise<boolean> {
    const section = this.page.getByText(title, { exact: false });
    return await section.isVisible();
  }

  // Field state checks (preview mode should have disabled fields)
  async isFieldDisabled(label: string): Promise<boolean> {
    const field = this.page.getByLabel(label);
    return await field.isDisabled();
  }

  async isFieldVisible(label: string): Promise<boolean> {
    const field = this.page.getByLabel(label);
    return await field.isVisible();
  }

  // Wait helpers
  async waitForSection(title: string) {
    await expect(this.page.getByText(title, { exact: false })).toBeVisible();
  }

  // Header actions
  async isHeaderToggleChecked(): Promise<boolean> {
    const toggle = this.page.getByRole('checkbox');
    return await toggle.isChecked();
  }

  async getFieldValue(label: string): Promise<string> {
    const field = this.page.getByLabel(label);
    return await field.inputValue();
  }

  // Groups specific
  async getSelectedGroupsCount(): Promise<number> {
    // This depends on your UI - adjust selector accordingly
    const selectedGroups = this.page.locator('.selected-group-option');
    return await selectedGroups.count();
  }
}
