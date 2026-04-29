import { request } from '@playwright/test';

// This utility is primarily for setup/teardown if direct API interaction is needed
// For most tests, UI interaction is preferred as per the test cases.

export async function createProject(projectData) {
  const reqContext = await request.newContext();
  const response = await reqContext.post('http://localhost:9001/api/projects', {
    data: projectData,
  });
  if (!response.ok()) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }
  return response.json();
}

export async function clearAllProjects() {
  // This function would be highly dependent on your backend's API for test data management.
  // For a real application, you'd have an admin endpoint or a test-specific endpoint.
  // Example (hypothetical):
  // const reqContext = await request.newContext();
  // await reqContext.delete('http://localhost:9001/api/test/projects/clear');
  console.warn('clearAllProjects is a placeholder. Implement backend API for test data cleanup if needed.');
}
