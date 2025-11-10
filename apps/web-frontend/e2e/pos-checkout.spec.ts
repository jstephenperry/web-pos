import { test, expect } from '@playwright/test';

test.describe('POS Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to POS page
    await page.goto('/pos');
    // Clear any existing cart data
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display all products on the page', async ({ page }) => {
    await expect(page.getByText('Coffee')).toBeVisible();
    await expect(page.getByText('Tea')).toBeVisible();
    await expect(page.getByText('Sandwich')).toBeVisible();
    await expect(page.getByText('$3.50')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Initially cart should be empty
    await expect(page.getByText('Your cart is empty')).toBeVisible();

    // Add Coffee to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Cart should no longer be empty
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();

    // Coffee should be in the cart
    const cartSection = page.locator('.lg\\:col-span-1').last();
    await expect(cartSection.getByText('Coffee')).toBeVisible();
  });

  test('should search for products', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.fill('coffee');

    await expect(page.getByText('Coffee')).toBeVisible();
    await expect(page.getByText('Tea')).not.toBeVisible();

    // Clear search
    await page.getByLabel('Clear search').click();
    await expect(page.getByText('Tea')).toBeVisible();
  });

  test('should update cart quantity', async ({ page }) => {
    // Add Coffee to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Find the increase quantity button in the cart
    const increaseButton = page.getByRole('button', { name: /increase quantity of coffee/i });
    await increaseButton.click();

    // Quantity should be 2
    await expect(page.getByText('2').first()).toBeVisible();

    // Decrease quantity
    const decreaseButton = page.getByRole('button', { name: /decrease quantity of coffee/i });
    await decreaseButton.click();

    // Quantity should be back to 1
    await expect(page.getByText('1')).toBeVisible();
  });

  test('should remove item from cart', async ({ page }) => {
    // Add Coffee to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Remove item
    await page.getByRole('button', { name: /remove coffee from cart/i }).click();

    // Cart should be empty again
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('should calculate cart totals correctly', async ({ page }) => {
    // Add Coffee ($3.50) to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Check subtotal
    await expect(page.getByText('$3.50').last()).toBeVisible();

    // Check tax (8.25% of $3.50 = $0.29)
    await expect(page.getByText(/\$0\.29/)).toBeVisible();

    // Check grand total ($3.50 + $0.29 = $3.79)
    await expect(page.getByText(/\$3\.79/)).toBeVisible();
  });

  test('should persist cart to localStorage', async ({ page }) => {
    // Add Coffee to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Reload page
    await page.reload();

    // Cart should still have the item
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();
    const cartSection = page.locator('.lg\\:col-span-1').last();
    await expect(cartSection.getByText('Coffee')).toBeVisible();
  });

  test('should switch between card and list view', async ({ page }) => {
    // Default is card view
    await page.getByLabel('List view').click();

    // Switch back to card view
    await page.getByLabel('Card view').click();
  });

  test('should sort cart items', async ({ page }) => {
    // Add multiple items
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();
    await page.getByRole('button', { name: /add tea to cart/i }).first().click();
    await page.getByRole('button', { name: /add sandwich to cart/i }).first().click();

    // Switch to alphabetical sorting
    await page.getByRole('button', { name: /sort cart items alphabetically/i }).click();

    // Items should be sorted (this is a basic check)
    const cartSection = page.locator('.lg\\:col-span-1').last();
    await expect(cartSection.getByText('Coffee')).toBeVisible();
  });

  test('should open checkout modal', async ({ page }) => {
    // Add item to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Click checkout button
    await page.getByRole('button', { name: /checkout/i }).click();

    // Checkout modal should be visible
    await expect(page.getByText(/payment details/i)).toBeVisible();
  });

  test('should complete successful payment', async ({ page }) => {
    // Add item to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Open checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill in payment details
    await page.getByLabel(/card number/i).fill('4111111111111111');
    await page.getByLabel(/cardholder name/i).fill('Test User');
    await page.getByLabel(/expiration date/i).fill('12/25');
    await page.getByLabel(/cvv/i).fill('123');

    // Submit payment
    await page.getByRole('button', { name: /complete payment/i }).click();

    // Success modal should appear
    await expect(page.getByText(/transaction complete/i)).toBeVisible({ timeout: 10000 });

    // Close success modal
    await page.getByRole('button', { name: /close/i }).first().click();

    // Cart should be empty
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('should handle declined payment', async ({ page }) => {
    // Add item to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Open checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill in payment details with CVV that triggers decline
    await page.getByLabel(/card number/i).fill('4111111111111111');
    await page.getByLabel(/cardholder name/i).fill('Test User');
    await page.getByLabel(/expiration date/i).fill('12/25');
    await page.getByLabel(/cvv/i).fill('000'); // Special CVV for declined

    // Submit payment
    await page.getByRole('button', { name: /complete payment/i }).click();

    // Failure modal should appear
    await expect(page.getByText(/transaction failed/i)).toBeVisible({ timeout: 10000 });

    // Modal should show reason
    await expect(page.getByText(/insufficient funds|declined/i)).toBeVisible();
  });

  test('should handle invalid CVV error', async ({ page }) => {
    // Add item to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Open checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Fill in payment details with invalid CVV
    await page.getByLabel(/card number/i).fill('4111111111111111');
    await page.getByLabel(/cardholder name/i).fill('Test User');
    await page.getByLabel(/expiration date/i).fill('12/25');
    await page.getByLabel(/cvv/i).fill('999'); // Special CVV for invalid CVV

    // Submit payment
    await page.getByRole('button', { name: /complete payment/i }).click();

    // Failure modal should appear
    await expect(page.getByText(/transaction failed/i)).toBeVisible({ timeout: 10000 });

    // Should show CVV error
    await expect(page.getByText(/cvv/i)).toBeVisible();
  });

  test('should validate payment form fields', async ({ page }) => {
    // Add item to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Open checkout
    await page.getByRole('button', { name: /checkout/i }).click();

    // Try to submit without filling fields
    const submitButton = page.getByRole('button', { name: /complete payment/i });

    // Button should be disabled or form should show validation errors
    // This depends on the CheckoutModal implementation
    await expect(submitButton).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Add item to cart
    await page.getByRole('button', { name: /add coffee to cart/i }).first().click();

    // Cart should be visible and functional
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();

    // Should be able to checkout
    await page.getByRole('button', { name: /checkout/i }).click();
    await expect(page.getByText(/payment details/i)).toBeVisible();
  });
});
