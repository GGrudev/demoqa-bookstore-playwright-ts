import { Locator, Page, expect } from '@playwright/test';

export class Header {
    readonly userNameValue: Locator;
    readonly loginButton: Locator;
    readonly logoutButton: Locator;
    readonly notLoggedInMessage: Locator;

    constructor(private readonly page: Page) {
        // Book details reuses `#userName-value` for field values; `.first()` is the header.
        this.userNameValue = page.locator('#userName-value').first();
        this.loginButton = page.locator('#login');
        this.logoutButton = page.locator('#submit').filter({ hasText: /log\s?out/i });
        this.notLoggedInMessage = page.getByText(
            'Currently you are not logged into the Book Store application'
        );
    }

    async expectLoggedIn(expectedUserName: string): Promise<void> {
        await expect(this.userNameValue).toHaveText(expectedUserName);
        await expect(this.logoutButton).toBeVisible();
    }

    async expectLoggedOut(): Promise<void> {
        await expect(this.loginButton).toBeVisible();
    }

    async expectNotLoggedInMessage(): Promise<void> {
        await expect(this.notLoggedInMessage).toBeVisible();
    }

    async logout(): Promise<void> {
        await this.logoutButton.click();
    }
}
