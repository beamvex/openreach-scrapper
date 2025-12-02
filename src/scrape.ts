import { chromium } from 'playwright';

export const openPage = async (url: string): Promise<void> => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait a bit to see the page
  await page.waitForTimeout(5000);

  await browser.close();
};
