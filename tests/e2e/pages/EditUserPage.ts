import { Page, expect } from '@playwright/test';

export class EditUserPage {
  constructor(private page: Page) {}

  async goto(userId: string) {
    await this.page.goto(`/setup/people/${userId}/edit`);
  }

  async gotoWithSlug(tenantSlug: string, userId: string) {
    await this.page.goto(`/t/${tenantSlug}/setup/people/${userId}/edit`);
  }

  // Mode switching
  async enableEditMode() {
    await this.page.getByRole('button', { name: /modifica/i }).click();
  }

  async cancelEditMode() {
    await this.page.getByRole('button', { name: /annulla/i }).click();
  }

  // Form actions
  async saveForm() {
    await this.page.getByRole('button', { name: /salva/i }).click();
  }

  // Field state checks
  async isFieldDisabled(label: string): Promise<boolean> {
    const field = this.page.getByLabel(label);
    return await field.isDisabled();
  }

  async isFieldEnabled(label: string): Promise<boolean> {
    return !(await this.isFieldDisabled(label));
  }

  async isFieldVisible(label: string): Promise<boolean> {
    const field = this.page.getByLabel(label);
    return await field.isVisible();
  }

  async isSectionVisible(title: string): Promise<boolean> {
    const section = this.page.getByText(title, { exact: false });
    return await section.isVisible();
  }

  async isInEditMode(): Promise<boolean> {
    return await this.page.getByRole('button', { name: /salva/i }).isVisible();
  }

  // Field value manipulation
  async fillField(label: string, value: string) {
    const field = this.page.getByLabel(label);
    await field.fill(value);
  }

  async getFieldValue(label: string): Promise<string> {
    const field = this.page.getByLabel(label);
    return await field.inputValue();
  }

  // Wait helpers
  async waitForSection(title: string) {
    await expect(this.page.getByText(title, { exact: false })).toBeVisible();
  }

  async waitForEditMode() {
    await expect(this.page.getByRole('button', { name: /salva/i })).toBeVisible();
  }

  async waitForViewMode() {
    await expect(this.page.getByRole('button', { name: /salva/i })).not.toBeVisible();
  }

  // Select helpers
  async selectOption(label: string, option: string) {
    const select = this.page.getByLabel(label);
    await select.selectOption(option);
  }

  async selectMultipleOptions(label: string, options: string[]) {
    const select = this.page.getByLabel(label);
    await select.selectOption(options);
  }
}
