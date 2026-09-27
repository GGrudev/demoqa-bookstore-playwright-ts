import { appendFile, writeFile } from 'node:fs/promises';
import {
    formatRetrySummary,
    readJUnitReports,
    summarizeJUnitDocuments,
} from './summarize-retries.ts';

const reportDir = process.argv[2] ?? 'junit-reports';
const markdownPath = process.argv[3] ?? 'retry-summary.md';
const documents = await readJUnitReports(reportDir);
const markdown = formatRetrySummary(summarizeJUnitDocuments(documents), documents.length);

await writeFile(markdownPath, markdown, 'utf8');
console.log(markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, 'utf8');
}
