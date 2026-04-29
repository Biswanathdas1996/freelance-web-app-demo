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
});
