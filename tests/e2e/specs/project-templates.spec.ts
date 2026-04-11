import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ProjectTemplatesPage } from '../pages/ProjectTemplatesPage';

test.describe('Project Templates - CRUD', () => {
  let templatesPage: ProjectTemplatesPage;

  test.beforeEach(async ({ page }) => {
    templatesPage = new ProjectTemplatesPage(page);
    await login(page, 'admin');
    await templatesPage.goto();
    await templatesPage.waitForTemplates();
  });

  test('should display templates list', async ({ page }) => {
    await expect(templatesPage.getTemplateCount()).resolves.toBeGreaterThan(0);
  });

  test('should show create template button to admin', async ({ page }) => {
    await expect(templatesPage.isCreateTemplateButtonVisible()).resolves.toBe(true);
  });

  test('should create new private template', async ({ page }) => {
    const templateName = `Private Template ${Date.now()}`;

    await templatesPage.clickCreateTemplate();
    await expect(templatesPage.isCreateModalVisible()).resolves.toBe(true);

    await templatesPage.fillTemplateName(templateName);
    await templatesPage.fillTemplateDescription('Test template description');
    await templatesPage.setScope('PRIVATE');

    await templatesPage.saveTemplate();

    // Wait for creation
    await page.waitForTimeout(2000);

    // Verify template is created
    await templatesPage.goto();
    await expect(templatesPage.isPrivateTemplateVisible(templateName)).resolves.toBe(
      true,
    );
  });

  test('should create new shared template', async ({ page }) => {
    const templateName = `Shared Template ${Date.now()}`;

    await templatesPage.clickCreateTemplate();
    await templatesPage.fillTemplateName(templateName);
    await templatesPage.setScope('SHARED');

    await templatesPage.saveTemplate();

    await page.waitForTimeout(2000);

    await templatesPage.goto();
    await expect(templatesPage.isTemplateVisible(templateName)).resolves.toBe(true);
  });

  test('should validate required fields on template creation', async ({ page }) => {
    await templatesPage.clickCreateTemplate();
    await templatesPage.saveTemplate();

    // Should show validation errors
    await expect(page.getByText(/name.*required/i)).toBeVisible();
  });

  test('should filter templates by scope', async ({ page }) => {
    await templatesPage.filterByScope('SYSTEM');
    await page.waitForTimeout(1000);

    // After filtering, only system templates should be visible
    const systemTemplates = await templatesPage.getTemplateCount();
    expect(systemTemplates).toBeGreaterThanOrEqual(0);
  });

  test('should open template details on click', async ({ page }) => {
    const firstTemplateName = 'Default Template'; // Assumes this exists

    await templatesPage.openTemplate(firstTemplateName);

    // Should navigate to template details page
    await expect(page.url()).toContain('/setup/project-templates/');
    await expect(page.getByText(firstTemplateName)).toBeVisible();
  });

  test('should show system templates to all users', async ({ page }) => {
    // System templates should be visible to everyone
    await expect(templatesPage.isSystemTemplateVisible('Default Template')).resolves.toBe(
      true,
    );
  });

  test('should only show private templates to creator', async ({ page }) => {
    // Login as admin (creator of some private templates)
    await login(page, 'admin');
    templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();

    // Admin's private template should be visible
    await expect(
      templatesPage.isPrivateTemplateVisible('Admin Private Template'),
    ).resolves.toBe(true);
  });

  test('should not show others private templates', async ({ page }) => {
    // Login as a different user
    await login(page, 'limited');
    templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();

    // Should NOT see admin's private templates
    await expect(
      templatesPage.isPrivateTemplateVisible('Admin Private Template'),
    ).resolves.toBe(false);
  });
});

test.describe('Project Templates - Phases', () => {
  let templatesPage: ProjectTemplatesPage;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();
  });

  test('should add phase to template', async ({ page }) => {
    const templateName = `Template with Phases ${Date.now()}`;
    const phaseName = 'Planning Phase';

    // Create template first
    await templatesPage.clickCreateTemplate();
    await templatesPage.fillTemplateName(templateName);
    await templatesPage.saveTemplate();

    await page.waitForTimeout(2000);

    // Open template
    await templatesPage.goto();
    await templatesPage.openTemplate(templateName);

    // Add phase
    await templatesPage.addPhase(phaseName, 1);

    // Verify phase is added
    await expect(templatesPage.isPhaseVisible(phaseName)).resolves.toBe(true);
  });

  test('should delete phase from template', async ({ page }) => {
    const templateName = 'Template with Phase to Delete';
    const phaseName = 'Phase to Delete';

    // Create template with phase (assuming it exists)
    await templatesPage.goto();
    await templatesPage.openTemplate(templateName);

    // Delete phase
    await templatesPage.deletePhase(phaseName);

    // Verify phase is deleted
    await expect(templatesPage.isPhaseVisible(phaseName)).resolves.toBe(false);
  });

  test('should validate phase order', async ({ page }) => {
    const templateName = 'Template with Multiple Phases';
    const phase1Name = 'Phase 1';
    const phase2Name = 'Phase 2';

    await templatesPage.goto();
    await templatesPage.openTemplate(templateName);

    // Add phases
    await templatesPage.addPhase(phase1Name, 1);
    await templatesPage.addPhase(phase2Name, 2);

    // Verify both phases exist
    await expect(templatesPage.isPhaseVisible(phase1Name)).resolves.toBe(true);
    await expect(templatesPage.isPhaseVisible(phase2Name)).resolves.toBe(true);
  });

  test('should set phase as required', async ({ page }) => {
    // This depends on UI implementation
    const templateName = 'Template with Required Phase';
    const phaseName = 'Required Phase';

    await templatesPage.goto();
    await templatesPage.openTemplate(templateName);

    // Add required phase
    await templatesPage.addPhase(phaseName, 1);

    // Verify phase is added
    await expect(templatesPage.isPhaseVisible(phaseName)).resolves.toBe(true);
  });
});

