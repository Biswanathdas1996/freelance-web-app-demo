import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsBidder, createProject, deleteProject, createBid, createAssignment, deleteAssignment } from '../utils/api';

test.setTimeout(60000);

test.describe('Assignment Edit Feature', () => {
  let ownerContext, bidderContext, ownerPage, projectId, bidId, assignmentId;

  test.beforeEach(async ({ browser }) => {
    ownerContext = await loginAsOwner(browser);
    ownerPage = await ownerContext.newPage();
    bidderContext = await loginAsBidder(browser);

    // Create a project as owner
    const projectData = {
      title: 'Assignment Edit Test Project',
      description: 'Test project for assignment editing',
      budget: 1000,
      deadline: '2026-06-15',
      skills: ['JavaScript', 'Testing'],
    };
    const project = await createProject(projectData, ownerContext);
    projectId = project._id;

    // Create a bid as bidder
    const bidData = {
      projectId,
      amount: 800,
      timeline: 14,
      proposal: 'I am interested in this project and have relevant experience.',
    };
    const bid = await createBid(bidData, bidderContext);
    bidId = bid._id;

    // Create an assignment as owner
    const assignmentData = {
      projectId,
      bidId,
      freelancerName: 'John Doe',
      description: 'Initial assignment description for testing',
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

  test('Owner successfully edits assignment freelancer name and description', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Verify initial assignment data is displayed
    await expect(ownerPage.locator('.meta-item:has-text("Freelancer:")')).toContainText('John Doe');
    await expect(ownerPage.locator('p:has-text("Description:")')).toContainText('Initial assignment description for testing');

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Verify edit form is displayed
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();

    // Verify form fields are pre-filled with current values
    const freelancerInput = ownerPage.locator('.form-card .form-group:has-text("Freelancer Name") input.form-control');
    const descriptionTextarea = ownerPage.locator('.form-card .form-group:has-text("Description") textarea.form-control');

    await expect(freelancerInput).toHaveValue('John Doe');
    await expect(descriptionTextarea).toHaveValue('Initial assignment description for testing');

    // Edit the fields
    await freelancerInput.fill('Jane Smith');
    await descriptionTextarea.fill('Updated project scope with additional requirements and new deliverables');

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify edit mode is closed and updated values are displayed
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).not.toBeVisible();
    await expect(ownerPage.locator('.meta-item:has-text("Freelancer:")')).toContainText('Jane Smith');
    await expect(ownerPage.locator('p:has-text("Description:")')).toContainText('Updated project scope with additional requirements and new deliverables');
  });

  test('Owner successfully edits assignment notes', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Add notes
    const notesTextarea = ownerPage.locator('.form-card .form-group:has-text("Notes") textarea.form-control');
    await notesTextarea.fill('Client requested faster turnaround time');

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify notes are displayed
    await expect(ownerPage.locator('p:has-text("Notes:")')).toContainText('Client requested faster turnaround time');
  });

  test('Validation error when description is less than 10 characters', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Enter a description with less than 10 characters
    const descriptionTextarea = ownerPage.locator('.form-card .form-group:has-text("Description") textarea.form-control');
    await descriptionTextarea.fill('Short');

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify validation error is displayed
    const errorMsg = ownerPage.locator('.form-card .form-group:has-text("Description") .error-msg');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Description must be at least 10 characters');

    // Verify form is still in edit mode
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();
  });

  test('Validation error when description is exactly 10 characters (boundary test)', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Enter a description with exactly 10 characters
    const descriptionTextarea = ownerPage.locator('.form-card .form-group:has-text("Description") textarea.form-control');
    await descriptionTextarea.fill('1234567890'); // Exactly 10 characters

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify no validation error (10 characters should be valid)
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).not.toBeVisible();

    // Verify assignment was updated
    await expect(ownerPage.locator('p:has-text("Description:")')).toContainText('1234567890');
  });

  test('Validation error when freelancer name is empty', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Clear freelancer name
    const freelancerInput = ownerPage.locator('.form-card .form-group:has-text("Freelancer Name") input.form-control');
    await freelancerInput.fill('');

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify validation error is displayed
    const errorMsg = ownerPage.locator('.form-card .form-group:has-text("Freelancer Name") .error-msg');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Freelancer name is required');

    // Verify form is still in edit mode
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();
  });

  test('Validation error when description is empty', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Clear description
    const descriptionTextarea = ownerPage.locator('.form-card .form-group:has-text("Description") textarea.form-control');
    await descriptionTextarea.fill('');

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify validation error is displayed
    const errorMsg = ownerPage.locator('.form-card .form-group:has-text("Description") .error-msg');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Description is required');

    // Verify form is still in edit mode
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).toBeVisible();
  });

  test('Cancel button discards changes and returns to view mode', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Verify initial values
    await expect(ownerPage.locator('.meta-item:has-text("Freelancer:")')).toContainText('John Doe');
    await expect(ownerPage.locator('p:has-text("Description:")')).toContainText('Initial assignment description for testing');

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Modify the fields
    const freelancerInput = ownerPage.locator('.form-card .form-group:has-text("Freelancer Name") input.form-control');
    const descriptionTextarea = ownerPage.locator('.form-card .form-group:has-text("Description") textarea.form-control');
    await freelancerInput.fill('Changed Name');
    await descriptionTextarea.fill('Changed description that should not be saved');

    // Click Cancel button
    await ownerPage.click('button:has-text("Cancel")');

    // Verify edit mode is closed
    await expect(ownerPage.locator('.form-card h3:has-text("Edit Assignment")')).not.toBeVisible();

    // Verify original values are still displayed
    await expect(ownerPage.locator('.meta-item:has-text("Freelancer:")')).toContainText('John Doe');
    await expect(ownerPage.locator('p:has-text("Description:")')).toContainText('Initial assignment description for testing');
  });

  test('Edit Assignment button is only visible to project owner', async () => {
    // Owner should see the Edit button
    await ownerPage.goto(`/projects/${projectId}`);
    await expect(ownerPage.locator('button:has-text("Edit Assignment")')).toBeVisible();

    // Bidder should not see the Edit button (even if they are assigned)
    const bidderPage = await bidderContext.newPage();
    await bidderPage.goto(`/projects/${projectId}`);

    // Wait for assignment section to load
    await expect(bidderPage.locator('.meta-item:has-text("Freelancer:")')).toBeVisible();

    // Verify Edit button is not visible
    await expect(bidderPage.locator('button:has-text("Edit Assignment")')).not.toBeVisible();

    await bidderPage.close();
  });

  test('Complete E2E edit flow with all fields modified', async () => {
    await ownerPage.goto(`/projects/${projectId}`);

    // Click Edit Assignment button
    await ownerPage.click('button:has-text("Edit Assignment")');

    // Modify all fields
    const freelancerInput = ownerPage.locator('.form-card .form-group:has-text("Freelancer Name") input.form-control');
    const descriptionTextarea = ownerPage.locator('.form-card .form-group:has-text("Description") textarea.form-control');
    const notesTextarea = ownerPage.locator('.form-card .form-group:has-text("Notes") textarea.form-control');

    await freelancerInput.fill('Robert Johnson');
    await descriptionTextarea.fill('Complete redesign of UI components with modern styling approach');
    await notesTextarea.fill('Deadline extended by 2 weeks');

    // Submit the form
    await ownerPage.click('button:has-text("Save Changes")');

    // Verify all changes are displayed correctly
    await expect(ownerPage.locator('.meta-item:has-text("Freelancer:")')).toContainText('Robert Johnson');
    await expect(ownerPage.locator('p:has-text("Description:")')).toContainText('Complete redesign of UI components with modern styling approach');
    await expect(ownerPage.locator('p:has-text("Notes:")')).toContainText('Deadline extended by 2 weeks');

    // Refresh page to verify persistence
    await ownerPage.reload();
    await expect(ownerPage.locator('.meta-item:has-text("Freelancer:")')).toContainText('Robert Johnson');
    await expect(ownerPage.locator('p:has-text("Description:")')).toContainText('Complete redesign of UI components with modern styling approach');
    await expect(ownerPage.locator('p:has-text("Notes:")')).toContainText('Deadline extended by 2 weeks');
  });
});
