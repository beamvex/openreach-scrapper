import { chromium } from 'playwright-extra';
import { fillInput } from './fillInput';
import { clickButton } from './clickButton';
import { pickSelect } from './pickSelect';
import * as fs from 'fs';
import { downloadS3Object, uploadHtmlToS3, uploadToS3 } from './s3Region';
import { clickElement } from './clickElement';
import { getElementText } from './getElementText';
import { geolocationData } from './geodata';

const postcodes: string[] = Array.from(
  new Set(
    (geolocationData.features ?? [])
      .map(feature => `${feature?.properties?.PCDS ?? ''}`)
      .map(pc => pc.replace(/\s+/g, '').toUpperCase())
      .filter(Boolean)
  )
);

function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase();
}

function formatPostcode(postcode: string): string {
  const normalized = normalizePostcode(postcode);
  if (normalized.length <= 3) {
    return normalized;
  }
  return `${normalized.slice(0, -3)} ${normalized.slice(-3)}`;
}

type ResultsEntry = {
  status?: string;
  queried?: boolean;
  timeAndLocation?: {
    time?: string;
  };
};

function parseResultsJson(json: string): Record<string, ResultsEntry> {
  if (!json) {
    return {};
  }
  try {
    const parsed = JSON.parse(json) as Record<string, ResultsEntry>;
    return parsed ?? {};
  } catch (err) {
    console.warn('Failed to parse results.json; falling back to random postcode', err);
    return {};
  }
}

async function selectTargetPostcode(): Promise<string> {
  const resultsJson = await downloadS3Object('results.json');
  const resultsByPostcode = parseResultsJson(resultsJson);

  const resultsByNormalized = new Map<string, ResultsEntry>();
  for (const [postcodeKey, entry] of Object.entries(resultsByPostcode)) {
    resultsByNormalized.set(normalizePostcode(postcodeKey), entry);
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const notAvailablePostcodes = postcodes.filter(pc => {
    const entry = resultsByNormalized.get(normalizePostcode(pc));
    const status = entry?.status ?? '';
    return status !== 'Available to order now' && status !== 'invalid_postcode';
  });

  const notQueried = notAvailablePostcodes.filter(pc => {
    const entry = resultsByNormalized.get(normalizePostcode(pc));
    return entry?.queried === false || entry?.status === 'not_queried_yet';
  });

  if (notQueried.length > 0) {
    return formatPostcode(notQueried[Math.floor(Math.random() * notQueried.length)]);
  }

  const stale = notAvailablePostcodes.filter(pc => {
    const entry = resultsByNormalized.get(normalizePostcode(pc));
    const lastTime = entry?.timeAndLocation?.time;
    if (!lastTime) {
      return false;
    }
    const lastMs = new Date(lastTime).getTime();
    if (Number.isNaN(lastMs)) {
      return false;
    }
    return now - lastMs > weekMs;
  });

  if (stale.length > 0) {
    return formatPostcode(stale[Math.floor(Math.random() * stale.length)]);
  }

  if (notAvailablePostcodes.length > 0) {
    return formatPostcode(
      notAvailablePostcodes[Math.floor(Math.random() * notAvailablePostcodes.length)]
    );
  }

  return formatPostcode(postcodes[Math.floor(Math.random() * postcodes.length)]);
}

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
    const targetPostcode = await selectTargetPostcode();
    const normalizedPostcode = normalizePostcode(targetPostcode);
    const postcode1 = normalizedPostcode.slice(0, Math.max(0, normalizedPostcode.length - 3));
    const postcode2 = normalizedPostcode.slice(-3);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fillInput(
      page,
      { type: 'text', className: 'postcode-checker__input' },
      targetPostcode
    );

    console.log('Clicking button check postcode');
    await clickButton(page, { textContent: 'Check postcode' });

    console.log('Waiting for 2.5 seconds');
    // Wait a bit to see the page
    await page.waitForTimeout(2500);

    let invalid = false;

    try {
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
    } catch (err) {
      console.warn('Failed to select address / check availability; marking as invalid postcode', err);
      invalid = true;
    }

    const text = invalid
      ? `invalid_postcode_${normalizedPostcode}`
      : await getElementText(page, {
          selector: 'span',
          className: 'address-details append-persistent-address',
        });
    console.log('Text: ', text);

    const html = await page.content();

    const baseName = `${postcode1}_${postcode2}_${timestamp}${invalid ? '_invalid' : ''}`;

    await uploadHtmlToS3(`openreach/${baseName}.html`, html);

    fs.mkdirSync(`/tmp/config/openreach`, { recursive: true });

    await page.screenshot({
      path: `/tmp/config/openreach/${baseName}.png`,
    });

    console.log('Screenshot taken');
    const pngKey = `openreach/${baseName}.png`;

    await uploadToS3(pngKey, `/tmp/config/openreach/${baseName}.png`);
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
