import { chromium } from 'playwright';

export const openPage = async (url: string): Promise<void> => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  const elements = await page.$$('input');
  console.log('Found input elements:', elements.length);

  const postcodeInput = page.getByPlaceholder(/postcode/i).first();
  await postcodeInput.waitFor({ state: 'visible' });
  await postcodeInput.fill('SW1A 1AA');
  console.log('Filled postcode input with SW1A 1AA');

  // Wait a bit to see the page
  await page.waitForTimeout(60000);

  await browser.close();
};
