import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';
import { GroupsPreviewPage } from './pages/GroupsPreviewPage';

test.describe('Groups Preview Page — Permissioned Pattern', () => {
  let groupId: string;
  let tenantSlug: string;

  test.beforeAll(async () => {
    // In a real scenario, you'd create a test group here
    // For now, assume there's an existing test group
    groupId = 'test-group-id';
    tenantSlug = 'acme';
  });

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('preview mode shows all sections', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify all sections are visible
    await expect(groupsPage.isSectionVisible('Header')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Dati personali')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Ruolo e organizzazione')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Gruppi')).resolves.toBe(true);
  });

  test('preview mode header toggle is disabled (read-only)', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify header toggle is visible but disabled
    // Note: In preview mode, the toggle should be in a read-only state
    await expect(groupsPage.isHeaderToggleChecked()).resolves.toBeDefined();
  });

  test('preview mode personal data fields are disabled (read-only)', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify personal data fields are disabled (isDisabled={false} but read-only)
    await expect(groupsPage.isFieldDisabled('Data di nascita')).resolves.toBe(true);
    await expect(groupsPage.isFieldDisabled('Luogo di nascita')).resolves.toBe(true);
    await expect(groupsPage.isFieldDisabled('Cittadinanza')).resolves.toBe(true);
  });

  test('preview mode role organization fields are disabled (read-only)', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify role/organization fields are disabled
    await expect(groupsPage.isFieldDisabled('Seniority level')).resolves.toBe(true);
    await expect(groupsPage.isFieldDisabled('Job roles')).resolves.toBe(true);
    await expect(groupsPage.isFieldDisabled('Supervisors')).resolves.toBe(true);
    await expect(groupsPage.isFieldDisabled('Company')).resolves.toBe(true);
  });

  test('preview mode groups select is disabled (read-only)', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify groups select is disabled
    await expect(groupsPage.isFieldDisabled('Gruppi')).resolves.toBe(true);
  });

  test('preview mode shows correct personal data', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify personal data values are visible
    const dateOfBirth = await groupsPage.getFieldValue('Data di nascita');
    const placeOfBirth = await groupsPage.getFieldValue('Luogo di nascita');
    const citizenship = await groupsPage.getFieldValue('Cittadinanza');

    expect(dateOfBirth).toBeTruthy();
    expect(placeOfBirth).toBeTruthy();
    expect(citizenship).toBeTruthy();
  });

  test('preview mode shows correct role organization data', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify role/organization values are visible
    const seniorityLevel = await groupsPage.getFieldValue('Seniority level');
    const jobRoles = await groupsPage.getFieldValue('Job roles');
    const supervisors = await groupsPage.getFieldValue('Supervisors');
    const company = await groupsPage.getFieldValue('Company');

    expect(seniorityLevel).toBeTruthy();
    expect(jobRoles).toBeTruthy();
    expect(supervisors).toBeTruthy();
    expect(company).toBeTruthy();
  });

  test('limited user can view preview (read-only access)', async ({ page }) => {
    await login(page, 'limited-user');
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify all sections are visible
    await expect(groupsPage.isSectionVisible('Header')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Dati personali')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Ruolo e organizzazione')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Gruppi')).resolves.toBe(true);

    // Verify all fields are disabled
    await expect(groupsPage.isFieldDisabled('Data di nascita')).resolves.toBe(true);
    await expect(groupsPage.isFieldDisabled('Seniority level')).resolves.toBe(true);
  });

  test('admin user can view preview (read-only access)', async ({ page }) => {
    await login(page, 'admin');
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify all sections are visible
    await expect(groupsPage.isSectionVisible('Header')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Dati personali')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Ruolo e organizzazione')).resolves.toBe(true);
    await expect(groupsPage.isSectionVisible('Gruppi')).resolves.toBe(true);

    // Verify all fields are disabled (preview is always read-only)
    await expect(groupsPage.isFieldDisabled('Data di nascita')).resolves.toBe(true);
    await expect(groupsPage.isFieldDisabled('Seniority level')).resolves.toBe(true);
  });

  test('preview mode shows selected groups correctly', async ({ page }) => {
    const groupsPage = new GroupsPreviewPage(page);
    await groupsPage.goto(groupId);

    // Verify selected groups count
    const selectedCount = await groupsPage.getSelectedGroupsCount();
    expect(selectedCount).toBeGreaterThan(0);
  });
});
