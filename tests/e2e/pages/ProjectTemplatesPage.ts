import { Page, expect } from '@playwright/test';

export class ProjectTemplatesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/setup/project-templates');
  }

  async gotoWithSlug(tenantSlug: string) {
    await this.page.goto(`/t/${tenantSlug}/setup/project-templates`);
  }

  async clickCreateTemplate() {
    const createButton = this.page.getByRole('button', {
      name: /create.*template|nuovo.*template/i,
    });
    await createButton.click();
  }

  async isCreateTemplateButtonVisible(): Promise<boolean> {
    const createButton = this.page.getByRole('button', {
      name: /create.*template|nuovo.*template/i,
    });
    return await createButton.isVisible();
  }

  async getTemplateCount(): Promise<number> {
    const templateCards = this.page.locator('[data-testid="template-card"]');
    return await templateCards.count();
  }

  async openTemplate(templateName: string) {
    const templateLink = this.page.getByRole('link', {
      name: new RegExp(templateName, 'i'),
    });
    await templateLink.click();
  }

  async filterByScope(scope: string) {
    const scopeFilter = this.page.getByRole('combobox', {
      name: /scope|ambito/i,
    });
    await scopeFilter.click();
    await this.page.getByRole('option', { name: new RegExp(scope, 'i') }).click();
  }

  async isTemplateVisible(templateName: string): Promise<boolean> {
    const templateCard = this.page
      .locator('[data-testid="template-card"]')
      .filter({ hasText: new RegExp(templateName, 'i') });
    return await templateCard.isVisible();
  }

  async isSystemTemplateVisible(templateName: string): Promise<boolean> {
    // System templates should be visible to all users
    return await this.isTemplateVisible(templateName);
  }

  async isPrivateTemplateVisible(templateName: string): Promise<boolean> {
    // Private templates only visible to creator
    return await this.isTemplateVisible(templateName);
  }

  async clickShareTemplate(templateName: string) {
    const templateCard = this.page
      .locator('[data-testid="template-card"]')
      .filter({ hasText: new RegExp(templateName, 'i') });
    const shareButton = templateCard.getByRole('button', {
      name: /share|condividi/i,
    });
    await shareButton.click();
  }

  async waitForTemplates() {
    await expect(this.page.locator('[data-testid="template-list"]')).toBeVisible();
  }

  // Form methods (for create/edit modal)
  async fillTemplateName(name: string) {
    const nameInput = this.page.getByLabel(/template.*name|nome.*template/i);
    await nameInput.fill(name);
  }

  async fillTemplateDescription(description: string) {
    const descInput = this.page.getByLabel(/description|descrizione/i);
    await descInput.fill(description);
  }

  async setScope(scope: string) {
    const scopeSelect = this.page.getByRole('combobox', { name: /scope|ambito/i });
    await scopeSelect.click();
    await this.page.getByRole('option', { name: new RegExp(scope, 'i') }).click();
  }

  async saveTemplate() {
    const saveButton = this.page.getByRole('button', { name: /save|salva/i });
    await saveButton.click();
  }

  async cancelTemplate() {
    const cancelButton = this.page.getByRole('button', { name: /cancel|annulla/i });
    await cancelButton.click();
  }

  async isCreateModalVisible(): Promise<boolean> {
    const modal = this.page.getByRole('dialog', {
      name: /create.*template|nuovo.*template/i,
    });
    return await modal.isVisible();
  }

  // Share modal methods
  async addShareUser(email: string) {
    const emailInput = this.page.getByPlaceholder(/email|user/i);
    await emailInput.fill(email);
    await this.page.waitForTimeout(500); // Wait for autocomplete
  }

  async selectShareRole(role: string) {
    const roleSelect = this.page.getByRole('combobox', { name: /role/i });
    await roleSelect.click();
    await this.page.getByRole('option', { name: new RegExp(role, 'i') }).click();
  }

  async confirmShare() {
    const shareButton = this.page.getByRole('button', {
      name: /share|condividi/i,
    });
    await shareButton.click();
  }

  async isShareModalVisible(): Promise<boolean> {
    const modal = this.page.getByRole('dialog', {
      name: /share.*template|condividi.*template/i,
    });
    return await modal.isVisible();
  }

  // Phase methods
  async addPhase(name: string, orderIndex: number) {
    const addButton = this.page.getByRole('button', {
      name: /add.*phase|aggiungi.*fase/i,
    });
    await addButton.click();

    const phaseNameInput = this.page.getByLabel(/phase.*name|nome.*fase/i);
    await phaseNameInput.fill(name);

    const orderInput = this.page.getByLabel(/order|ordine/i);
    await orderInput.fill(String(orderIndex));

    const saveButton = this.page.getByRole('button', { name: /save|salva/i });
    await saveButton.click();
  }

  async deletePhase(phaseName: string) {
    const phaseRow = this.page
      .locator('[data-testid="phase-row"]')
      .filter({ hasText: new RegExp(phaseName, 'i') });
    const deleteButton = phaseRow.getByRole('button', {
      name: /delete|elimina/i,
    });
    await deleteButton.click();

    // Confirm delete if prompted
    const confirmButton = this.page.getByRole('button', {
      name: /confirm|conferma/i,
    });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async isPhaseVisible(phaseName: string): Promise<boolean> {
    const phaseRow = this.page
      .locator('[data-testid="phase-row"]')
      .filter({ hasText: new RegExp(phaseName, 'i') });
    return await phaseRow.isVisible();
  }
}
