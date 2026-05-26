import { Locator, Page } from '@playwright/test';

export class Waits {
    constructor(protected page: Page) {}

    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('load');
    }

    async waitElementToBeVisible(element: Locator, timeout?: number): Promise<void> {
        await element.waitFor({
            state: 'visible',
            timeout: timeout,
        });
    }

    async waitElementToBeHidden(element: Locator, timeout?: number): Promise<void> {
        await element.waitFor({
            state: 'hidden',
            timeout: timeout,
        });
    }

    async waitElementToBeEnabled(element: Locator): Promise<void> {
        await element.waitFor({ state: 'visible' });
    }

    async waitForNetworkIdle(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    async waitForUrl(urlPattern: string | RegExp): Promise<void> {
        await this.page.waitForURL(urlPattern);
    }

    async waitForMultipleElements(elements: Locator[]): Promise<void> {
        await Promise.all(elements.map((element) => this.waitElementToBeVisible(element)));
    }
}
