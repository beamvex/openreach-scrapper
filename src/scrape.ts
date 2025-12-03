import { chromium } from 'playwright';

export const openPage = async (url: string): Promise<void> => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait a bit to see the page
  await page.waitForTimeout(5000);

  const elements = await page.$$('input');
  console.log('Found input elements:', elements.length);

  for (const element of elements) {
    const elementInfo = await element.evaluate(el => {
      const input = el as HTMLInputElement;

      // If this is the postcode input, "type" into it here
      if (input.type === 'text') {
        const text = 'LN4 2EH';

        input.focus();
        input.value = text;

        // Fire the usual events apps listen for
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return {
        tagName: el.tagName,
        type: (el as HTMLInputElement).type,
        placeholder: (el as HTMLInputElement).placeholder,
        value: (el as HTMLInputElement).value,
        name: (el as HTMLInputElement).name,
      };
    });

    console.log('Input: ', JSON.stringify(elementInfo, null, 2));
  }

  const buttons = await page.$$('button');
  console.log('Found button elements:', buttons.length);

  for (const button of buttons) {
    const buttonInfo = await button.evaluate(el => {

      console.log('Button text: ', el.textContent?.trim());
      if (el.textContent?.trim() === 'Check postcode') {
        console.log('Clicking button');
        el.click();
      }

      return {
        tagName: el.tagName,
        type: (el as HTMLButtonElement).type,
        text: (el as HTMLButtonElement).textContent?.trim() || '',
      };
    });

    console.log('Button: ', JSON.stringify(buttonInfo, null, 2));
  }

  // Wait a bit to see the page
  await page.waitForTimeout(65000);

  await browser.close();
};
