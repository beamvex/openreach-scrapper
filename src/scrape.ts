import { chromium } from 'playwright-extra';
import { fillInput } from './fillInput';
import { clickButton } from './clickButton';
import { pickSelect } from './pickSelect';
import * as fs from 'fs';
import { uploadHtmlToS3, uploadToS3 } from './s3Region';

export const openPage = async (url: string): Promise<void> => {
  console.log('Launching Chromium...');

  const browser = await chromium.connectOverCDP({
    wsEndpoint: 'http://localhost:9222',
  });
  console.log('Chromium launched, creating new page...');
  const page = await browser.newPage();

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
      'LN42EH'
    );

    /*
    await fillInput(
      page,
      { type: 'text', className: 'always-on-fibrechecker-input' },
      'LN42EH'
    );*/

    console.log('Clicking button check postcode');
    await clickButton(page, { textContent: 'Check postcode' });

    console.log('Waiting for 2.5 seconds');
    // Wait a bit to see the page
    await page.waitForTimeout(2500);

    console.log('Picking select address');
    const elementInfo = await pickSelect(page, {}, '');

    console.log('Waiting for 1 second');
    // Wait a bit to see the page
    await page.waitForTimeout(1000);

    if (elementInfo) {
      console.log('Element info: ', JSON.stringify(elementInfo, null, 2));

      await clickButton(page, { textContent: 'Check availability' });
    }

    console.log('Waiting for 5 seconds');
    // Wait a bit to see the page
    await page.waitForTimeout(5000);

    if (elementInfo) {
      const selectedOptions = elementInfo.options[elementInfo.targetIndex];
      console.log(
        'Selected options: ',
        JSON.stringify(selectedOptions, null, 2)
      );
    }

    // wait for ctrlc
    await page.waitForTimeout(1000);

    const html = await page.content();

    const safeName = 'test'; //selectedOptions.text.replace(/[^a-zA-Z0-9_-]+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    //fs.writeFileSync(`/tmp/openreach/${safeName}-${timestamp}.html`, html);

    await uploadHtmlToS3(`openreach/${safeName}-${timestamp}.html`, html);

    //console.log('HTML uploaded to S3');

    fs.mkdirSync(`/config/openreach`, { recursive: true });

    await page.screenshot({
      path: `/config/openreach/${safeName}-${timestamp}.png`,
    });

    console.log('Screenshot taken');
    const pngKey = `openreach/${safeName}-${timestamp}.png`;

    await uploadToS3(pngKey, `/config/openreach/${safeName}-${timestamp}.png`);
    console.log('Screenshot uploaded to S3');
  } finally {
    await browser.close();
    console.log('Chromium closed');
  }
};
