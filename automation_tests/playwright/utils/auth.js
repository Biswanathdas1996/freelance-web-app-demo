export async function loginAsOwner(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'owner@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("Login")');
  await page.waitForURL('/');
}

export async function loginAsBidder(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'bidder@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("Login")');
  await page.waitForURL('/');
}
