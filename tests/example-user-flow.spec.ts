import { test, expect } from '@playwright/test';

test.describe('User Flow Tests', () => {
  test('complete dashboard workflow', async ({ page }) => {
    // Step 1: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Verify page loaded
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    
    // Step 3: Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/dashboard-initial.png' });
    
    // Step 4: Try to interact with service line filter
    const serviceLineDropdown = page.locator('.react-select-container').first();
    if (await serviceLineDropdown.isVisible()) {
      await serviceLineDropdown.click();
      await page.waitForTimeout(500);
      
      // Take screenshot of dropdown open
      await page.screenshot({ path: 'tests/screenshots/dashboard-dropdown-open.png' });
    }
    
    // Step 5: Check if table data loads
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible();
    
    // Step 6: Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/dashboard-final.png' });
  });

  test('test date range functionality', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test date range pickers
    const startDateInput = page.locator('input[type="date"], input[placeholder*="date"]').first();
    if (await startDateInput.isVisible()) {
      await startDateInput.click();
      await page.screenshot({ path: 'tests/screenshots/date-picker-test.png' });
    }
  });
});
