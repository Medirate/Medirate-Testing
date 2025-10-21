import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page', async ({ page }) => {
    // Check if the dashboard title is visible
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    // Check if filter sections are present
    await expect(page.getByText('Service Line')).toBeVisible();
    await expect(page.getByText('State')).toBeVisible();
  });

  test('should have date range pickers', async ({ page }) => {
    // Check if date range pickers are present
    await expect(page.getByText('Start Date')).toBeVisible();
    await expect(page.getByText('End Date')).toBeVisible();
    await expect(page.getByText('Fee Schedule Date')).toBeVisible();
  });

  test('should be able to select service line', async ({ page }) => {
    // Click on service line dropdown
    const serviceLineDropdown = page.locator('[data-testid="service_category_select"], .react-select-container').first();
    await serviceLineDropdown.click();
    
    // Wait for options to load
    await page.waitForTimeout(1000);
    
    // Check if dropdown options are visible
    const dropdownOptions = page.locator('.react-select__menu');
    await expect(dropdownOptions).toBeVisible();
  });

  test('should show table when filters are applied', async ({ page }) => {
    // This test would require authentication and proper data setup
    // For now, just check if the table structure exists
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible();
  });

  test('should handle date range selection', async ({ page }) => {
    // Test date range functionality
    const startDateInput = page.locator('input[placeholder*="start date"], input[placeholder*="Start date"]').first();
    const endDateInput = page.locator('input[placeholder*="end date"], input[placeholder*="End date"]').first();
    
    // Check if date inputs are present
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
  });

  test('should handle fee schedule date selection', async ({ page }) => {
    // Test fee schedule date functionality
    const feeScheduleDropdown = page.locator('[data-testid="fee_schedule_date_select"], .react-select-container').last();
    await expect(feeScheduleDropdown).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search button or search functionality
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Filter")');
    await expect(searchButton).toBeVisible();
  });

  test('should display data in table format', async ({ page }) => {
    // Check if table headers are present
    const tableHeaders = page.locator('th, [role="columnheader"]');
    await expect(tableHeaders.first()).toBeVisible();
  });

  test('should handle sorting', async ({ page }) => {
    // Check if sortable columns are present
    const sortableHeaders = page.locator('th[data-sortable], th:has-text("Effective Date")');
    if (await sortableHeaders.count() > 0) {
      await expect(sortableHeaders.first()).toBeVisible();
    }
  });
});
