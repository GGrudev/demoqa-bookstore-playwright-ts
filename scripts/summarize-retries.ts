import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const MERGED_E2E_REPORT = 'junit-e2e-merged';

export type RetryKind = 'passed-after-retry' | 'failed-after-retry';

export type RetryFinding = {
    source: string;
    name: string;
    kind: RetryKind;
    failedAttempts: number;
};

export type RetrySummary = {
    tests: number;
    passedFirstTry: number;
    passedAfterRetry: number;
    failed: number;
    skipped: number;
    findings: RetryFinding[];
};

export type JUnitDocument = {
    source: string;
    xml: string;
};

const emptySummary = (): RetrySummary => ({
    tests: 0,
    passedFirstTry: 0,
    passedAfterRetry: 0,
    failed: 0,
    skipped: 0,
    findings: [],
});

function decodeXml(value: string): string {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function stripCdata(xml: string): string {
    return xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
}

function countTag(body: string, tag: string): number {
    return body.match(new RegExp(`<${tag}\\b`, 'g'))?.length ?? 0;
}

function readAttribute(attributes: string, name: string): string {
    const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`));
    return match ? decodeXml(match[1]) : '';
}

export function summarizeJUnit(xml: string, source: string): RetrySummary {
    const summary = emptySummary();
    const withoutCharacterData = stripCdata(xml);
    const testCases = withoutCharacterData.matchAll(/<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g);

    for (const testCase of testCases) {
        summary.tests += 1;
        const attributes = testCase[1] ?? '';
        const body = testCase[2] ?? '';
        const name = readAttribute(attributes, 'name') || '(unnamed test)';
        const classname = readAttribute(attributes, 'classname');
        const title = classname ? `${classname} › ${name}` : name;
        const flakyAttempts = countTag(body, 'flakyFailure') + countTag(body, 'flakyError');
        const rerunAttempts = countTag(body, 'rerunFailure') + countTag(body, 'rerunError');
        const failed = countTag(body, 'failure') + countTag(body, 'error') > 0;
        const skipped = countTag(body, 'skipped') > 0;

        if (skipped) {
            summary.skipped += 1;
            continue;
        }

        if (flakyAttempts > 0) {
            summary.passedAfterRetry += 1;
            summary.findings.push({
                source,
                name: title,
                kind: 'passed-after-retry',
                failedAttempts: flakyAttempts,
            });
            continue;
        }

        if (failed) {
            summary.failed += 1;
            if (rerunAttempts > 0) {
                summary.findings.push({
                    source,
                    name: title,
                    kind: 'failed-after-retry',
                    failedAttempts: rerunAttempts + 1,
                });
            }
            continue;
        }

        summary.passedFirstTry += 1;
    }

    return summary;
}

export function summarizeJUnitDocuments(documents: JUnitDocument[]): RetrySummary {
    return documents.reduce((combined, document) => {
        const next = summarizeJUnit(document.xml, document.source);
        return {
            tests: combined.tests + next.tests,
            passedFirstTry: combined.passedFirstTry + next.passedFirstTry,
            passedAfterRetry: combined.passedAfterRetry + next.passedAfterRetry,
            failed: combined.failed + next.failed,
            skipped: combined.skipped + next.skipped,
            findings: combined.findings.concat(next.findings),
        };
    }, emptySummary());
}

export function formatRetrySummary(summary: RetrySummary, reportCount: number): string {
    if (reportCount === 0) {
        return '## Retry summary\n\nNo JUnit reports were produced.\n';
    }

    const lines = [
        '## Retry summary',
        '',
        '| Outcome | Tests |',
        '| --- | ---: |',
        `| Passed on first attempt | ${summary.passedFirstTry} |`,
        `| Passed after retry | ${summary.passedAfterRetry} |`,
        `| Failed | ${summary.failed} |`,
        `| Skipped | ${summary.skipped} |`,
        '',
    ];

    if (summary.findings.length === 0) {
        lines.push('No test needed a retry.');
        lines.push('');
        return lines.join('\n');
    }

    lines.push('### Tests that needed a retry', '');

    for (const finding of summary.findings) {
        const label =
            finding.kind === 'passed-after-retry' ? 'passed after retry' : 'failed after retry';
        const attemptLabel = finding.failedAttempts === 1 ? 'attempt' : 'attempts';
        lines.push(
            `- \`${finding.source}\` ${finding.name} (${label}, ${finding.failedAttempts} failed ${attemptLabel})`
        );
    }

    lines.push('');
    lines.push('A pass after retry is still a pass. Review it as reliability evidence.');
    lines.push('');
    return lines.join('\n');
}

export async function readJUnitReports(root: string): Promise<JUnitDocument[]> {
    const documents: JUnitDocument[] = [];

    async function walk(directory: string): Promise<void> {
        const entries = await readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.name === MERGED_E2E_REPORT) {
                continue;
            }

            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
                continue;
            }

            if (entry.name !== 'junit.xml') {
                continue;
            }

            const relativePath = path.relative(root, fullPath);
            const source = relativePath.split(path.sep)[0] || entry.name;
            documents.push({ source, xml: await readFile(fullPath, 'utf8') });
        }
    }

    try {
        await walk(root);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }

    return documents;
}
