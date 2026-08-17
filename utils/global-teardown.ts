import { request } from '@playwright/test';
import { ApiHelpers } from './api-helpers';
import { deleteTestUser } from './test-user-cleanup';
import { LEAKED_USERS_FILE, readLeakedUsers, writeLeakedUsers } from './test-user-registry';

// Best-effort sweep for isolated users whose per-test cleanup failed. Without it a
// teardown hiccup would strand accounts on DemoQA permanently, since the fixture no
// longer fails the run over cleanup.
//
// This never throws: the run's result is decided by the tests, not by housekeeping.
// Anything still undeletable is left in the registry file and reported loudly.
export default async function globalTeardown(): Promise<void> {
    const leaked = await readLeakedUsers();

    if (leaked.length === 0) {
        return;
    }

    console.warn(`\nRetrying cleanup for ${leaked.length} leaked test user(s)...`);

    const context = await request.newContext();
    const apiHelpers = new ApiHelpers(context);
    const stillLeaked = [];

    try {
        for (const user of leaked) {
            const result = await deleteTestUser(apiHelpers, user);

            if (!result.ok) {
                stillLeaked.push({ ...user, reason: result.reason });
            }
        }
    } finally {
        await context.dispose();
    }

    await writeLeakedUsers(stillLeaked);

    if (stillLeaked.length === 0) {
        console.warn('All leaked test users were removed.\n');
        return;
    }

    console.warn(
        `${stillLeaked.length} test user(s) could not be deleted and remain on DemoQA. ` +
            `Details recorded in ${LEAKED_USERS_FILE}:`
    );
    for (const user of stillLeaked) {
        console.warn(`  - ${user.userName} (${user.userId}): ${user.reason}`);
    }
    console.warn('');
}
