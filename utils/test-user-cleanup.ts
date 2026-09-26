import { ApiHelpers } from './api-helpers';
import { TokenEnvelopeSchema } from '@schemas/account.schema';
import { parseApiResponse } from './schema-validators';

export type DeletableUser = {
    userId: string;
    userName: string;
    password: string;
};

export type CleanupResult = { ok: true } | { ok: false; reason: string };

// DemoQA invalidates the previous token when a new one is generated, so a test that
// rotated tokens leaves the fixture holding a dead one — mint a fresh token here.
// Returns a result instead of throwing; callers decide how to report teardown failures.
export async function deleteTestUser(
    apiHelpers: ApiHelpers,
    user: DeletableUser
): Promise<CleanupResult> {
    try {
        const tokenResponse = await apiHelpers.generateToken(user.userName, user.password);

        if (tokenResponse.status !== 200) {
            return { ok: false, reason: `token request returned ${tokenResponse.status}` };
        }

        const { token } = parseApiResponse(TokenEnvelopeSchema, tokenResponse.body);

        if (!token) {
            return { ok: false, reason: 'token request returned no token' };
        }

        const deleteResponse = await apiHelpers.deleteUser(user.userId, token);

        if (deleteResponse.status !== 204) {
            return { ok: false, reason: `delete returned ${deleteResponse.status}` };
        }

        return { ok: true };
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
}
