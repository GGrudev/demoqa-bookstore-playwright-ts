import { test } from '@playwright/test';

export async function attachJson(name: string, data: unknown): Promise<void> {
    await test.info().attach(name, {
        body: Buffer.from(JSON.stringify(data, null, 2)),
        contentType: 'application/json',
    });
}
