import { Page } from "playwright";
import { Criteria } from "./criteria";

export async function fillInput(page: Page, criteria: Criteria, fillText: string) {
  const elements = await page.$$(criteria.selector ?? 'input');
  console.log('Found input elements:', elements.length);

  for (const element of elements) {
    const elementInfo = await element.evaluate((el: HTMLElement, { criteria, fillText }: { criteria: Criteria, fillText: string }) => {
      const input = el as HTMLInputElement;

      // If this is the postcode input, "type" into it here
      if ((input.type === (criteria.type ?? 'text')) && input.className.includes(criteria.className ?? '')) {
        const text = fillText;

        input.focus();
        input.value = text;

        // Fire the usual events apps listen for
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return {
        tagName: el.tagName,
        class: el.className,
        type: (el as HTMLInputElement).type,
        placeholder: (el as HTMLInputElement).placeholder,
        value: (el as HTMLInputElement).value,
        name: (el as HTMLInputElement).name,
      };
    }, { criteria, fillText });

    console.log('Input: ', JSON.stringify(elementInfo, null, 2));
  }
}
