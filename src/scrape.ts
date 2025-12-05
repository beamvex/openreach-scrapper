import { chromium } from 'playwright';
import { fillInput } from './fillInput';
import { clickButton } from './clickButton';

export const openPage = async (url: string): Promise<void> => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait a bit to see the page
    await page.waitForTimeout(5000);

    await fillInput(page, { type: 'text', className: 'postcode-checker__input' }, 'LN4 2EH');

    await clickButton(page, { textContent: 'Check postcode' });

    // Wait a bit to see the page
    await page.waitForTimeout(5000);

  } finally {
    await browser.close();
  }
};



