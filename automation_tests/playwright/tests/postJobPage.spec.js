import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsBidder } from '../utils/auth';
import { createProject } from '../utils/api';

test.describe('Post Job Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure a clean state for projects before each test if needed
    // For now, we assume the backend handles project cleanup or isolation.
  });

  test('TC-001 Owner successfully posts job via /post-job page', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Build responsive landing page');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Need a modern landing page with hero section and contact form');
    await page.fill('input[type="number"]', '500');
    await page.fill('input[type="date"]', '2026-05-15');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'React, CSS, Responsive Design');
    await page.click('button:has-text("Publish job")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.uw-job-row').first()).toContainText('Build responsive landing page');
    await expect(page.locator('.uw-job-row').first()).toContainText('Open');
    // No explicit validation error messages should be visible
    await expect(page.locator('.error-msg')).not.toBeVisible();
  });

  test('TC-002 Owner navigates to /post-job via nav link', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/');
    await page.click('nav a:has-text("Post a job")');

    await expect(page).toHaveURL('/post-job');
    await expect(page.locator('h1')).toHaveText('Post a fixed-price job');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. Build a responsive landing page"]')).toBeEmpty();
  });

  test('TC-003 Owner navigates to /post-job via footer link', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.click('footer a:has-text("Post a job")');

    await expect(page).toHaveURL('/post-job');
    await expect(page.locator('h1')).toHaveText('Post a fixed-price job');
    await expect(page.locator('form')).toBeVisible();
  });

  test('TC-004 Complete job posting flow from nav to browse', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/');
    await page.click('nav a:has-text("Post a job")');
    await expect(page).toHaveURL('/post-job');

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Mobile app UI design');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Design 5 screens for iOS app');
    await page.fill('input[type="number"]', '1200');
    await page.fill('input[type="date"]', '2026-06-01');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Figma, UI/UX, iOS');
    await page.click('button:has-text("Publish job")');

    await expect(page).toHaveURL('/');
    const newJobCard = page.locator('.uw-job-row').first();
    await expect(newJobCard).toContainText('Mobile app UI design');
    await expect(newJobCard).toContainText('$1,200');
    await expect(newJobCard).toContainText('Figma');
    await expect(newJobCard).toContainText('UI/UX');
    await expect(newJobCard).toContainText('iOS');
    await expect(newJobCard).toContainText('Open');
  });

  test('TC-005 ProjectsPage sidebar no longer contains expandable form', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/');

    await expect(page.locator('.uw-sidebar-card:has-text("Client tools")')).toBeVisible();
    await expect(page.locator('.uw-sidebar-card:has-text("Client tools")')).toContainText('Post a fixed-scope project for freelancers to bid on.');
    await expect(page.locator('.uw-sidebar-card:has-text("Client tools")').locator('a.btn-primary')).toHaveText('+ Post a new job');
    await expect(page.locator('.uw-sidebar-card:has-text("Client tools")').locator('a.btn-primary')).toHaveAttribute('href', '/post-job');
    await expect(page.locator('#post-project')).not.toBeVisible(); // Ensure old ID is gone
    await expect(page.locator('form')).not.toBeVisible(); // No inline form
  });

  test('TC-006 Non-owner (bidder) accesses /post-job route', async ({ page }) => {
    await loginAsBidder(page);
    await page.goto('/post-job');

    await expect(page.locator('h3')).toHaveText('Client access only');
    await expect(
      page.getByText('Only users with an owner account can post jobs.', { exact: false })
    ).toBeVisible();
    await expect(page.locator('a.btn-primary')).toHaveText('Browse jobs');
    await expect(page.locator('a.btn-primary')).toHaveAttribute('href', '/');
    await expect(page.locator('form')).not.toBeVisible();
  });

  test('TC-007 Form validation - all required fields empty', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    await page.click('button:has-text("Publish job")');

    await expect(page.locator('.form-group:has-text("Job title") .error-msg')).toHaveText('Required');
    await expect(page.locator('.form-group:has-text("Description") .error-msg')).toHaveText('Required');
    await expect(page.locator('.form-group:has-text("Budget") .error-msg')).toHaveText('Valid budget required');
    await expect(page.locator('.form-group:has-text("Deadline") .error-msg')).toHaveText('Required');
    await expect(page.locator('.form-group:has-text("Skills") .error-msg')).toHaveText('Required');
    // Ensure no API call was made (no redirect)
    await expect(page).toHaveURL('/post-job');
  });

  test('TC-008 Form validation - negative budget', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Test job');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Test description');
    const budgetInput = page.locator('form.uw-sidebar-card input[type="number"]');
    await budgetInput.evaluate((el) => el.removeAttribute('min'));
    await budgetInput.fill('-100');
    await page.fill('input[type="date"]', '2026-05-20');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Testing');
    await page.click('button:has-text("Publish job")');

    await expect(page.locator('.form-group:has-text("Budget") .error-msg')).toHaveText('Valid budget required');
    await expect(page.locator('.form-group:has-text("Job title") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Description") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Deadline") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Skills") .error-msg')).not.toBeVisible();
    await expect(page).toHaveURL('/post-job');
  });

  test('TC-009 Network error during submission', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    // Abort the request so axios surfaces a network-style failure and the UI shows the proxy/help copy.
    await page.route('**/api/projects', route => route.abort('failed'));

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Network Test Job');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Description for network test');
    await page.fill('input[type="number"]', '100');
    await page.fill('input[type="date"]', '2026-05-20');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Network, Error');
    await page.click('button:has-text("Publish job")');

    await expect(page.getByText('Cannot reach the API—start the backend (port 9001) and reload.')).toBeVisible();
    await expect(page).toHaveURL('/post-job');
    await expect(page.locator('input[placeholder="e.g. Build a responsive landing page"]')).toHaveValue('Network Test Job');
  });

  test('TC-010 Empty state copy on browse page references new posting flow', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: '[]',
      });
    });
    await loginAsOwner(page);
    await page.goto('/');

    // Assuming no projects are loaded, or mocking the API to return an empty array
    // If projects exist, this test needs a way to clear them or mock the API.
    // For demonstration, we'll assume the initial state is empty or can be made empty.
    // await page.route('**/api/projects', route => route.fulfill({ status: 200, body: '[]' }));
    // await page.reload();

    await expect(page.locator('.uw-empty-feed')).toContainText(
      'No jobs yet. Visit the Post a job page to publish the first listing.'
    );
  });

  test('TC-011 All form fields accept valid data types and formats', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    const longTitle = 'This is a very long title for a job posting that should be accepted'; // 65 chars
    const descriptionWithSpecialChars = 'Description with line breaks:\n- Item 1\n- Item 2\nAnd some special characters: !@#$%^&*()_+{}[]|\\;:\'"<>,.?/~`';
    const skillsWithSpaces = 'JavaScript, Node.js, PostgreSQL';

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', longTitle);
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', descriptionWithSpecialChars);
    await page.fill('input[type="number"]', '2500');
    await page.fill('input[type="date"]', '2026-05-25'); // Example date
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', skillsWithSpaces);
    await page.click('button:has-text("Publish job")');

    await expect(page).toHaveURL('/');
    const newJobCard = page.locator('.uw-job-row').first();
    await expect(newJobCard).toContainText(longTitle);
    await expect(newJobCard).toContainText('JavaScript');
    await expect(newJobCard).toContainText('Node.js');
    await expect(newJobCard).toContainText('PostgreSQL');
    // Verify description content if it's displayed on the card, otherwise assume API handled it.
  });

  test('TC-012 Skills parse correctly as comma-separated list', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'API Development');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Build REST API');
    await page.fill('input[type="number"]', '800');
    await page.fill('input[type="date"]', '2026-05-20'); // Example date
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', '  Python , Django , REST  ');
    await page.click('button:has-text("Publish job")');

    await expect(page).toHaveURL('/');
    const newJobCard = page.locator('.uw-job-row').first();
    await expect(newJobCard).toContainText('Python');
    await expect(newJobCard).toContainText('Django');
    await expect(newJobCard).toContainText('REST');
    // Ensure no extra spaces are displayed in the tags
    await expect(newJobCard.locator('.uw-skill-tag')).toHaveCount(3);
  });

  test('TC-013 Date picker works for deadline field', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    const deadlineInput = page.locator('input[type="date"]');
    await deadlineInput.click();
    // Playwright's fill method for date inputs directly sets the value
    await deadlineInput.fill('2026-05-25');
    await expect(deadlineInput).toHaveValue('2026-05-25');

    // Submit the form to ensure the date is accepted
    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Date Picker Test');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Test date picker functionality');
    await page.fill('input[type="number"]', '100');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Date');
    await page.click('button:has-text("Publish job")');

    await expect(page).toHaveURL('/');
    const newJobCard = page.locator('.uw-job-row').first();
    await expect(newJobCard).toContainText('Date Picker Test');
    // Depending on how the date is displayed on the card, verify its format
    // For simplicity, we'll just check the job was created.
  });

  test('TC-014 Submission with missing title only', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    // Leave title empty
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Test description');
    await page.fill('input[type="number"]', '100');
    await page.fill('input[type="date"]', '2026-05-20');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Test');
    await page.click('button:has-text("Publish job")');

    await expect(page.locator('.form-group:has-text("Job title") .error-msg')).toHaveText('Required');
    await expect(page.locator('.form-group:has-text("Description") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Budget") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Deadline") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Skills") .error-msg')).not.toBeVisible();
    await expect(page).toHaveURL('/post-job');
  });

  test('TC-015 Submission with empty budget string', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Test Title');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Test description');
    // Leave budget empty
    await page.fill('input[type="date"]', '2026-05-20');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Test');
    await page.click('button:has-text("Publish job")');

    await expect(page.locator('.form-group:has-text("Budget") .error-msg')).toHaveText('Valid budget required');
    await expect(page.locator('.form-group:has-text("Job title") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Description") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Deadline") .error-msg')).not.toBeVisible();
    await expect(page.locator('.form-group:has-text("Skills") .error-msg')).not.toBeVisible();
    await expect(page).toHaveURL('/post-job');
  });

  test('TC-016 API returns 400 error with custom message', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/post-job');

    // Intercept API call to simulate a 400 error with a custom message
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Project title already exists' }),
      });
    });

    await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Duplicate Title');
    await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Description');
    await page.fill('input[type="number"]', '100');
    await page.fill('input[type="date"]', '2026-05-20');
    await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Test');
    await page.click('button:has-text("Publish job")');

    await expect(page.locator('.error-msg', { hasText: 'Project title already exists' })).toBeVisible();
    await expect(page).toHaveURL('/post-job');
    await expect(page.locator('input[placeholder="e.g. Build a responsive landing page"]')).toHaveValue('Duplicate Title');
  });

  test('TC-017 Hash anchor #post-project no longer functional', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/#post-project');

    await expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('#post-project')).not.toBeVisible();
    await expect(page.locator('.uw-sidebar-card:has-text("Client tools")')).toBeVisible();
    await expect(page.locator('.uw-sidebar-card:has-text("Client tools")').locator('a.btn-primary')).toHaveText('+ Post a new job');
    await expect(page.locator('.uw-sidebar-card:has-text("Client tools")').locator('a.btn-primary')).toHaveAttribute('href', '/post-job');
  });
});
