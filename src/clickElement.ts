import { Criteria } from './criteria';
import { Page } from 'playwright';

export async function clickElement(
  page: Page,
  criteria: Criteria
): Promise<void> {
  const divs = await page.$$(criteria.selector ?? 'div');
  console.log('Found button divs:', divs.length);

  for (const div of divs) {
    const divInfo = await div.evaluate(
      (el: HTMLElement, { criteria }: { criteria: Criteria }) => {
        console.log('Div text: ', el.textContent?.trim());
        if (el.className.includes(criteria.className || '')) {
          console.log('Clicking div');
          el.click();
        }

        return {
          tagName: el.tagName,
          className: el.className,
          text: el.textContent?.trim() || '',
          shouldHaveClicked:
            el.className.includes(criteria.className || '') || false,
        };
      },
      { criteria }
    );

    // console.log('Div: ', JSON.stringify(divInfo, null, 2));
    // console.log('Div: ', divInfo.className);
  }
}
