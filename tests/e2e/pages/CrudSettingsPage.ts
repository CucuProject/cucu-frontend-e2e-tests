import { Page, expect } from '@playwright/test';

export class CrudSettingsPage {
  constructor(private page: Page) {}

  async goto(settingsType: string) {
    await this.page.goto(`/setup/settings/${settingsType}`);
  }

  async gotoWithSlug(tenantSlug: string, settingsType: string) {
    await this.page.goto(`/t/${tenantSlug}/setup/settings/${settingsType}`);
  }

  // Row actions
  async editRow(rowIndex: number) {
    const editButtons = this.page.getByRole('button', { name: /modifica|edit/i });
    await editButtons.nth(rowIndex).click();
  }

  async deleteRow(rowIndex: number) {
    const deleteButtons = this.page.getByRole('button', { name: /elimina|delete/i });
    await deleteButtons.nth(rowIndex).click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /conferma|confirm/i }).click();
  }

  // Form actions
  async saveForm() {
    await this.page.getByRole('button', { name: /salva|save/i }).click();
  }

  async cancelForm() {
    await this.page.getByRole('button', { name: /annulla|cancel/i }).click();
  }

  async createNew() {
    await this.page.getByRole('button', { name: /nuovo|create|add/i }).click();
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

  // Row value checks
  async getRowCount(): Promise<number> {
    const rows = this.page.locator('tbody tr');
    return await rows.count();
  }

  async getCellText(rowIndex: number, columnLabel: string): Promise<string> {
    const cell = this.page.locator(`tbody tr`).nth(rowIndex)
      .getByText(columnLabel);
    return await cell.textContent() || '';
  }

  // Wait helpers
  async waitForTable() {
    await expect(this.page.locator('tbody')).toBeVisible();
  }

  async waitForEditMode() {
    await expect(this.page.getByRole('button', { name: /salva/i })).toBeVisible();
  }

  async waitForViewMode() {
    await expect(this.page.getByRole('button', { name: /salva/i })).not.toBeVisible();
  }
}
