import { checkDemoQaHealth } from './check-demoqa-health.ts';

const result = await checkDemoQaHealth();

if (result.ok) {
    console.log(`DemoQA catalog is reachable (${result.bookCount} books).`);
} else {
    console.error(result.reason);
    process.exitCode = 1;
}
