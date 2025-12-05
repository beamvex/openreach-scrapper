import { Page } from "playwright";
import { Criteria } from "./criteria";
import { clickButton } from "./clickButton";

export async function pickSelect(page: Page, criteria: Criteria, fillText: string) {
    const elements = await page.$$(criteria.selector ?? 'select');
    console.log('Found select elements:', elements.length);

    for (const element of elements) {
        const elementInfo = await element.evaluate((el: HTMLElement, { criteria, fillText }: { criteria: Criteria, fillText: string }) => {
            const select = el as HTMLSelectElement;

            const formcontrolname = select.getAttribute('formcontrolname');

            // For now, always select the first non-placeholder option so we can
            // reliably simulate a user picking an address.
            const optionsArray = Array.from(select.options) as HTMLOptionElement[];
            const targetIndex = optionsArray.findIndex((opt) => opt.value !== '0: null');

            if (targetIndex >= 0) {
                const targetOption = optionsArray[targetIndex];

                select.focus();

                // Clear previous selection and select the target
                optionsArray.forEach((opt) => {
                    opt.selected = false;
                });
                targetOption.selected = true;
                select.selectedIndex = targetIndex;

                // Fire the usual events apps listen for
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const result = {
                tagName: el.tagName,
                class: el.className,
                type: select.type,
                value: select.value,
                name: select.name,
                formcontrolname,
                options: (Array.from(select.options) as HTMLOptionElement[]).map((option) => ({
                    value: option.value,
                    text: option.text,
                    selected: option.selected
                }))
            };

            return result;
        }, { criteria, fillText });



        console.log('Select: ', JSON.stringify(elementInfo, null, 2));
    }
}
