import { test, expect } from '@playwright/test';

test.describe('Profile-Onboarding Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8083');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should sync occupation/suboccupation/backgroundColor between Profile and Onboarding', async ({ page }) => {
    // Step 1: Open /profile
    await page.goto('http://localhost:8083/profile');
    await page.waitForLoadState('networkidle');

    // Wait for the form to load
    await page.waitForSelector('select[value="יופי וטיפוח"]', { timeout: 10000 });
    await page.waitForSelector('select[value="קוסמטיקה"]', { timeout: 10000 });
    await page.waitForSelector('input[value="ffffff"]', { timeout: 10000 });

    // Step 2: Change occupation, suboccupation, and background color
    // Change occupation to "מסעדנות"
    await page.selectOption('select[value="יופי וטיפוח"]', 'מסעדנות');
    
    // Wait for suboccupation options to update
    await page.waitForSelector('select[value="קוסמטיקה"]', { timeout: 5000 });
    
    // Change suboccupation to "בתי קפה"
    await page.selectOption('select[value="קוסמטיקה"]', 'בתי קפה');
    
    // Change background color to red
    const backgroundColorInput = page.locator('input[value="ffffff"]').first();
    await backgroundColorInput.fill('ff0000');

    // Step 3: Save the profile
    const saveButton = page.getByRole('button', { name: /שמור פרופיל/i });
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Step 4: Navigate to /onboarding
    await page.goto('http://localhost:8083/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 5: Verify that the values appeared correctly
    await page.waitForSelector('select[value="מסעדנות"]', { timeout: 10000 });
    await page.waitForSelector('select[value="בתי קפה"]', { timeout: 10000 });
    await page.waitForSelector('input[value="ff0000"]', { timeout: 10000 });

    // Verify the values are correct
    const occupationSelect = page.locator('select[value="מסעדנות"]').first();
    const suboccupationSelect = page.locator('select[value="בתי קפה"]').first();
    const backgroundColorInputOnboarding = page.locator('input[value="ff0000"]').first();

    await expect(occupationSelect).toHaveValue('מסעדנות');
    await expect(suboccupationSelect).toHaveValue('בתי קפה');
    await expect(backgroundColorInputOnboarding).toHaveValue('ff0000');

    // Step 6: Change one value and save
    // Change background color to green
    await backgroundColorInputOnboarding.fill('00ff00');

    // Find and click save button in onboarding
    const saveButtons = page.locator('button');
    const saveProfileButton = saveButtons.filter({ hasText: /שמור|Save/i }).first();
    await saveProfileButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Step 7: Return to /profile and verify the updated value appears
    await page.goto('http://localhost:8083/profile');
    await page.waitForLoadState('networkidle');

    // Wait for the form to load with updated values
    await page.waitForSelector('input[value="00ff00"]', { timeout: 10000 });

    // Verify the background color was updated
    const updatedBackgroundColorInput = page.locator('input[value="00ff00"]').first();
    await expect(updatedBackgroundColorInput).toHaveValue('00ff00');

    // Verify occupation and suboccupation are still correct
    const updatedOccupationSelect = page.locator('select[value="מסעדנות"]').first();
    const updatedSuboccupationSelect = page.locator('select[value="בתי קפה"]').first();

    await expect(updatedOccupationSelect).toHaveValue('מסעדנות');
    await expect(updatedSuboccupationSelect).toHaveValue('בתי קפה');
  });

  test('should handle missing profile data gracefully', async ({ page }) => {
    // Test with a new user (no profile data)
    await page.goto('http://localhost:8083/profile');
    await page.waitForLoadState('networkidle');

    // Should show loading or empty state, not crash
    await page.waitForTimeout(3000);

    // Check if the form loads with default values
    const occupationSelect = page.locator('select').first();
    await expect(occupationSelect).toBeVisible();
  });

  test('should validate required fields before saving', async ({ page }) => {
    await page.goto('http://localhost:8083/profile');
    await page.waitForLoadState('networkidle');

    // Clear required fields
    const companyInput = page.locator('input[placeholder*="חברה"]').first();
    await companyInput.fill('');

    const phoneInput = page.locator('input[placeholder*="050"]').first();
    await phoneInput.fill('');

    // Try to save without required fields
    const saveButton = page.getByRole('button', { name: /שמור פרופיל/i });
    await saveButton.click();

    // Should show validation error
    await page.waitForTimeout(1000);
    
    // Check for error message (might be in toast or alert)
    const errorMessage = page.locator('text=/שגיאה|error/i').first();
    await expect(errorMessage).toBeVisible();
  });
});




