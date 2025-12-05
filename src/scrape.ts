import { chromium } from 'playwright';
import { fillInput } from './fillInput';
import { clickButton } from './clickButton';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { pickSelect } from './pickSelect';

const s3Region = process.env.S3_REGION ?? process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET_NAME;

const s3Client = s3Region
  ? new S3Client({ region: s3Region })
  : undefined;

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

      const html = await page.content();

      const safeName = selectedOptions.text.replace(/[^a-zA-Z0-9_-]+/g, '_');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `openreach/${safeName}-${timestamp}.html`;

      await uploadHtmlToS3(key, html);
    }

  } finally {
    await browser.close();
  }
};



