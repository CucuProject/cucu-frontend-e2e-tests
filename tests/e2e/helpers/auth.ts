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
    password: 'password',
    name: 'Admin User',
    hasEditPermissions: true,
  },
  'limited-user': {
    email: 'limited@cucu.local',
    password: 'password',
    name: 'Limited User',
    hasEditPermissions: false,
  },
  'no-perms': {
    email: 'noperms@cucu.local',
    password: 'password',
    name: 'No Perms User',
    hasEditPermissions: false,
  },
};

export async function login(page: Page, user: keyof typeof TEST_USERS) {
  const { email, password } = TEST_USERS[user];

  await page.goto('/login');

  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  // Verify login was successful
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/dashboard/);
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
