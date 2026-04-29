# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: postJobPage.spec.js >> Post Job Page Functionality >> TC-002 Owner navigates to /post-job via nav link
- Location: playwright\tests\postJobPage.spec.js:29:3

# Error details

```
Error: page.goto: Target page, context or browser has been closed
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsOwner, loginAsBidder } from '../utils/auth';
  3   | import { createProject } from '../utils/api';
  4   | 
  5   | test.describe('Post Job Page Functionality', () => {
  6   |   test.beforeEach(async ({ page }) => {
  7   |     // Ensure a clean state for projects before each test if needed
  8   |     // For now, we assume the backend handles project cleanup or isolation.
  9   |   });
  10  | 
  11  |   test('TC-001 Owner successfully posts job via /post-job page', async ({ page }) => {
  12  |     await loginAsOwner(page);
  13  |     await page.goto('/post-job');
  14  | 
  15  |     await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Build responsive landing page');
  16  |     await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Need a modern landing page with hero section and contact form');
  17  |     await page.fill('input[type="number"]', '500');
  18  |     await page.fill('input[type="date"]', '2026-05-15');
  19  |     await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'React, CSS, Responsive Design');
  20  |     await page.click('button:has-text("Publish job")');
  21  | 
  22  |     await expect(page).toHaveURL('/');
  23  |     await expect(page.locator('.uw-job-row').first()).toContainText('Build responsive landing page');
  24  |     await expect(page.locator('.uw-job-row').first()).toContainText('Open');
  25  |     // No explicit validation error messages should be visible
  26  |     await expect(page.locator('.error-msg')).not.toBeVisible();
  27  |   });
  28  | 
  29  |   test('TC-002 Owner navigates to /post-job via nav link', async ({ page }) => {
  30  |     await loginAsOwner(page);
> 31  |     await page.goto('/');
      |                ^ Error: page.goto: Target page, context or browser has been closed
  32  |     await page.click('nav a:has-text("Post a job")');
  33  | 
  34  |     await expect(page).toHaveURL('/post-job');
  35  |     await expect(page.locator('h1')).toHaveText('Post a fixed-price job');
  36  |     await expect(page.locator('form')).toBeVisible();
  37  |     await expect(page.locator('input[placeholder="e.g. Build a responsive landing page"]')).toBeEmpty();
  38  |   });
  39  | 
  40  |   test('TC-003 Owner navigates to /post-job via footer link', async ({ page }) => {
  41  |     await loginAsOwner(page);
  42  |     await page.goto('/');
  43  |     await page.locator('footer').scrollIntoViewIfNeeded();
  44  |     await page.click('footer a:has-text("Post a job")');
  45  | 
  46  |     await expect(page).toHaveURL('/post-job');
  47  |     await expect(page.locator('h1')).toHaveText('Post a fixed-price job');
  48  |     await expect(page.locator('form')).toBeVisible();
  49  |   });
  50  | 
  51  |   test('TC-004 Complete job posting flow from nav to browse', async ({ page }) => {
  52  |     await loginAsOwner(page);
  53  |     await page.goto('/');
  54  |     await page.click('nav a:has-text("Post a job")');
  55  |     await expect(page).toHaveURL('/post-job');
  56  | 
  57  |     await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Mobile app UI design');
  58  |     await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Design 5 screens for iOS app');
  59  |     await page.fill('input[type="number"]', '1200');
  60  |     await page.fill('input[type="date"]', '2026-06-01');
  61  |     await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Figma, UI/UX, iOS');
  62  |     await page.click('button:has-text("Publish job")');
  63  | 
  64  |     await expect(page).toHaveURL('/');
  65  |     const newJobCard = page.locator('.uw-job-row').first();
  66  |     await expect(newJobCard).toContainText('Mobile app UI design');
  67  |     await expect(newJobCard).toContainText('$1,200');
  68  |     await expect(newJobCard).toContainText('Figma');
  69  |     await expect(newJobCard).toContainText('UI/UX');
  70  |     await expect(newJobCard).toContainText('iOS');
  71  |     await expect(newJobCard).toContainText('Open');
  72  |   });
  73  | 
  74  |   test('TC-005 ProjectsPage sidebar no longer contains expandable form', async ({ page }) => {
  75  |     await loginAsOwner(page);
  76  |     await page.goto('/');
  77  | 
  78  |     await expect(page.locator('.uw-sidebar-card:has-text("Client tools")')).toBeVisible();
  79  |     await expect(page.locator('.uw-sidebar-card:has-text("Client tools")')).toContainText('Post a fixed-scope project for freelancers to bid on.');
  80  |     await expect(page.locator('.uw-sidebar-card:has-text("Client tools")').locator('a.btn-primary')).toHaveText('+ Post a new job');
  81  |     await expect(page.locator('.uw-sidebar-card:has-text("Client tools")').locator('a.btn-primary')).toHaveAttribute('href', '/post-job');
  82  |     await expect(page.locator('#post-project')).not.toBeVisible(); // Ensure old ID is gone
  83  |     await expect(page.locator('form')).not.toBeVisible(); // No inline form
  84  |   });
  85  | 
  86  |   test('TC-006 Non-owner (bidder) accesses /post-job route', async ({ page }) => {
  87  |     await loginAsBidder(page);
  88  |     await page.goto('/post-job');
  89  | 
  90  |     await expect(page.locator('h3')).toHaveText('Client access only');
  91  |     await expect(
  92  |       page.getByText('Only users with an owner account can post jobs.', { exact: false })
  93  |     ).toBeVisible();
  94  |     await expect(page.locator('a.btn-primary')).toHaveText('Browse jobs');
  95  |     await expect(page.locator('a.btn-primary')).toHaveAttribute('href', '/');
  96  |     await expect(page.locator('form')).not.toBeVisible();
  97  |   });
  98  | 
  99  |   test('TC-007 Form validation - all required fields empty', async ({ page }) => {
  100 |     await loginAsOwner(page);
  101 |     await page.goto('/post-job');
  102 | 
  103 |     await page.click('button:has-text("Publish job")');
  104 | 
  105 |     await expect(page.locator('.form-group:has-text("Job title") .error-msg')).toHaveText('Required');
  106 |     await expect(page.locator('.form-group:has-text("Description") .error-msg')).toHaveText('Required');
  107 |     await expect(page.locator('.form-group:has-text("Budget") .error-msg')).toHaveText('Valid budget required');
  108 |     await expect(page.locator('.form-group:has-text("Deadline") .error-msg')).toHaveText('Required');
  109 |     await expect(page.locator('.form-group:has-text("Skills") .error-msg')).toHaveText('Required');
  110 |     // Ensure no API call was made (no redirect)
  111 |     await expect(page).toHaveURL('/post-job');
  112 |   });
  113 | 
  114 |   test('TC-008 Form validation - negative budget', async ({ page }) => {
  115 |     await loginAsOwner(page);
  116 |     await page.goto('/post-job');
  117 | 
  118 |     await page.fill('input[placeholder="e.g. Build a responsive landing page"]', 'Test job');
  119 |     await page.fill('textarea[placeholder="Describe the project scope, deliverables, and any special requirements"]', 'Test description');
  120 |     const budgetInput = page.locator('form.uw-sidebar-card input[type="number"]');
  121 |     await budgetInput.evaluate((el) => el.removeAttribute('min'));
  122 |     await budgetInput.fill('-100');
  123 |     await page.fill('input[type="date"]', '2026-05-20');
  124 |     await page.fill('input[placeholder="e.g. React, Node.js, MongoDB"]', 'Testing');
  125 |     await page.click('button:has-text("Publish job")');
  126 | 
  127 |     await expect(page.locator('.form-group:has-text("Budget") .error-msg')).toHaveText('Valid budget required');
  128 |     await expect(page.locator('.form-group:has-text("Job title") .error-msg')).not.toBeVisible();
  129 |     await expect(page.locator('.form-group:has-text("Description") .error-msg')).not.toBeVisible();
  130 |     await expect(page.locator('.form-group:has-text("Deadline") .error-msg')).not.toBeVisible();
  131 |     await expect(page.locator('.form-group:has-text("Skills") .error-msg')).not.toBeVisible();
```