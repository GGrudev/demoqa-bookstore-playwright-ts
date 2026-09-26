import { test as base } from '@playwright/test';
import { ApiHelpers } from '@utils/api-helpers';
import { StubServer } from './stub-server';

type StubFixtures = {
    stubServer: StubServer;
    stubApi: ApiHelpers;
};

export const test = base.extend<StubFixtures>({
    // Playwright reads fixture deps from the destructuring; this fixture has none.
    stubServer: async ({}, use) => {
        const server = await StubServer.start();
        try {
            await use(server);
        } finally {
            await server.stop();
        }
    },
    stubApi: async ({ request, stubServer }, use) => {
        await use(new ApiHelpers(request, stubServer.baseUrl));
    },
});

export { expect } from '@playwright/test';
