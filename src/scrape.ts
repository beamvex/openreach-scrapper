import { chromium } from 'playwright';

export const openPage = async (url: string): Promise<void> => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  const elements = await page.$$('input');
  console.log('Found input elements:', elements.length);

  // Wait a bit to see the page
  await page.waitForTimeout(5000);

  await browser.close();
};
