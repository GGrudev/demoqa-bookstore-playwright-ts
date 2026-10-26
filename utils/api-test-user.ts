import { ApiHelpers } from './api-helpers';
import { DeletableUser, deleteTestUser } from './test-user-cleanup';

export type ApiTestUser = DeletableUser & {
    token: string;
};

export type LeakedUserReport = DeletableUser & {
    reason: string;
};

type Credentials = {
    userName: string;
    password: string;
};

// Lifecycle of one API-created user: create, run the test body, delete.
//
// Cleanup is armed as soon as the account exists, not after the token arrives. If
// the token step fails, the user is already on the server and still needs deleting.
// A cleanup failure is reported through `onCleanupFailure` and never replaces the
// outcome of `runTest`.
export async function runWithApiTestUser(
    apiHelpers: ApiHelpers,
    credentials: Credentials,
    runTest: (user: ApiTestUser) => Promise<void>,
    onCleanupFailure: (leaked: LeakedUserReport) => Promise<void>
): Promise<void> {
    const account = await apiHelpers.createAccount(credentials.userName, credentials.password);
    const deletable: DeletableUser = {
        userId: account.userId,
        userName: account.userName,
        password: credentials.password,
    };

    try {
        const token = await apiHelpers.fetchToken(credentials.userName, credentials.password);

        await runTest({ ...deletable, token });
    } finally {
        const cleanup = await deleteTestUser(apiHelpers, deletable);

        if (!cleanup.ok) {
            await onCleanupFailure({ ...deletable, reason: cleanup.reason });
        }
    }
}
