import { test } from '@playwright/test';

// Attaches structured JSON to the Playwright report so hybrid/API failures
// include the IDs needed to debug DemoQA state without re-running locally.
export async function attachJson(name: string, data: unknown): Promise<void> {
    await test.info().attach(name, {
        body: Buffer.from(JSON.stringify(data, null, 2)),
        contentType: 'application/json',
    });
}
