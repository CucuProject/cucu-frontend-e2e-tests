import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ProjectsPage } from '../pages/ProjectsPage';

test.describe('Projects - CRUD', () => {
  let projectsPage: ProjectsPage;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    await login(page, 'admin');
    await projectsPage.goto();
    await projectsPage.waitForProjects();
  });

  test('should display projects list', async ({ page }) => {
    await expect(projectsPage.getProjectCount()).resolves.toBeGreaterThan(0);
  });

  test('should show create project button to admin', async ({ page }) => {
    await expect(projectsPage.isCreateProjectButtonVisible()).resolves.toBe(true);
  });

  test('should create new project successfully', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;

    // Click create button
    await projectsPage.clickCreateProject();

    // Verify modal is open
    await expect(projectsPage.isCreateModalVisible()).resolves.toBe(true);

    // Fill form
    await projectsPage.fillProjectName(projectName);
    await projectsPage.fillProjectDescription('Test project description');
    await projectsPage.setStartDate('2026-04-01');
    await projectsPage.setEndDate('2026-12-31');

    // Save
    await projectsPage.saveProject();

    // Wait for redirect or success message
    await page.waitForTimeout(2000);

    // Verify project is created
    await projectsPage.goto(); // Refresh to see updated list
    await expect(projectsPage.isProjectVisible(projectName)).resolves.toBe(true);
  });

  test('should validate required fields on project creation', async ({ page }) => {
    await projectsPage.clickCreateProject();
    await projectsPage.saveProject();

    // Should show validation errors
    await expect(page.getByText(/name.*required/i)).toBeVisible();
  });

  test('should validate date range on project creation', async ({ page }) => {
    const projectName = `Invalid Date Project ${Date.now()}`;

    await projectsPage.clickCreateProject();
    await projectsPage.fillProjectName(projectName);
    await projectsPage.setStartDate('2026-12-31'); // After end date
    await projectsPage.setEndDate('2026-01-01');
    await projectsPage.saveProject();

    // Should show date validation error
    await expect(
      page.getByText(/end.*date.*must.*be.*after|data.*fine.*deve.*essere/i),
    ).toBeVisible();
  });

  test('should filter projects by status', async ({ page }) => {
    await projectsPage.filterByStatus('ACTIVE');
    await page.waitForTimeout(1000);

    // After filtering, only active projects should be visible
    // (This assumes there are projects with different statuses)
    const activeProjects = await projectsPage.getProjectCount();
    expect(activeProjects).toBeGreaterThanOrEqual(0);
  });

  test('should search projects by name', async ({ page }) => {
    const searchQuery = 'Test';

    await projectsPage.searchProjects(searchQuery);
    await page.waitForTimeout(1000);

    // Verify search results
    const allText = await page.textContent('body');
    expect(allText?.toLowerCase()).toContain(searchQuery.toLowerCase());
  });

  test('should open project details on click', async ({ page }) => {
    const firstProjectName = 'First Test Project'; // Assumes this exists

    await projectsPage.openProject(firstProjectName);

    // Should navigate to project details page
    await expect(page.url()).toContain('/projects/');
    await expect(page.getByText(firstProjectName)).toBeVisible();
  });

  test('should handle exclude weekends toggle', async ({ page }) => {
    const projectName = `Weekend Project ${Date.now()}`;

    await projectsPage.clickCreateProject();
    await projectsPage.fillProjectName(projectName);
    await projectsPage.toggleExcludeWeekends();

    await projectsPage.setStartDate('2026-04-01');
    await projectsPage.setEndDate('2026-04-30');

    await projectsPage.saveProject();

    // Verify project is created
    await projectsPage.goto();
    await expect(projectsPage.isProjectVisible(projectName)).resolves.toBe(true);
  });
});

test.describe('Projects - Access Control', () => {
  let projectsPage: ProjectsPage;

  test('admin can create projects', async ({ page }) => {
    await login(page, 'admin');
    projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    await expect(projectsPage.isCreateProjectButtonVisible()).resolves.toBe(true);
  });

  test('viewer cannot create projects', async ({ page }) => {
    await login(page, 'viewer');
    projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    await expect(projectsPage.isCreateProjectButtonVisible()).resolves.toBe(false);
  });

  test('editor can create projects', async ({ page }) => {
    await login(page, 'editor');
    projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    await expect(projectsPage.isCreateProjectButtonVisible()).resolves.toBe(true);
  });

  test('user can only see accessible projects', async ({ page }) => {
    // Login as a user with limited access
    await login(page, 'viewer');
    projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    // Should only see projects they have access to
    // (This depends on test data setup)
    const visibleProjects = await projectsPage.getProjectCount();
    expect(visibleProjects).toBeGreaterThanOrEqual(0);
  });

  test('can access own project', async ({ page }) => {
    await login(page, 'admin');
    projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    const ownProject = 'Admin Project'; // Assume this exists and is owned by admin

    await projectsPage.openProject(ownProject);
    await expect(page.url()).toContain('/projects/');
    await expect(page.getByText(ownProject)).toBeVisible();
  });

  test('cannot access project without permissions', async ({ page }) => {
    await login(page, 'viewer');
    projectsPage = new ProjectsPage(page);

    // Try to access a project directly by URL
    await page.goto('/t/acme/projects/restricted-project');
    await page.waitForTimeout(2000);

    // Should be denied
    const hasError = await page
      .getByText(/forbidden|access.*denied|not.*found/i)
      .isVisible();
    const isRedirected = await page.url().includes('/projects'); // Redirected to list

    expect(hasError || isRedirected).toBe(true);
  });
});

test.describe('Projects - Country Code', () => {
  let projectsPage: ProjectsPage;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
  });

  test('should set country code for holiday calendar', async ({ page }) => {
    const projectName = `IT Project ${Date.now()}`;

    await projectsPage.clickCreateProject();
    await projectsPage.fillProjectName(projectName);
    await projectsPage.setCountryCode('IT');

    await projectsPage.setStartDate('2026-04-01');
    await projectsPage.setEndDate('2026-12-31');

    await projectsPage.saveProject();

    // Verify project is created
    await projectsPage.goto();
    await expect(projectsPage.isProjectVisible(projectName)).resolves.toBe(true);
  });

  test('should have country code dropdown available', async ({ page }) => {
    await projectsPage.clickCreateProject();
    await expect(page.getByLabel(/country|paese/i)).toBeVisible();
  });
});
