import { request } from '@playwright/test';

const BASE_URL = 'http://localhost:9001'; // Adjust if your backend runs on a different port

export async function loginAsOwner(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:9000/login'); // Adjust if your frontend runs on a different port
  await page.fill('input[name="email"]', 'owner@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:9000/');
  return context;
}

export async function loginAsBidder(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:9000/login');
  await page.fill('input[name="email"]', 'bidder@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:9000/');
  return context;
}

export async function createProject(projectData, context) {
  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Authorization': `Bearer ${await context.evaluate(() => window.localStorage.getItem('token'))}` // Assuming token is in localStorage
    }
  });

  const response = await apiContext.post('/api/projects', {
    data: projectData,
  });

  if (!response.ok()) {
    const errorBody = await response.json();
    throw new Error(`Failed to create project: ${response.status} ${response.statusText} - ${errorBody.message}`);
  }

  const project = await response.json();
  await apiContext.dispose();
  return project;
}

export async function deleteProject(projectId, context) {
  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      // Use the provided context's token for authorization
      'Authorization': `Bearer ${await context.evaluate(() => window.localStorage.getItem('token'))}`
    }
  });

  const response = await apiContext.delete(`/api/projects/${projectId}`);

  if (!response.ok()) {
    const errorBody = await response.json();
    console.error(`Failed to delete project ${projectId}: ${response.status} ${response.statusText} - ${errorBody.message}`);
  }
  await apiContext.dispose();
}
