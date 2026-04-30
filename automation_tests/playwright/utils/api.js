import { request } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:9001';
const FRONTEND_ORIGIN = process.env.PLAYWRIGHT_FRONTEND_ORIGIN ?? 'http://localhost:9000';

const OWNER_CREDENTIALS = { email: 'taylor@demo.com', password: 'demo123' };
const BIDDER_CREDENTIALS = { email: 'jordan@demo.com', password: 'demo123' };

async function loginAs(browser, { email, password }) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${FRONTEND_ORIGIN}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button:has-text("Sign in")').click();

  // Wait until auth token is persisted; avoids brittle URL-based waits.
  await page.waitForFunction(() => Boolean(window.localStorage.getItem('token')), null, { timeout: 60000 });

  // Best-effort: allow the app to finish navigating/booting.
  await page.waitForLoadState('networkidle').catch(() => {});

  return context;
}

export async function loginAsOwner(browser) {
  return loginAs(browser, OWNER_CREDENTIALS);
}

export async function loginAsBidder(browser) {
  return loginAs(browser, BIDDER_CREDENTIALS);
}

async function getTokenFromContext(context) {
  if (!context) return null;

  // BrowserContext might not expose `evaluate` in all Playwright versions.
  if (typeof context.evaluate === 'function') {
    return context.evaluate(() => window.localStorage.getItem('token'));
  }

  const page = await context.newPage();
  try {
    await page.goto(`${FRONTEND_ORIGIN}/`, { waitUntil: 'domcontentloaded' });
    return await page.evaluate(() => window.localStorage.getItem('token'));
  } finally {
    await page.close().catch(() => {});
  }
}

export async function createProject(projectData, context) {
  const token = await getTokenFromContext(context);
  if (!token) throw new Error('Auth token missing in Playwright context; login might have failed.');

  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const response = await apiContext.post('/api/projects', { data: projectData });
    if (!response.ok()) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message || errorBody?.error || JSON.stringify(errorBody);
      throw new Error(`Failed to create project: ${response.status} ${response.statusText} - ${message}`);
    }

    return await response.json();
  } finally {
    await apiContext.dispose();
  }
}

export async function deleteProject(projectId, context) {
  if (!projectId) return;

  const token = await getTokenFromContext(context);
  if (!token) return;

  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const response = await apiContext.delete(`/api/projects/${projectId}`);
    if (!response.ok()) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message || errorBody?.error || JSON.stringify(errorBody);
      console.error(`Failed to delete project ${projectId}: ${response.status} ${response.statusText} - ${message}`);
    }
  } finally {
    await apiContext.dispose();
  }
}

export async function createBid(bidData, context) {
  const token = await getTokenFromContext(context);
  if (!token) throw new Error('Auth token missing in Playwright context; login might have failed.');

  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const response = await apiContext.post('/api/bids', { data: bidData });
    if (!response.ok()) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message || errorBody?.error || JSON.stringify(errorBody);
      throw new Error(`Failed to create bid: ${response.status} ${response.statusText} - ${message}`);
    }

    return await response.json();
  } finally {
    await apiContext.dispose();
  }
}

export async function createAssignment(assignmentData, context) {
  const token = await getTokenFromContext(context);
  if (!token) throw new Error('Auth token missing in Playwright context; login might have failed.');

  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const response = await apiContext.post('/api/assignments', { data: assignmentData });
    if (!response.ok()) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message || errorBody?.error || JSON.stringify(errorBody);
      throw new Error(`Failed to create assignment: ${response.status} ${response.statusText} - ${message}`);
    }

    return await response.json();
  } finally {
    await apiContext.dispose();
  }
}

export async function deleteAssignment(assignmentId, context) {
  if (!assignmentId) return;

  const token = await getTokenFromContext(context);
  if (!token) return;

  const apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const response = await apiContext.delete(`/api/assignments/${assignmentId}`);
    if (!response.ok()) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message || errorBody?.error || JSON.stringify(errorBody);
      console.error(`Failed to delete assignment ${assignmentId}: ${response.status} ${response.statusText} - ${message}`);
    }
  } finally {
    await apiContext.dispose();
  }
}
