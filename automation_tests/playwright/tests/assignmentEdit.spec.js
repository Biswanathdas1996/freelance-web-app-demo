import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsBidder, createProject, deleteProject } from '../utils/api';
import { request } from '@playwright/test';

test.setTimeout(60000);

const BASE_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:9001';

async function getTokenFromContext(context) {
  if (!context) return null;
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:9000/', { waitUntil: 'domcontentloaded' });
    return await page.evaluate(() => window.localStorage.getItem('token'));
  } finally {
    await page.close().catch(() => {});
  }
}

async function createBid(bidData, context) {
  const token = await getTokenFromContext(context);
  if (!token) throw new Error('Auth token missing');

  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });

  try {
    const response = await apiContext.post('/api/bids', { data: bidData });
    if (!response.ok()) {
      throw new Error(`Failed to create bid: ${response.status}`);
    }
    return await response.json();
  } finally {
    await apiContext.dispose();
  }
}

async function createAssignment(assignmentData, context) {
  const token = await getTokenFromContext(context);
  if (!token) throw new Error('Auth token missing');

  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });

  try {
    const response = await apiContext.post('/api/assignments', { data: assignmentData });
    if (!response.ok()) {
      throw new Error(`Failed to create assignment: ${response.status}`);
    }
    return await response.json();
  } finally {
    await apiContext.dispose();
  }
}

