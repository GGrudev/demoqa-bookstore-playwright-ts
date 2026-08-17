import fs from 'fs/promises';
import path from 'path';
import { DeletableUser } from './test-user-cleanup';

export const REGISTRY_DIR = path.join(process.cwd(), '.test-users');
export const LEAKED_USERS_FILE = path.join(REGISTRY_DIR, 'leaked-users.jsonl');

export type LeakedUser = DeletableUser & {
    reason: string;
};

// Playwright runs specs in worker processes, so a worker cannot hand a failed cleanup
// back to `globalTeardown` in memory. Leaks are appended to a JSONL file instead and
// drained once the run finishes. Only failures are written, so the file is empty in
// the normal case and appends stay small enough not to interleave.
export async function recordLeakedUser(user: LeakedUser): Promise<void> {
    await fs.mkdir(REGISTRY_DIR, { recursive: true });
    await fs.appendFile(LEAKED_USERS_FILE, `${JSON.stringify(user)}\n`, 'utf8');
}

export async function readLeakedUsers(): Promise<LeakedUser[]> {
    let contents: string;

    try {
        contents = await fs.readFile(LEAKED_USERS_FILE, 'utf8');
    } catch {
        return [];
    }

    return contents
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as LeakedUser);
}

export async function writeLeakedUsers(users: LeakedUser[]): Promise<void> {
    if (users.length === 0) {
        await fs.rm(LEAKED_USERS_FILE, { force: true });
        return;
    }

    await fs.mkdir(REGISTRY_DIR, { recursive: true });
    await fs.writeFile(
        LEAKED_USERS_FILE,
        `${users.map((user) => JSON.stringify(user)).join('\n')}\n`,
        'utf8'
    );
}
