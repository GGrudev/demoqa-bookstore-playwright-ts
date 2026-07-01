import fs from 'fs/promises';
import path from 'path';
import { Page } from '@playwright/test';

export const AUTH_DIR = path.join(process.cwd(), '.auth');

export async function ensureAuthDir(): Promise<void> {
    await fs.mkdir(AUTH_DIR, { recursive: true });
}

export async function saveStorageState(page: Page, fileName: string): Promise<string> {
    await ensureAuthDir();
    const storageStatePath = path.join(AUTH_DIR, fileName);
    await page.context().storageState({ path: storageStatePath });
    return storageStatePath;
}

export async function removeStorageState(storageStatePath: string): Promise<void> {
    await fs.unlink(storageStatePath).catch(() => {});
}
