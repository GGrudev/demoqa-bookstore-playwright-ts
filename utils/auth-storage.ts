import fs from 'fs/promises';
import path from 'path';

export const AUTH_DIR = path.join(process.cwd(), '.auth');

export const STATIC_USER_STORAGE_STATE = path.join(AUTH_DIR, 'static-user.json');

export async function ensureAuthDir(): Promise<void> {
    await fs.mkdir(AUTH_DIR, { recursive: true });
}
