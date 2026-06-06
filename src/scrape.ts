import { chromium } from 'playwright-extra';
import { fillInput } from './fillInput';
import { clickButton } from './clickButton';
import { pickSelect } from './pickSelect';
import * as fs from 'fs';
import { uploadHtmlToS3, uploadToS3 } from './s3Region';
import { postcodes } from './postcodes';
import { clickElement } from './clickElement';
import { getElementText } from './getElementText';

export const openPage = async (url: string): Promise<void> => {
  console.log('Launching Chromium...');

  const browser = await chromium.connectOverCDP({
    wsEndpoint: 'http://localhost:9222',
  });
  console.log('Chromium launched, creating new page...');
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();

  try {
    console.log('Navigating to ', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    console.log('Waiting for 3 seconds');
    // Wait a bit to see the page
    await page.waitForTimeout(3000);

    console.log('Clicking button reject all');
    await clickButton(page, { type: 'submit', textContent: 'Reject all' });

    // Wait a bit to see the page
    await page.waitForTimeout(2000);

    console.log('Filling input postcode');
    await fillInput(
      page,
      { type: 'text', className: 'postcode-checker__input' },
      postcodes[Math.floor(Math.random() * postcodes.length)]
    );

    console.log('Clicking button check postcode');
    await clickButton(page, { textContent: 'Check postcode' });

    console.log('Waiting for 2.5 seconds');
    // Wait a bit to see the page
    await page.waitForTimeout(2500);

    // press down arrow to select the first option
    await clickElement(page, { className: 'selector-container rd-dropdown-arrow' });

    console.log('Waiting for 1 second');
    // Wait a bit to see the page
    await page.waitForTimeout(1000);

    await clickElement(page, { selector: 'div', className: 'option-text' });

    console.log('Waiting for 1 second');
    // Wait a bit to see the page
    await page.waitForTimeout(1000);


    await clickButton(page, { textContent: 'Check availability' });

    // wait for ctrlc
    await page.waitForTimeout(5000);

    const text = await getElementText(page, { selector: 'span', className: 'address-details append-persistent-address' });
    console.log('Text: ', text);

    const html = await page.content();

    const safeName = `${text.replace(/[^a-zA-Z0-9_-]+/g, '_')}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    //fs.writeFileSync(`/tmp/openreach/${safeName}-${timestamp}.html`, html);

    await uploadHtmlToS3(`openreach/${safeName}.html`, html);

    fs.mkdirSync(`/tmp/config/openreach`, { recursive: true });

    await page.screenshot({
      path: `/tmp/config/openreach/${safeName}.png`,
    });

    console.log('Screenshot taken');
    const pngKey = `openreach/${safeName}.png`;

    await uploadToS3(
      pngKey,
      `/tmp/config/openreach/${safeName}.png`
    );
    console.log('Screenshot uploaded to S3');

    if (process.env.NODE_ENV === 'development') {
      console.log('Waiting for 1 minute');
      // Wait a bit to see the page
      await page.waitForTimeout(1 * 60 * 1000);
    }

  } finally {
    await browser.close();
    console.log('Chromium closed');
  }
};
