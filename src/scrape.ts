import { chromium } from 'playwright';
import { fillInput } from './fillInput';
import { clickButton } from './clickButton';
import fs from 'fs';
import { pickSelect } from './pickSelect';

export const openPage = async (url: string): Promise<void> => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait a bit to see the page
    await page.waitForTimeout(2000);

    await fillInput(page, { type: 'text', className: 'postcode-checker__input' }, 'LN4 2EH');

    await clickButton(page, { textContent: 'Check postcode' });

    // Wait a bit to see the page
    await page.waitForTimeout(2500);

    const elementInfo = await pickSelect(page, {}, '');

    // Wait a bit to see the page
    await page.waitForTimeout(1000);

    if (elementInfo) {
      console.log('Element info: ', JSON.stringify(elementInfo, null, 2));

      await clickButton(page, { textContent: 'Check availability' });

    }

    // Wait a bit to see the page
    await page.waitForTimeout(5000);

    if (elementInfo) {

      const selectedOptions = elementInfo.options[elementInfo.targetIndex];
      console.log('Selected options: ', JSON.stringify(selectedOptions, null, 2));
      // dump current html
      const html = await page.content();
      fs.writeFileSync(`./tmp/page-${selectedOptions.text}.html`, html);
    }

  } finally {
    await browser.close();
  }
};



