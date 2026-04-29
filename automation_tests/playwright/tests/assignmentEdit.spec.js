import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsBidder, createProject, deleteProject, createBid, createAssignment, deleteAssignment } from '../utils/api';

test.setTimeout(60000);

test.describe('Assignment Edit Feature', () => {
  let ownerContext, bidderContext, ownerPage, projectId, bidId, assignmentId;

  test.beforeEach(async ({ browser }) => {
    ownerContext = await loginAsOwner(browser);
    ownerPage = await ownerContext.newPage();
    bidderContext = await loginAsBidder(browser);

    // Create project as owner
    const projectData = {
      title: 'Test Assignment Edit Project',
      description: 'Project for testing assignment editing',
      budget: 1000,
      deadline: '2026-06-01',
      skills: ['Testing', 'Playwright'],
    };
    const project = await createProject(projectData, ownerContext);
    projectId = project._id;

    // Create bid as bidder
    const bidData = {
      projectId: projectId,
      amount: 800,
      timeline: 14,
      proposal: 'I can complete this project with high quality.',
    };
    const bid = await createBid(bidData, bidderContext);
    bidId = bid._id;

    // Create assignment as owner
    const assignmentData = {
      projectId: projectId,
      bidId: bidId,
      freelancerName: 'Jordan Demo',
      description: 'Build the complete feature as specified in requirements',
    };
    const assignment = await createAssignment(assignmentData, ownerContext);
    assignmentId = assignment._id;
  });

  test.afterEach(async () => {
    if (assignmentId) {
      await deleteAssignment(assignmentId, ownerContext);
      assignmentId = null;
    }
    if (projectId) {
      await deleteProject(projectId, ownerContext);
      projectId = null;
    }
    if (ownerContext) await ownerContext.close();
    if (bidderContext) await bidderContext.close();
  });

  test('TC-001: Owner successfully edits assignment details', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment');

    // Verify initial state shows view mode with Edit Assignment button
    await expect(ownerPage.locator('button:has-text("Edit Assignment")')).toBeVisible();
    await expect(ownerPage.locator('.card').filter({ hasText: 'Freelancer:' })).toContainText('Jordan Demo');
    await expect(ownerPage.locator('.card').filter({ hasText: 'Description:' })).toContainText('Build the complete feature as specified in requirements');

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Verify edit form appears
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();
    await expect(ownerPage.locator('input.form-control').first()).toBeVisible();

    // Verify form is pre-filled with current values
    const freelancerInput = ownerPage.locator('.form-group').filter({ hasText: 'Freelancer Name' }).locator('input.form-control');
    await expect(freelancerInput).toHaveValue('Jordan Demo');

    const descriptionTextarea = ownerPage.locator('.form-group').filter({ hasText: 'Description' }).locator('textarea.form-control');
    await expect(descriptionTextarea).toHaveValue('Build the complete feature as specified in requirements');

    // Modify fields
    await freelancerInput.fill('Jane Smith');
    await descriptionTextarea.fill('Updated requirements with new specifications and deliverables');
    await ownerPage.locator('.form-group').filter({ hasText: 'Notes (optional)' }).locator('textarea.form-control').fill('Client approved changes on 2026-04-29');
    await ownerPage.locator('.form-group').filter({ hasText: 'Current Stage' }).locator('select.form-control').selectOption('InProgress');

    // Submit form
    await ownerPage.click('button:has-text("Save Changes")');

    // Wait for form to disappear (edit mode exits)
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).not.toBeVisible();

    // Verify updated values appear in view mode
    await expect(ownerPage.locator('.card').filter({ hasText: 'Freelancer:' })).toContainText('Jane Smith');
    await expect(ownerPage.locator('.card').filter({ hasText: 'Description:' })).toContainText('Updated requirements with new specifications and deliverables');
    await expect(ownerPage.locator('.card').filter({ hasText: 'Notes:' })).toContainText('Client approved changes on 2026-04-29');
    await expect(ownerPage.locator('.card').filter({ hasText: 'Stage:' }).locator('.badge')).toContainText('InProgress');
  });

  test('TC-002: Validation error for description less than 10 characters', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment');

    // Enter edit mode
    await ownerPage.click('button:has-text("Edit Assignment")');
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();

    // Fill form with short description
    const freelancerInput = ownerPage.locator('.form-group').filter({ hasText: 'Freelancer Name' }).locator('input.form-control');
    await freelancerInput.fill('Test User');

    const descriptionTextarea = ownerPage.locator('.form-group').filter({ hasText: 'Description' }).locator('textarea.form-control');
    await descriptionTextarea.fill('Short');

    // Try to submit
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify error message appears
    const descriptionFormGroup = ownerPage.locator('.form-group').filter({ hasText: 'Description' });
    await expect(descriptionFormGroup.locator('.error-msg')).toBeVisible();
    await expect(descriptionFormGroup.locator('.error-msg')).toHaveText('Description must be at least 10 characters');

    // Verify form is still in edit mode
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();
  });

  test('TC-003: Validation error for empty freelancer name', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment');

    // Enter edit mode
    await ownerPage.click('button:has-text("Edit Assignment")');
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();

    // Clear freelancer name
    const freelancerInput = ownerPage.locator('.form-group').filter({ hasText: 'Freelancer Name' }).locator('input.form-control');
    await freelancerInput.fill('');

    // Try to submit
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify error message appears
    const freelancerFormGroup = ownerPage.locator('.form-group').filter({ hasText: 'Freelancer Name' });
    await expect(freelancerFormGroup.locator('.error-msg')).toBeVisible();
    await expect(freelancerFormGroup.locator('.error-msg')).toHaveText('Freelancer name is required');

    // Verify form is still in edit mode
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();
  });

  test('TC-004: Cancel button exits edit mode without saving', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment');

    // Enter edit mode
    await ownerPage.click('button:has-text("Edit Assignment")');
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();

    // Modify fields
    const freelancerInput = ownerPage.locator('.form-group').filter({ hasText: 'Freelancer Name' }).locator('input.form-control');
    await freelancerInput.fill('Different Name');

    const descriptionTextarea = ownerPage.locator('.form-group').filter({ hasText: 'Description' }).locator('textarea.form-control');
    await descriptionTextarea.fill('Completely different description text here');

    // Click Cancel
    await ownerPage.click('button:has-text("Cancel")');

    // Verify edit form disappears
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).not.toBeVisible();

    // Verify original values are unchanged
    await expect(ownerPage.locator('.card').filter({ hasText: 'Freelancer:' })).toContainText('Jordan Demo');
    await expect(ownerPage.locator('.card').filter({ hasText: 'Description:' })).toContainText('Build the complete feature as specified in requirements');
  });

  test('TC-005: Edge case - description with exactly 10 characters passes validation', async () => {
    await ownerPage.goto(`/projects/${projectId}`);
    await ownerPage.waitForSelector('#assignment');

    // Enter edit mode
    await ownerPage.click('button:has-text("Edit Assignment")');
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();

    // Fill with exactly 10 characters
    const freelancerInput = ownerPage.locator('.form-group').filter({ hasText: 'Freelancer Name' }).locator('input.form-control');
    await freelancerInput.fill('Test User');

    const descriptionTextarea = ownerPage.locator('.form-group').filter({ hasText: 'Description' }).locator('textarea.form-control');
    await descriptionTextarea.fill('Ten chars!'); // Exactly 10 characters

    // Submit
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify no error message
    const descriptionFormGroup = ownerPage.locator('.form-group').filter({ hasText: 'Description' });
    await expect(descriptionFormGroup.locator('.error-msg')).not.toBeVisible();

    // Verify edit mode exits successfully
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).not.toBeVisible();

    // Verify updated description appears
    await expect(ownerPage.locator('.card').filter({ hasText: 'Description:' })).toContainText('Ten chars!');
  });
});