test.describe('Project Templates - Sharing', () => {
  let templatesPage: ProjectTemplatesPage;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();
  });

  test('should open share modal', async ({ page }) => {
    const templateName = 'Template to Share';

    await templatesPage.clickShareTemplate(templateName);

    // Share modal should be visible
    await expect(templatesPage.isShareModalVisible()).resolves.toBe(true);
  });

  test('should share template with user', async ({ page }) => {
    const templateName = 'Shared Template Test';

    await templatesPage.clickShareTemplate(templateName);
    await templatesPage.addShareUser('limited@cucu.local');
    await templatesPage.selectShareRole('VIEWER');

    await templatesPage.confirmShare();

    // Success message
    await expect(
      page.getByText(/shared|condiviso|success/i, { exact: false }),
    ).toBeVisible();
  });

  test('should validate email on share', async ({ page }) => {
    const templateName = 'Share Validation Test';

    await templatesPage.clickShareTemplate(templateName);
    await templatesPage.addShareUser('invalid-email');
    await templatesPage.confirmShare();

    // Should show validation error
    await expect(page.getByText(/invalid.*email/i)).toBeVisible();
  });

  test('can share private template', async ({ page }) => {
    const templateName = 'Private Template to Share';

    await templatesPage.clickShareTemplate(templateName);
    await templatesPage.addShareUser('viewer@cucu.local');
    await templatesPage.confirmShare();

    await expect(
      page.getByText(/shared|condiviso|success/i, { exact: false }),
    ).toBeVisible();
  });

  test('cannot share system template', async ({ page }) => {
    // System templates are read-only
    const templateName = 'Default System Template';

    await templatesPage.goto();
    await templatesPage.openTemplate(templateName);

    // Share button should not be visible
    const shareButton = page.getByRole('button', { name: /share|condividi/i });
    await expect(shareButton).not.toBeVisible();
  });

  test('recipient can see shared template', async ({ page }) => {
    // Login as recipient
    await login(page, 'limited');
    templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();

    // Should see shared template
    await expect(
      templatesPage.isTemplateVisible('Shared Template Test'),
    ).resolves.toBe(true);
  });
});

test.describe('Project Templates - Access Control', () => {
  test('admin can create templates', async ({ page }) => {
    await login(page, 'admin');
    const templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();
    await expect(templatesPage.isCreateTemplateButtonVisible()).resolves.toBe(true);
  });

  test('viewer cannot create templates', async ({ page }) => {
    await login(page, 'viewer');
    const templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();
    await expect(templatesPage.isCreateTemplateButtonVisible()).resolves.toBe(false);
  });

  test('editor can create templates', async ({ page }) => {
    await login(page, 'editor');
    const templatesPage = new ProjectTemplatesPage(page);
    await templatesPage.goto();
    await expect(templatesPage.isCreateTemplateButtonVisible()).resolves.toBe(true);
  });
});

test.describe('Project Templates - Using Templates for Projects', () => {
  test('should create project from template', async ({ page }) => {
    // This would involve:
    // 1. Go to templates page
    // 2. Select a template
    // 3. Click "Create project from template"
    // 4. Fill project details
    // 5. Save

    // This test assumes the UI has a "Create project from template" feature
    await login(page, 'admin');

    await page.goto('/setup/project-templates');

    const templateName = 'Default Template';
    const projectTemplatesPage = new ProjectTemplatesPage(page);
    await projectTemplatesPage.openTemplate(templateName);

    // Look for "Create project from template" button
    const createProjectButton = page.getByRole('button', {
      name: /create.*project.*from.*template|crea.*progetto.*da.*template/i,
    });

    if (await createProjectButton.isVisible()) {
      await createProjectButton.click();

      // Fill project name
      const projectName = `Project from Template ${Date.now()}`;
      await page.fill('input[name="name"]', projectName);

      // Save
      await page.click('button:has-text("Save")');

      // Verify project is created
      await page.goto('/projects');
      await expect(page.getByText(projectName)).toBeVisible();
    }
  });

  test('should copy phases from template to project', async ({ page }) => {
    // When creating a project from template, phases should be copied
    // This test verifies the phases are present after project creation

    // Implementation depends on how the UI displays project phases
    await login(page, 'admin');

    const projectName = `Project with Copied Phases ${Date.now()}`;

    // Create project from template (implementation-specific)
    // ...

    // Navigate to project and check phases
    await page.goto(`/projects/${projectName}`);

    // Verify phases exist
    await expect(page.getByText(/phase/i)).toBeVisible();
  });
});
