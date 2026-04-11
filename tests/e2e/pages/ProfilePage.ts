import { Page, expect } from '@playwright/test';

export class ProfilePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/account/profile');
  }

  async gotoWithSlug(tenantSlug: string) {
    await this.page.goto(`/t/${tenantSlug}/account/profile`);
  }

  // Section editing
  async editAuthDataSection() {
    await this.page.getByRole('button', { name: /modifica dati anagrafici/i }).click();
  }

  async editPersonalDataSection() {
    await this.page.getByRole('button', { name: /modifica dati personali/i }).click();
  }

  async editRoleOrganizationSection() {
    await this.page.getByRole('button', { name: /modifica ruolo e organizzazione/i }).click();
  }

  // Form actions
  async saveForm() {
    await this.page.getByRole('button', { name: /salva/i }).click();
  }

  async cancelForm() {
    await this.page.getByRole('button', { name: /annulla/i }).click();
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

  async isSectionInEditMode(sectionTitle: string): Promise<boolean> {
    // Check if section is in edit mode (edit button is replaced by save/cancel)
    const editButton = this.page.getByRole('button', {
      name: new RegExp(`modifica.*${sectionTitle}`, 'i'),
    });
    return !(await editButton.isVisible());
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
    // Wait for save/cancel buttons to appear
    await expect(this.page.getByRole('button', { name: /salva/i })).toBeVisible();
  }

  async waitForViewMode() {
    // Wait for save/cancel buttons to disappear
    await expect(this.page.getByRole('button', { name: /salva/i })).not.toBeVisible();
  }
}
