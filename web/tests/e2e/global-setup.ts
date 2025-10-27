import { chromium } from '@playwright/test';
import { loginWithMagicLink } from './utils/supabaseAuth';

const STORAGE_STATE = './tests/e2e/.auth-storage.json';
const TEST_EMAIL = 'e2e-test-user@example.com';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await loginWithMagicLink(page, TEST_EMAIL);
  await page.waitForURL('http://localhost:5173/#');
  // Save storage state after login
  await page.context().storageState({ path: STORAGE_STATE });
  await browser.close();
}

export default globalSetup;
