import { Page, expect } from '@playwright/test';

export class ProjectsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/projects');
  }

  async gotoWithSlug(tenantSlug: string) {
    await this.page.goto(`/t/${tenantSlug}/projects`);
  }

  async clickCreateProject() {
    const createButton = this.page.getByRole('button', {
      name: /create.*project|nuovo.*progetto/i,
    });
    await createButton.click();
  }

  async isCreateProjectButtonVisible(): Promise<boolean> {
    const createButton = this.page.getByRole('button', {
      name: /create.*project|nuovo.*progetto/i,
    });
    return await createButton.isVisible();
  }

  async getProjectCount(): Promise<number> {
    const projectCards = this.page.locator('[data-testid="project-card"]');
    return await projectCards.count();
  }

  async openProject(projectName: string) {
    const projectLink = this.page.getByRole('link', {
      name: new RegExp(projectName, 'i'),
    });
    await projectLink.click();
  }

  async searchProjects(query: string) {
    const searchInput = this.page.getByPlaceholder(/search.*projects|cerca.*progetti/i);
    await searchInput.fill(query);
  }

  async filterByStatus(status: string) {
    const statusFilter = this.page.getByRole('combobox', {
      name: /status|stato/i,
    });
    await statusFilter.click();
    await this.page.getByRole('option', { name: new RegExp(status, 'i') }).click();
  }

  async isProjectVisible(projectName: string): Promise<boolean> {
    const projectCard = this.page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: new RegExp(projectName, 'i') });
    return await projectCard.isVisible();
  }

  async waitForProjects() {
    await expect(this.page.locator('[data-testid="project-list"]')).toBeVisible();
  }

  // Form methods (for create/edit modal)
  async fillProjectName(name: string) {
    const nameInput = this.page.getByLabel(/project.*name|nome.*progetto/i);
    await nameInput.fill(name);
  }

  async fillProjectDescription(description: string) {
    const descInput = this.page.getByLabel(/description|descrizione/i);
    await descInput.fill(description);
  }

  async setStartDate(date: string) {
    const startDateInput = this.page.getByLabel(/start.*date|data.*inizio/i);
    await startDateInput.fill(date);
  }

  async setEndDate(date: string) {
    const endDateInput = this.page.getByLabel(/end.*date|data.*fine/i);
    await endDateInput.fill(date);
  }

  async setCountryCode(code: string) {
    const countrySelect = this.page.getByLabel(/country|paese/i);
    await countrySelect.click();
    await this.page.getByRole('option', { name: new RegExp(code, 'i') }).click();
  }

  async toggleExcludeWeekends() {
    const toggle = this.page.getByLabel(/exclude.*weekends|escludi.*weekend/i);
    await toggle.check();
  }

  async saveProject() {
    const saveButton = this.page.getByRole('button', { name: /save|salva/i });
    await saveButton.click();
  }

  async cancelProject() {
    const cancelButton = this.page.getByRole('button', { name: /cancel|annulla/i });
    await cancelButton.click();
  }

  async isCreateModalVisible(): Promise<boolean> {
    const modal = this.page.getByRole('dialog', {
      name: /create.*project|nuovo.*progetto/i,
    });
    return await modal.isVisible();
  }
}
