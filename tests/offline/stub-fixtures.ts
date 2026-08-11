import { test as base } from '@playwright/test';
import { ApiHelpers } from '../../utils/api-helpers';
import { StubServer } from './stub-server';

type StubFixtures = {
    stubServer: StubServer;
    stubApi: ApiHelpers;
};

// Wires the real `ApiHelpers` to a per-test stub server. Nothing here touches DemoQA,
// so these tests are safe to run on every push and pull request.
export const test = base.extend<StubFixtures>({
    // eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring
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
