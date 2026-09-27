import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { assessCatalogResponse, checkDemoQaHealth } from '../../../scripts/check-demoqa-health';
import {
    formatRetrySummary,
    readJUnitReports,
    summarizeJUnit,
} from '../../../scripts/summarize-retries';
import booksList from '../recorded/books-list.json';

const passedAfterRetry = `
<testsuite name="login.spec.ts">
  <testcase name="shows the form" classname="login.spec.ts"></testcase>
  <testcase name="logs in" classname="login.spec.ts">
    <flakyFailure message="timeout" type="TimeoutError"></flakyFailure>
  </testcase>
  <testcase name="rejects a bad password" classname="login.spec.ts">
    <failure message="expected visible" type="expect.toBeVisible"></failure>
    <rerunFailure message="expected visible" type="expect.toBeVisible"></rerunFailure>
  </testcase>
  <testcase name="waits for a banner" classname="login.spec.ts">
    <skipped></skipped>
  </testcase>
</testsuite>
`;

test.describe('DemoQA health check', { tag: ['@offline'] }, () => {
    test('accepts a catalog with at least one book', () => {
        expect(assessCatalogResponse(200, booksList, true)).toEqual({
            ok: true,
            bookCount: 2,
        });
    });

    test('rejects an empty catalog, a non-200 response, and invalid JSON', () => {
        expect(assessCatalogResponse(200, { books: [] }, true)).toEqual({
            ok: false,
            reason: 'DemoQA catalog returned no books',
        });
        expect(assessCatalogResponse(503, null, false)).toEqual({
            ok: false,
            reason: 'DemoQA catalog returned HTTP 503',
        });
        expect(assessCatalogResponse(200, undefined, false)).toEqual({
            ok: false,
            reason: 'DemoQA catalog returned invalid JSON',
        });
    });

    test('retries a failed catalog request once', async () => {
        const statuses = [503, 200];
        const result = await checkDemoQaHealth({
            baseUrl: 'https://example.test',
            attempts: 2,
            sleep: async () => {},
            fetchImpl: async (input) => {
                expect(String(input)).toBe('https://example.test/BookStore/v1/Books');
                const status = statuses.shift() ?? 500;
                const body = status === 200 ? JSON.stringify({ books: [{ isbn: '1' }] }) : 'down';
                return new Response(body, { status });
            },
        });

        expect(statuses).toEqual([]);
        expect(result).toEqual({ ok: true, bookCount: 1 });
    });
});

test.describe('Retry summary', { tag: ['@offline'] }, () => {
    test('counts a pass after retry separately from a first-attempt pass', () => {
        const summary = summarizeJUnit(passedAfterRetry, 'junit-e2e-1');

        expect(summary).toMatchObject({
            tests: 4,
            passedFirstTry: 1,
            passedAfterRetry: 1,
            failed: 1,
            skipped: 1,
        });
        expect(summary.findings).toEqual([
            {
                source: 'junit-e2e-1',
                name: 'login.spec.ts › logs in',
                kind: 'passed-after-retry',
                failedAttempts: 1,
            },
            {
                source: 'junit-e2e-1',
                name: 'login.spec.ts › rejects a bad password',
                kind: 'failed-after-retry',
                failedAttempts: 2,
            },
        ]);
    });

    test('ignores the merged end-to-end report so shard results are not counted twice', async () => {
        const root = await mkdtemp(path.join(tmpdir(), 'junit-reports-'));

        try {
            await mkdir(path.join(root, 'junit-e2e-1'), { recursive: true });
            await mkdir(path.join(root, 'junit-e2e-merged'), { recursive: true });
            await writeFile(path.join(root, 'junit-e2e-1', 'junit.xml'), passedAfterRetry, 'utf8');
            await writeFile(
                path.join(root, 'junit-e2e-merged', 'junit.xml'),
                passedAfterRetry,
                'utf8'
            );

            const documents = await readJUnitReports(root);
            const markdown = formatRetrySummary(
                summarizeJUnit(documents[0]?.xml ?? '', documents[0]?.source ?? ''),
                documents.length
            );

            expect(documents).toHaveLength(1);
            expect(documents[0]?.source).toBe('junit-e2e-1');
            expect(markdown).toContain('Passed after retry');
            expect(markdown).toContain('junit-e2e-1');
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
});
