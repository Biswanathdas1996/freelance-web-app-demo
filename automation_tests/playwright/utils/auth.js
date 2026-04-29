// Matches users created by `npm run seed` in backend (password: demo123).
export async function loginAsOwner(page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('taylor@demo.com');
  await page.locator('input[type="password"]').fill('demo123');
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('/');
}

export async function loginAsBidder(page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('jordan@demo.com');
  await page.locator('input[type="password"]').fill('demo123');
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('/');
}
