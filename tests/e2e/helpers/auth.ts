import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name?: string;
  hasEditPermissions?: boolean;
}

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: 'admin@cucu.local',
    password: 'password123',
    name: 'Admin User',
    hasEditPermissions: true,
  },
  limited: {
    email: 'limited@cucu.local',
    password: 'password123',
    name: 'Limited User',
    hasEditPermissions: false,
  },
  viewer: {
    email: 'viewer@cucu.local',
    password: 'password123',
    name: 'Viewer User',
    hasEditPermissions: false,
  },
  'no-perms': {
    email: 'noperms@cucu.local',
    password: 'password123',
    name: 'No Perms User',
    hasEditPermissions: false,
  },
  multiTenant: {
    email: 'multitenant@cucu.local',
    password: 'password123',
    name: 'Multi-Tenant User',
    hasEditPermissions: true,
  },
  collaborator: {
    email: 'collaborator@cucu.local',
    password: 'password123',
    name: 'Collaborator User',
    hasEditPermissions: true,
  },
  editor: {
    email: 'editor@cucu.local',
    password: 'password123',
    name: 'Editor User',
    hasEditPermissions: true,
  },
};

export async function login(
  page: Page,
  user: keyof typeof TEST_USERS,
  tenantSlug?: string,
) {
  const { email, password } = TEST_USERS[user];

  await page.goto('/login');

  // Fill email
  await page.fill('input[type="email"]', email);

  // Click discover/next
  await page.click('button:has-text("Continua")');

  // Wait for tenant list (or skip if single tenant)
  await page.waitForTimeout(1000);

  const tenantList = page.locator('[data-testid="tenant-list"]');
  if (await tenantList.isVisible()) {
    // Select tenant
    const targetTenant = tenantSlug || 'acme';
    await page.click(`[data-testid="tenant-option"]:has-text("${targetTenant}")`);
  }

  // Fill password
  await page.fill('input[type="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  // Verify login was successful
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/dashboard/);
}

export async function loginDirect(
  page: Page,
  user: keyof typeof TEST_USERS,
) {
  // For testing purposes, direct login without tenant discovery
  // This may not be supported in production - use for local testing only
  const { email, password } = TEST_USERS[user];

  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  expect(page.url()).toMatch(/\/dashboard/);
}

export async function logout(page: Page) {
  // Find logout button (adjust selector based on your actual UI)
  const logoutButton = page.getByRole('button', { name: /logout|esci/i });
  await logoutButton.click();

  // Wait for redirect to login
  await page.waitForURL(/\/login/, { timeout: 5000 });
}

export async function waitForPermissionsToLoad(page: Page) {
  // Wait for permissions to be loaded
  await page.waitForTimeout(500);
}
