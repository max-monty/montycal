import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Monty Cal - Comprehensive Tests', () => {

  test('1. Page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });

    if (errors.length > 0) {
      console.log('JS ERRORS FOUND:', JSON.stringify(errors, null, 2));
    }
    expect(errors).toHaveLength(0);
  });

  test('2. App renders with header and grid', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('Monty Cal')).toBeVisible();
    await expect(page.getByText('JAN')).toBeVisible();
    await expect(page.getByText('FEB')).toBeVisible();
    await expect(page.getByText('DEC')).toBeVisible();
    // Grid cells exist (no day-header row anymore; day numbers visible at higher zoom)
    const gridCells = page.locator('.cursor-pointer');
    expect(await gridCells.count()).toBeGreaterThan(300);
  });

  test('3. Year navigation works', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const currentYear = new Date().getFullYear();

    await expect(page.getByText(String(currentYear))).toBeVisible();
    await page.getByText('›').click();
    await expect(page.getByText(String(currentYear + 1))).toBeVisible();
    await page.getByText('‹').click();
    await page.getByText('‹').click();
    await expect(page.getByText(String(currentYear - 1))).toBeVisible();
  });

  test('4. Zoom controls work', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    await page.getByText('+').click();
    await page.getByText('−').click();
  });

  test('5. Click cell opens modal', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const cells = page.locator('.cursor-pointer');
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(0);

    await cells.first().click();
    await expect(page.getByText('+ Add Event')).toBeVisible({ timeout: 3000 });
  });

  test('6. Create event with start and end time', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const cells = page.locator('.cursor-pointer');
    await cells.first().click();
    await page.getByText('+ Add Event').click();

    // Fill title
    await page.locator('input[placeholder="Event title..."]').fill('Team Meeting');

    // Fill start time and end time
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.first().fill('09:00');
    await timeInputs.nth(1).fill('10:30');

    // Submit
    await page.getByRole('button', { name: 'Add Event' }).click();

    // Event should appear with time range
    await expect(page.getByText('Team Meeting')).toBeVisible();
    await expect(page.getByText('09:00 – 10:30')).toBeVisible();
  });

  test('7. Event persists after modal close and reopen', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const cells = page.locator('.cursor-pointer');
    await cells.first().click();

    await page.getByText('+ Add Event').click();
    await page.locator('input[placeholder="Event title..."]').fill('Persistent Event');
    await page.getByRole('button', { name: 'Add Event' }).click();
    await expect(page.getByText('Persistent Event')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("✕")').first().click();

    // Reopen same cell
    await cells.first().click();
    await expect(page.getByText('Persistent Event')).toBeVisible();
  });

  test('8. Sidebar opens and shows categories', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const hamburger = page.locator('header button').first();
    await hamburger.click();

    await expect(page.getByText('Categories')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Dad')).toBeVisible();
    await expect(page.getByText('Mom')).toBeVisible();
    await expect(page.getByText('Kids')).toBeVisible();
  });

  test('9. View mode toggle works', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    await page.getByText('Rolling 12').click();
    await page.getByText('Infinite').click();
    await page.getByText('Year').click();

    const currentYear = new Date().getFullYear();
    await expect(page.getByText(String(currentYear))).toBeVisible();
  });

  test('10. Today button works', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    await page.getByText('Today').click();
    await expect(page.getByText('Monty Cal')).toBeVisible();
  });

  test('11. Modal close with escape key', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const cells = page.locator('.cursor-pointer');
    await cells.first().click();
    await expect(page.getByText('+ Add Event')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(page.getByText('+ Add Event')).not.toBeVisible({ timeout: 3000 });
  });

  test('12. Day notes can be added', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const cells = page.locator('.cursor-pointer');
    await cells.first().click();

    const notesField = page.locator('textarea[placeholder="Day notes..."]');
    await notesField.fill('My test note');
    await notesField.blur();

    await page.keyboard.press('Escape');
    await cells.first().click();

    await expect(page.locator('textarea[placeholder="Day notes..."]')).toHaveValue('My test note');
  });

  test('13. Default zoom fills the screen reasonably', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Slider at 0 should still show a visible grid
    const slider = page.locator('input[type="range"]');
    const value = await slider.inputValue();
    expect(parseFloat(value)).toBe(0);
    // JAN and DEC should both be visible at default zoom
    await expect(page.getByText('JAN')).toBeVisible();
    await expect(page.getByText('DEC')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/default-zoom.png', fullPage: false });
  });

  test('14. Screenshot - zoomed in', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    for (let i = 0; i < 5; i++) {
      await page.getByText('+').click();
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/zoomed-in.png', fullPage: false });
  });

  test('15. Screenshot - modal with event form', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const cells = page.locator('.cursor-pointer');
    await cells.first().click();
    await page.getByText('+ Add Event').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/modal-event-form.png', fullPage: false });
  });

  test('16. Screenshot - sidebar with categories', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.locator('header button').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/sidebar-open.png', fullPage: false });
  });

  test('17. Theme toggle switches between light and dark', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Default is dark mode
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Click theme toggle (sun icon button)
    const themeBtn = page.locator('header button[title*="light mode"]');
    await themeBtn.click();
    await expect(html).toHaveClass(/light/);

    await page.screenshot({ path: 'e2e/screenshots/light-mode.png', fullPage: false });

    // Toggle back to dark
    const themeBtnDark = page.locator('header button[title*="dark mode"]');
    await themeBtnDark.click();
    await expect(html).toHaveClass(/dark/);

    await page.screenshot({ path: 'e2e/screenshots/dark-mode.png', fullPage: false });
  });

  test('18. Sticky month labels stay fixed when scrolling right', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Zoom in so we can scroll horizontally
    for (let i = 0; i < 5; i++) {
      await page.getByText('+').click();
    }
    await page.waitForTimeout(300);

    // Scroll right
    const grid = page.locator('.flex-1.overflow-auto');
    await grid.evaluate((el) => { el.scrollLeft = 500; });
    await page.waitForTimeout(200);

    // Month labels should still be visible (sticky)
    await expect(page.getByText('JAN')).toBeVisible();
    await expect(page.getByText('FEB')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/sticky-labels-scrolled.png', fullPage: false });
  });

  test('19. Mobile viewport works', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE, { waitUntil: 'networkidle' });

    expect(errors).toHaveLength(0);
    await expect(page.getByText('Monty Cal')).toBeVisible();
    await expect(page.getByText('JAN')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/mobile.png', fullPage: false });
    await context.close();
  });

});
