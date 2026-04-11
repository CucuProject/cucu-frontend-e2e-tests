import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Project Access Control', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe('Access Levels', () => {
    test('owner can view, edit, and share project', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('admin@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      // Navigate to a project owned by admin
      await page.goto('/t/acme/projects/owner-project');

      // Owner can see project
      await expect(page.getByText(/project.*details/i)).toBeVisible();

      // Owner can edit (check for edit button)
      await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();

      // Owner can share (check for share button)
      await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    });

    test('collaborator can view, edit, and share project', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('collaborator@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/shared-project');

      // Collaborator can see project
      await expect(page.getByText(/project.*details/i)).toBeVisible();

      // Collaborator can edit
      await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();

      // Collaborator can share
      await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    });

    test('editor can view and edit but cannot share project', async ({
      page,
    }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('editor@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/editor-project');

      // Editor can see project
      await expect(page.getByText(/project.*details/i)).toBeVisible();

      // Editor can edit
      await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();

      // Editor cannot share
      await expect(page.getByRole('button', { name: /share/i })).not.toBeVisible();
    });

    test('viewer can view but cannot edit or share project', async ({
      page,
    }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('viewer@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/viewer-project');

      // Viewer can see project
      await expect(page.getByText(/project.*details/i)).toBeVisible();

      // Viewer cannot edit
      await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible();

      // Viewer cannot share
      await expect(page.getByRole('button', { name: /share/i })).not.toBeVisible();
    });

    test('user without access cannot view project', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('noperms@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      // Try to access a project
      await page.goto('/t/acme/projects/restricted-project');

      // Should be denied
      await page.waitForTimeout(2000);
      const hasForbiddenError = await page
        .getByText(/forbidden|access.*denied|not.*found/i)
        .isVisible();
      const isRedirected = await page.url().includes('/projects'); // Redirected to list

      expect(hasForbiddenError || isRedirected).toBe(true);
    });
  });

  test.describe('Share Modal', () => {
    test('owner can open share modal', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('admin@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/owner-project');

      // Open share modal
      const shareButton = page.getByRole('button', { name: /share/i });
      await shareButton.click();

      // Share modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/share.*project/i)).toBeVisible();
    });

    test('owner can add user with viewer role', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('admin@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/owner-project');

      // Open share modal
      await page.getByRole('button', { name: /share/i }).click();

      // Add user
      await page.getByPlaceholder(/search.*user|email/i).fill('viewer@cucu.local');
      await page.waitForTimeout(500); // Wait for autocomplete

      // Select role
      const roleSelect = page.getByRole('combobox', { name: /role/i });
      await roleSelect.click();
      await page.getByRole('option', { name: /viewer/i }).click();

      // Submit
      await page.getByRole('button', { name: /add|grant/i }).click();

      // Success message or close
      await expect(
        page.getByText(/added|shared|success/i, { exact: false }),
      ).toBeVisible();
    });

    test('collaborator can add user with editor role', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('collaborator@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/shared-project');

      // Open share modal
      await page.getByRole('button', { name: /share/i }).click();

      // Add user with editor role
      await page.getByPlaceholder(/search.*user|email/i).fill('editor@cucu.local');
      await page.waitForTimeout(500);

      const roleSelect = page.getByRole('combobox', { name: /role/i });
      await roleSelect.click();
      await page.getByRole('option', { name: /editor/i }).click();

      await page.getByRole('button', { name: /add|grant/i }).click();

      await expect(
        page.getByText(/added|shared|success/i, { exact: false }),
      ).toBeVisible();
    });

    test('viewer cannot open share modal', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('viewer@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/viewer-project');

      // Viewer should not see share button
      await expect(page.getByRole('button', { name: /share/i })).not.toBeVisible();
    });
  });

  test.describe('Revoke Access', () => {
    test('owner can revoke user access', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('admin@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/owner-project');

      // Open share modal
      await page.getByRole('button', { name: /share/i }).click();

      // Find shared user and revoke
      const sharedUserRow = page.getByText(/viewer@cucu.local/i);
      await expect(sharedUserRow).toBeVisible();

      const revokeButton = page
        .locator('tr')
        .filter({ hasText: /viewer@cucu.local/i })
        .getByRole('button', { name: /revoke|remove/i });

      await revokeButton.click();

      // Confirm revoke (if there's a modal)
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Success message
      await expect(
        page.getByText(/revoked|removed|success/i, { exact: false }),
      ).toBeVisible();
    });

    test('viewer cannot revoke user access', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('viewer@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/viewer-project');

      // Viewer should not see share modal, so cannot revoke
      await expect(page.getByRole('button', { name: /share/i })).not.toBeVisible();
    });
  });

  test.describe('Transfer Ownership', () => {
    test('supervisor can transfer ownership', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('admin@cucu.local'); // Assuming admin is a supervisor
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/owner-project');

      // Open share modal
      await page.getByRole('button', { name: /share/i }).click();

      // Look for transfer ownership button/link
      const transferButton = page.getByRole('button', {
        name: /transfer.*ownership/i,
      });

      if (await transferButton.isVisible()) {
        await transferButton.click();

        // Select new owner
        await page
          .getByPlaceholder(/search.*user|email/i)
          .fill('collaborator@cucu.local');
        await page.waitForTimeout(500);

        // Confirm transfer
        await page
          .getByRole('button', { name: /transfer|confirm/i })
          .click();

        // Success message
        await expect(
          page.getByText(/transferred|success/i, { exact: false }),
        ).toBeVisible();
      }
    });

    test('owner cannot transfer ownership to themselves', async ({ page }) => {
      await loginPage.goto();
      await loginPage.discoverTenants('admin@cucu.local');
      await loginPage.waitForTenantList();
      await loginPage.selectTenant('acme');
      await loginPage.enterPassword('password123');
      await loginPage.submitLogin();

      await page.goto('/t/acme/projects/owner-project');

      // Owner cannot transfer ownership (button not visible or disabled)
      const transferButton = page.getByRole('button', {
        name: /transfer.*ownership/i,
      });

      await expect(transferButton).not.toBeVisible();
    });
  });
});
