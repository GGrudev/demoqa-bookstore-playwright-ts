# DemoQA Book Store Test Automation Framework

[![CI](https://github.com/GGrudev/demoqa-bookstore-playwright-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/GGrudev/demoqa-bookstore-playwright-ts/actions/workflows/ci.yml)
[![Regression](https://github.com/GGrudev/demoqa-bookstore-playwright-ts/actions/workflows/regression.yml/badge.svg)](https://github.com/GGrudev/demoqa-bookstore-playwright-ts/actions/workflows/regression.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.58-blue?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

Playwright + TypeScript UI and API tests for the [DemoQA Book Store](https://demoqa.com/books). DemoQA is a shared public site, so the suite is built around that constraint rather than around a feature checklist.

## Why it is built this way

**Pull requests do not hit DemoQA.** Lint, typecheck, format, and an `offline` project (Zod contracts against recorded payloads, plus `ApiHelpers` against an in-process stub) run on every push. Live API and UI suites are manual dispatch or the weekly regression workflow.

**Setup and contract checks are separate.** `ApiHelpers` returns response bodies as `unknown`. Specs parse the schema that fits the scenario. Fixtures use `z.looseObject` envelopes so an extra field on DemoQA cannot fail every UI test that only needed a user id.

| Concern              | Where                       | Strictness                           |
| -------------------- | --------------------------- | ------------------------------------ |
| Contract enforcement | API and offline specs       | `z.strictObject` — rejects drift     |
| Setup (fixtures)     | `CreatedUserEnvelopeSchema` | `z.looseObject` — fields consumed    |
| Outgoing payloads    | `ApiHelpers`                | Strict — a bad request is a test bug |

The offline suite asserts that split: the same drifted payload must fail the strict contract and pass the setup envelope.

**Mutating tests own their data.** `apiTestUser` creates a unique user and deletes it afterward. Cleanup is housekeeping: a teardown failure annotates the test and `globalTeardown` retries, instead of turning a passing scenario red because DemoQA would not delete the account.

**Hybrid tests set up through the API, then log in through the UI.** DemoQA invalidates the browser session if API calls happen after login, so the order is fixed:

```typescript
await apiHelpers.addBooksToUser(apiTestUser.userId, apiTestUser.token, [isbn]);
await loginViaUi(page, apiTestUser);
await profilePage.goToProfile();
```

A static user plus `storageState` covers smoke paths that can share a session. Isolated users cannot reuse it — they do not exist until the fixture creates them.

## Layout

```text
components/          Shared UI (Header, BooksTable, ConfirmDialog)
config/              URLs, credentials, timeouts, test data
fixtures/            Page objects, ApiHelpers, per-test user lifecycle
schemas/             Zod request/response contracts
pages/               Page workflows that compose those components
tests/offline/       Contract + client tests (no network, no browser)
tests/api/           Live API contract and workflow tests
tests/e2e/           UI and hybrid UI/API tests
utils/               API client, auth, cleanup, diagnostics
.github/workflows/   PR quality gate + scheduled/manual regression
```

## How it runs

| Layer   | What it covers                                      | When                          |
| ------- | --------------------------------------------------- | ----------------------------- |
| Offline | Schema drift, `ApiHelpers` request/response mapping | Every push and PR             |
| API     | Account and book-store workflows against DemoQA     | Manual CI / weekly regression |
| UI      | Login, browse, details, profile                     | Manual CI / weekly regression |
| Hybrid  | API-seeded collection, verified in the profile UI   | Manual CI / weekly regression |

Chromium is the UI gate. Firefox and WebKit are configured but opt-in (`npm run test:cross-browser`) — rendering differences on a third-party demo site are not defects this suite can act on.

Accessibility is one login-page axe scan against WCAG 2.0/2.1 A and AA. Ad iframes and the upstream ToolsQA banner are excluded by selector, so `image-alt` still runs on the application's own markup.

## Setup

Requires Node.js 20.19 or newer (CI runs Node 22).

```bash
git clone https://github.com/GGrudev/demoqa-bookstore-playwright-ts.git
cd demoqa-bookstore-playwright-ts
npm install
npx playwright install chromium
cp .env.example .env   # optional local overrides for DEMOQA_USERNAME / DEMOQA_PASSWORD
```

Offline and API-only runs do not need credentials. UI smoke, e2e, and authenticated suites do — locally they fall back to `config/environments.ts`; in CI set `DEMOQA_USERNAME` and `DEMOQA_PASSWORD` as repository secrets.

## Commands

```bash
npm test              # offline + API + Chromium UI + authenticated
npm run test:offline  # no network, no browser, no credentials
npm run test:api
npm run test:e2e
npm run test:smoke
npm run lint
npm run typecheck
```

HTML report: `npm run test:report`. Failed CI runs upload the report, JUnit, and traces.

## Known DemoQA limitations

- **reCAPTCHA** blocks UI registration submit. `RegisterPage` covers navigation and form visibility; users are created through the API.
- **"Delete All Books"** clears the collection server-side but does not re-render the table. `ProfilePage.deleteAllBooks()` reloads before asserting. Deleting a single book does re-render.
- **Ads and an upstream banner** are third-party markup. The a11y scan excludes those regions rather than disabling rules.
- The site can be slow or reset. Isolated users and the offline PR gate keep that from becoming the pipeline.

## License

MIT
