import { Locator, Page, expect } from '@playwright/test';
import { getTimeouts } from '../config/environments';

const timeouts = getTimeouts();

// Bootstrap modal confirmation used on Profile (delete book / delete all / delete account).
// Owns the DemoQA-specific race between the modal OK button and an optional native alert.
export class ConfirmDialog {
    constructor(private readonly page: Page) {}

    async confirmBootstrap(confirmButton: Locator) {
        await expect(confirmButton).toBeVisible();
        await confirmButton.click();
        await expect(confirmButton).toBeHidden({ timeout: timeouts.uiSettle });
    }

    async confirmWithOptionalAlert(confirmButton: Locator, waitToClose = true) {
        await expect(confirmButton).toBeVisible({ timeout: timeouts.dialog });
        // DemoQA sometimes follows the Bootstrap confirm with a native alert. Register a
        // one-shot handler *before* clicking so the dialog is always accepted whenever it
        // fires, instead of racing a fixed waitForEvent timeout that can miss a slow alert.
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
