import { Criteria } from './criteria';
import { Page } from 'playwright';

export async function getElementText(
  page: Page,
  criteria: Criteria
): Promise<string> {
  const divs = await page.$$(criteria.selector ?? 'div');
  console.log('Found divs:', divs.length);

  for (const div of divs) {
    const divInfo = await div.evaluate(
      (el: HTMLElement, { criteria }: { criteria: Criteria }) => {
        console.log('Div text: ', el.textContent?.trim());
        if (el.className.includes(criteria.className || '')) {
          return{ found: true, text: el.textContent?.trim() || '', className: el.className };
        }

        return {found: false, text: '', className: el.className};
      },
      { criteria }
    );


    console.log('Div info: ', divInfo);
    if (divInfo.found) {
      return divInfo.text;
    }
  }
  return '';
}
