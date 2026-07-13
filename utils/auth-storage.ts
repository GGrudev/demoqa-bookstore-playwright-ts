import fs from 'fs/promises';
import path from 'path';

export const AUTH_DIR = path.join(process.cwd(), '.auth');

// Shared storage-state file produced by the `setup` project (tests/auth.setup.ts)
// and consumed by the `authenticated` project in playwright.config.ts.
export const STATIC_USER_STORAGE_STATE = path.join(AUTH_DIR, 'static-user.json');

export async function ensureAuthDir(): Promise<void> {
    await fs.mkdir(AUTH_DIR, { recursive: true });
}
