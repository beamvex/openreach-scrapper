import { chromium } from 'playwright-extra';

import { fillInput } from './fillInput';
import { clickButton } from './clickButton';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { pickSelect } from './pickSelect';
import fs from 'fs';

const s3Region = process.env.S3_REGION ?? process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET_NAME;

const s3Client = s3Region ? new S3Client({ region: s3Region }) : undefined;

async function uploadHtmlToS3(key: string, html: string): Promise<void> {
  if (!s3Bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }
  if (!s3Client) {
    throw new Error('S3_REGION or AWS_REGION environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: html,
    ContentType: 'text/html; charset=utf-8',
  });

  await s3Client.send(command);
}

async function uploadToS3(key: string, filePath: string): Promise<void> {
  if (!s3Bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }
  if (!s3Client) {
    throw new Error('S3_REGION or AWS_REGION environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: fs.createReadStream(filePath),
    ContentType: 'image/png',
  });

  await s3Client.send(command);
}

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

    console.log('Waiting for networkidle');
    // Wait a bit to see the page
    await page.waitForTimeout(12000);

    console.log('Clicking button');
    await clickButton(page, { type: 'submit', textContent: 'Reject all' });

    // Wait a bit to see the page
    await page.waitForTimeout(2000);

    console.log('Filling input');
    await fillInput(
      page,
      { type: 'text', className: 'postcode-checker__input' },
      'LN42EH'
    );

    await fillInput(
      page,
      { type: 'text', className: 'always-on-fibrechecker-input' },
      'LN42EH'
    );

    console.log('Clicking button');
    await clickButton(page, { textContent: 'Check postcode' });

    console.log('Waiting for 2.5 seconds');
    // Wait a bit to see the page
    await page.waitForTimeout(2500);

    console.log('Picking select');
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

    const html = await page.content();

    const safeName = 'test'; //selectedOptions.text.replace(/[^a-zA-Z0-9_-]+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `openreach/${safeName}-${timestamp}.html`;

    //await uploadHtmlToS3(key, html);

    //console.log('HTML uploaded to S3');

    await page.screenshot({
      path: `/tmp/openreach/${safeName}-${timestamp}.png`,
    });

    console.log('Screenshot taken');
    //const pngKey = `openreach/${safeName}-${timestamp}.png`;

    // await uploadToS3(pngKey, `/tmp/openreach/${safeName}-${timestamp}.png`);
  } finally {
    await browser.close();
    console.log('Chromium closed');
  }
};