test.describe('Assignment Edit Feature', () => {
  let ownerContext, bidderContext, ownerPage, bidderPage, projectId, bidId, assignmentId;

  test.beforeEach(async ({ browser }) => {
    ownerContext = await loginAsOwner(browser);
    ownerPage = await ownerContext.newPage();
    bidderContext = await loginAsBidder(browser);
    bidderPage = await bidderContext.newPage();

    // Create a project
    const projectData = {
      title: 'Assignment Edit Test Project',
      description: 'Test project for assignment editing',
      budget: 1000,
      deadline: '2026-06-01',
      skills: ['JavaScript', 'Testing'],
    };
    const project = await createProject(projectData, ownerContext);
    projectId = project._id;

    // Create a bid
    const bidData = {
      projectId,
      amount: 800,
      freelancerName: 'Test Freelancer',
      proposal: 'I will complete this project efficiently',
    };
    const bid = await createBid(bidData, bidderContext);
    bidId = bid._id;

    // Create an assignment
    const assignmentData = {
      projectId,
      bidId,
      freelancerName: 'Test Freelancer',
      description: 'Initial assignment description for testing',
    };
    const assignment = await createAssignment(assignmentData, ownerContext);
    assignmentId = assignment._id;
  });

  test.afterEach(async () => {
    if (projectId) {
      await deleteProject(projectId, ownerContext);
      projectId = null;
    }
    if (ownerContext) await ownerContext.close();
    if (bidderContext) await bidderContext.close();
  });

  test('TC-001: Owner can see Edit Assignment button', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    const editButton = ownerPage.locator('button:has-text("Edit Assignment")');
    await expect(editButton).toBeVisible();
  });

  test('TC-002: Bidder cannot see Edit Assignment button', async () => {
    await bidderPage.goto(`/projects/${projectId}`);
    await bidderPage.waitForSelector('#assignment', { timeout: 10000 });

    const editButton = bidderPage.locator('button:has-text("Edit Assignment")');
    await expect(editButton).not.toBeVisible();
  });

  test('TC-003: Edit button opens edit form', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const formHeading = ownerPage.locator('h3:has-text("Edit Assignment")');
    await expect(formHeading).toBeVisible();

    const freelancerInput = ownerPage.locator('input[value="Test Freelancer"]');
    await expect(freelancerInput).toBeVisible();

    const descriptionTextarea = ownerPage.locator('textarea').first();
    const descValue = await descriptionTextarea.inputValue();
    expect(descValue).toBe('Initial assignment description for testing');
  });

  test('TC-004: Owner can successfully edit assignment', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    // Edit the freelancer name
    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill('Updated Freelancer Name');

    // Edit the description
    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('Updated assignment description with more details');

    // Add notes
    const notesTextarea = ownerPage.locator('label:has-text("Notes")').locator('..').locator('textarea');
    await notesTextarea.fill('These are some important notes');

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Wait for form to close
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Verify updated data is displayed
    await expect(ownerPage.locator('.card:has-text("Updated Freelancer Name")')).toBeVisible();
    await expect(ownerPage.locator('p:has-text("Updated assignment description with more details")')).toBeVisible();
    await expect(ownerPage.locator('p:has-text("These are some important notes")')).toBeVisible();
  });

  test('TC-005: Validation - freelancer name is required', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill('');

    await ownerPage.click('button:has-text("Save Changes")');

    const errorMsg = ownerPage.locator('.error-msg:has-text("Freelancer name is required")');
    await expect(errorMsg).toBeVisible();
  });

  test('TC-006: Validation - description is required', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('');

    await ownerPage.click('button:has-text("Save Changes")');

    const errorMsg = ownerPage.locator('.error-msg:has-text("Description is required")');
    await expect(errorMsg).toBeVisible();
  });

  test('TC-007: Validation - description must be at least 10 characters', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('Short');

    await ownerPage.click('button:has-text("Save Changes")');

    const errorMsg = ownerPage.locator('.error-msg:has-text("Description must be at least 10 characters")');
    await expect(errorMsg).toBeVisible();
  });

  test('TC-008: Cancel button closes edit form without saving', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill('Changed Name');

    await ownerPage.click('button:has-text("Cancel")');

    // Form should be closed
    const formHeading = ownerPage.locator('h3:has-text("Edit Assignment")');
    await expect(formHeading).not.toBeVisible();

    // Original name should still be displayed
    await expect(ownerPage.locator('.card:has-text("Test Freelancer")')).toBeVisible();
    await expect(ownerPage.locator('.card:has-text("Changed Name")')).not.toBeVisible();
  });

  test('TC-009: Edit form follows Oktawave branding', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    // Check form-card class
    const formCard = ownerPage.locator('.form-card').first();
    await expect(formCard).toBeVisible();

    // Check btn-primary on Save button
    const saveButton = ownerPage.locator('button:has-text("Save Changes")');
    await expect(saveButton).toHaveClass(/btn-primary/);

    // Check form-control class on inputs
    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await expect(freelancerInput).toHaveClass(/form-control/);
  });

  test('TC-010: Notes field is optional', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    // Leave notes empty
    const notesTextarea = ownerPage.locator('label:has-text("Notes")').locator('..').locator('textarea');
    await notesTextarea.fill('');

    // Ensure other required fields are filled
    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill('Freelancer With No Notes');

    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('Description without notes is valid');

    await ownerPage.click('button:has-text("Save Changes")');

    // Should submit successfully
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });
    await expect(ownerPage.locator('.card:has-text("Freelancer With No Notes")')).toBeVisible();
  });

  test('TC-011: Edit form preserves existing notes if present', async () => {
    // First, add notes
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const notesTextarea = ownerPage.locator('label:has-text("Notes")').locator('..').locator('textarea');
    await notesTextarea.fill('Original notes content');

    await ownerPage.click('button:has-text("Save Changes")');
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Now edit again and verify notes are preserved in the form
    await ownerPage.click('button:has-text("Edit Assignment")');

    const notesValue = await ownerPage.locator('label:has-text("Notes")').locator('..').locator('textarea').inputValue();
    expect(notesValue).toBe('Original notes content');
  });

  test('TC-012: Multiple edits can be made sequentially', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    // First edit
    await ownerPage.click('button:has-text("Edit Assignment")');
    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('First edit description');
    await ownerPage.click('button:has-text("Save Changes")');
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Second edit
    await ownerPage.click('button:has-text("Edit Assignment")');
    await descriptionTextarea.fill('Second edit description');
    await ownerPage.click('button:has-text("Save Changes")');
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Verify final state
    await expect(ownerPage.locator('p:has-text("Second edit description")')).toBeVisible();
  });

  test('TC-013: Edit assignment with minimum valid description length (10 chars)', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('Ten chars!'); // Exactly 10 characters

    await ownerPage.click('button:has-text("Save Changes")');

    // Should submit successfully - no validation error
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });
    await expect(ownerPage.locator('p:has-text("Ten chars!")')).toBeVisible();
  });

  test('TC-014: Edit assignment with very long text in all fields', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    // 500 character name
    const longName = 'A'.repeat(500);
    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill(longName);

    // 5000 character description
    const longDescription = 'This is a very long description. '.repeat(150); // ~5000 chars
    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill(longDescription);

    // 3000 character notes
    const longNotes = 'These are extensive notes. '.repeat(110); // ~3000 chars
    const notesTextarea = ownerPage.locator('label:has-text("Notes")').locator('..').locator('textarea');
    await notesTextarea.fill(longNotes);

    await ownerPage.click('button:has-text("Save Changes")');

    // Should handle long text without errors
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Verify the card contains part of the long text (checking full text might be truncated in UI)
    const card = ownerPage.locator('.card').first();
    await expect(card).toContainText(longName.substring(0, 50));
    await expect(card).toContainText(longDescription.substring(0, 50));
    await expect(card).toContainText(longNotes.substring(0, 50));
  });

  test('TC-015: Edit assignment with special characters and unicode', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    await ownerPage.click('button:has-text("Edit Assignment")');

    // Special characters in name
    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill('José García-López');

    // Emojis in description
    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('Project for 🚀 deployment ⚡ with unicode');

    // Symbols in notes
    const notesTextarea = ownerPage.locator('label:has-text("Notes")').locator('..').locator('textarea');
    await notesTextarea.fill('$1000 budget & 10% fee + special chars: <>"');

    await ownerPage.click('button:has-text("Save Changes")');

    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Verify special characters are preserved and displayed correctly
    await expect(ownerPage.locator('.card:has-text("José García-López")')).toBeVisible();
    await expect(ownerPage.locator('p:has-text("Project for 🚀 deployment ⚡")')).toBeVisible();
    await expect(ownerPage.locator('p:has-text("$1000 budget & 10% fee")')).toBeVisible();
  });

  test('TC-016: Edit and immediately edit again with form pre-fill verification', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    // First edit
    await ownerPage.click('button:has-text("Edit Assignment")');

    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill('First Edit Name');

    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('First edit description content');

    await ownerPage.click('button:has-text("Save Changes")');
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Immediately open edit form again
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Verify form pre-fills with the first edit values
    const prefilledName = await freelancerInput.inputValue();
    expect(prefilledName).toBe('First Edit Name');

    const prefilledDescription = await descriptionTextarea.inputValue();
    expect(prefilledDescription).toBe('First edit description content');

    // Make second edit
    await freelancerInput.fill('Second Edit Name');
    await descriptionTextarea.fill('Second edit description content');

    await ownerPage.click('button:has-text("Save Changes")');
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Verify final values
    await expect(ownerPage.locator('.card:has-text("Second Edit Name")')).toBeVisible();
    await expect(ownerPage.locator('p:has-text("Second edit description content")')).toBeVisible();
  });

  test('TC-017: API error during update shows error message', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    // Intercept the PUT request and simulate an error
    await ownerPage.route(`**/api/assignments/${assignmentId}`, route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' }),
      });
    });

    await ownerPage.click('button:has-text("Edit Assignment")');

    const descriptionTextarea = ownerPage.locator('label:has-text("Assignment Description")').locator('..').locator('textarea');
    await descriptionTextarea.fill('Attempting to save this');

    await ownerPage.click('button:has-text("Save Changes")');

    // Error message should be displayed
    const errorMsg = ownerPage.locator('.error-msg:has-text("Database connection failed")');
    await expect(errorMsg).toBeVisible();

    // Form should remain open
    const formHeading = ownerPage.locator('h3:has-text("Edit Assignment")');
    await expect(formHeading).toBeVisible();
  });

  test('TC-018: Edit assignment preserves currentStage field', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment', { timeout: 10000 });

    // Get initial stage
    const initialStageBadge = ownerPage.locator('.meta-item:has-text("Stage:")');
    const initialStageText = await initialStageBadge.textContent();

    // Edit the assignment
    await ownerPage.click('button:has-text("Edit Assignment")');

    const freelancerInput = ownerPage.locator('label:has-text("Freelancer Name")').locator('..').locator('input');
    await freelancerInput.fill('Stage Test Freelancer');

    await ownerPage.click('button:has-text("Save Changes")');
    await ownerPage.waitForSelector('h3:has-text("Edit Assignment")', { state: 'hidden', timeout: 5000 });

    // Verify stage remains unchanged
    const updatedStageBadge = ownerPage.locator('.meta-item:has-text("Stage:")');
    const updatedStageText = await updatedStageBadge.textContent();

    expect(updatedStageText).toBe(initialStageText);
  });
});
