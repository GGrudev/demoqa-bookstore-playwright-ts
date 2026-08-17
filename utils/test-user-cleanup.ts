import { ApiHelpers } from './api-helpers';
import { TokenEnvelopeSchema } from '../schemas/account.schema';
import { parseApiResponse } from './schema-validators';

export type DeletableUser = {
    userId: string;
    userName: string;
    password: string;
};

export type CleanupResult = { ok: true } | { ok: false; reason: string };

// Deletes an isolated API user, minting a fresh token first: DemoQA invalidates a
// user's previous token whenever a new one is generated, so a test that exercised
// token rotation leaves the fixture holding a dead token.
//
// Returns a result instead of throwing. Cleanup runs during teardown on a public demo
// site, and a hiccup there must not be able to fail a test that already passed — the
// callers decide how to report it.
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
