import { chromium } from 'playwright';

export const openPage = async (url: string): Promise<void> => {
  const browser = await chromium.launch({ headless: true, devtools: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  const elements = await page.$$('input');
  console.log('Found input elements:', elements.length);

  // Log details of each input element
  for (let i = 0; i < elements.length; i++) {
    const tagName = await elements[i].evaluate(el => el.tagName);
    const type = await elements[i].evaluate(el => el.getAttribute('type'));
    const placeholder = await elements[i].evaluate(el => el.getAttribute('placeholder'));
    console.log(`Input ${i + 1}: tag=${tagName}, type=${type}, placeholder=${placeholder}`);
  }

  // Wait a bit to see the page
  //await page.waitForTimeout(5000);

  await browser.close();
};
