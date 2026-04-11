import { Page, expect } from '@playwright/test';

/**
 * Wait for a field to be visible and enabled
 */
export async function waitForFieldEnabled(page: Page, label: string) {
  const field = page.getByLabel(label);
  await expect(field).toBeVisible({ timeout: 5000 });
  await expect(field).toBeEnabled({ timeout: 5000 });
}

/**
 * Wait for a field to be visible and disabled
 */
export async function waitForFieldDisabled(page: Page, label: string) {
  const field = page.getByLabel(label);
  await expect(field).toBeVisible({ timeout: 5000 });
  await expect(field).toBeDisabled({ timeout: 5000 });
}

/**
 * Check if a field is disabled
 */
export async function isFieldDisabled(page: Page, label: string): Promise<boolean> {
  const field = page.getByLabel(label);
  return await field.isDisabled();
}

/**
 * Check if a section is visible
 */
export async function isSectionVisible(page: Page, title: string): Promise<boolean> {
  const section = page.getByText(title, { exact: false });
  return await section.isVisible();
}

/**
 * Click edit button for a section
 */
export async function editSection(page: Page, section: string) {
  const editButton = page.getByRole('button', {
    name: new RegExp(`modifica.*${section}|edit.*${section}`, 'i'),
  });
  await editButton.click();
}

/**
 * Click save button
 */
export async function saveForm(page: Page) {
  const saveButton = page.getByRole('button', { name: /salva|save/i });
  await saveButton.click();
}

/**
 * Click cancel button
 */
export async function cancelForm(page: Page) {
  const cancelButton = page.getByRole('button', { name: /annulla|cancel/i });
  await cancelButton.click();
}
