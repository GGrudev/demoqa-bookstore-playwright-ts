import { Locator, Page, expect } from '@playwright/test';
import { getTimeouts } from '@config/environments';

const timeouts = getTimeouts();

export class ConfirmDialog {
    constructor(private readonly page: Page) {}

    async confirmBootstrap(confirmButton: Locator) {
        await expect(confirmButton).toBeVisible();
        await confirmButton.click();
        await expect(confirmButton).toBeHidden({ timeout: timeouts.uiSettle });
    }

    async confirmWithOptionalAlert(confirmButton: Locator, waitToClose = true) {
        await expect(confirmButton).toBeVisible({ timeout: timeouts.dialog });
        // DemoQA sometimes follows the Bootstrap confirm with a native alert. Accept it
        // if it fires; do not waitForEvent (a slow alert misses a fixed timeout).
        this.page.once('dialog', (dialog) => {
            void dialog.accept().catch(() => undefined);
        });
        await confirmButton.evaluate((button) => (button as HTMLButtonElement).click());
        if (waitToClose) {
            await expect(confirmButton).toBeHidden({ timeout: timeouts.uiSettle });
        }
    }

    async confirmDeleteBook() {
        await this.confirmWithOptionalAlert(this.page.locator('#closeSmallModal-ok'));
    }
}
