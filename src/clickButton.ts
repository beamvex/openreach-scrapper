import { Criteria } from './criteria';
import { Page } from 'playwright';

export async function clickButton(
  page: Page,
  criteria: Criteria
): Promise<void> {
  const buttons = await page.$$(criteria.selector ?? 'button');
  console.log('Found button elements:', buttons.length);

  for (const button of buttons) {
    const buttonInfo = await button.evaluate(
      (el: HTMLElement, { criteria }: { criteria: Criteria }) => {
        console.log('Button text: ', el.textContent?.trim());
        if (el.textContent?.trim() === criteria.textContent || '') {
          console.log('Clicking button');
          el.click();
        }

        return {
          tagName: el.tagName,
          type: (el as HTMLButtonElement).type,
          text: (el as HTMLButtonElement).textContent?.trim() || '',
          shouldHaveClicked:
            el.textContent?.trim() === criteria.textContent || '',
        };
      },
      { criteria }
    );

    //console.log('Button: ', JSON.stringify(buttonInfo, null, 2));
  }
}
