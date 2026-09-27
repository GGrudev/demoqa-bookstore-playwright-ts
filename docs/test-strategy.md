# Test Strategy

## Purpose

This strategy defines how the DemoQA Book Store framework balances fast feedback,
contract confidence, browser coverage, and the instability of a shared public test
environment.

The framework is designed to:

- detect client and schema regressions without contacting DemoQA on every change;
- validate critical account, catalog, and collection workflows against the live service;
- keep mutating scenarios isolated and clean up their data;
- produce enough diagnostics to separate framework failures from DemoQA failures.

It is not intended to demonstrate exhaustive testing of DemoQA or to compensate for
missing access to its source code, database, deployment pipeline, or observability.

## Quality risks

| Risk                                   | Potential impact                                                  | Primary coverage                                             |
| -------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Authentication or session failure      | Users cannot access protected profile features                    | Account API, login UI, authenticated project                 |
| Incorrect catalog data or navigation   | Users cannot discover or open books                               | Book Store API and browser tests                             |
| Collection mutation failure            | Books are added, replaced, or deleted incorrectly                 | API workflows and hybrid API/UI tests                        |
| API contract drift                     | Setup code or assertions consume an unexpected response           | Strict Zod contracts and recorded payloads                   |
| Invalid outgoing requests              | Tests send malformed data and produce misleading failures         | Request schemas and offline client tests                     |
| Shared test-data collision             | Parallel tests affect another user's state                        | Per-test API users and scoped cleanup                        |
| Stale browser state                    | Tests pass with authentication that no longer represents the user | Dedicated setup project and authenticated smoke test         |
| Third-party or environment instability | Ads, latency, or DemoQA outages create false alarms               | Offline PR gate, retries, traces, and failure classification |

## Test layers

### Offline contract tests

Location: `tests/offline/contracts`

These tests validate recorded DemoQA payloads against strict Zod schemas and prove
that meaningful drift is rejected. They also verify that setup envelopes remain
tolerant of unrelated extra fields while still requiring the fields consumed by
fixtures.

They run without a browser, credentials, or network access and belong in every pull
request quality gate.

### Offline API-client tests

Location: `tests/offline/api-client`

These tests run `ApiHelpers` against an in-process stub server. They validate:

- HTTP methods, paths, query parameters, headers, and request bodies;
- outgoing payload validation before a request reaches the network;
- handling of success and error payloads;
- helper behavior used by test fixtures.

They test framework behavior deterministically. They do not claim that the live
DemoQA service is available or correct.

### Live API tests

Location: `tests/api`

These tests validate account and Book Store workflows against DemoQA. Assertions
combine HTTP status checks, schema parsing, and scenario-specific outcomes.

API tests create isolated users when they mutate state. They are excluded from the
pull request gate because DemoQA is a shared external dependency.

### Browser tests

Location: `tests/e2e`

Browser tests cover user-observable behavior that cannot be proven by API tests
alone, including login validation, navigation, search, book details, profile
controls, and collection rendering.

Chromium is the primary UI gate. Firefox and WebKit are opt-in cross-browser checks,
because rendering differences on an external demonstration site are not defects this
repository can fix.

### Hybrid API/UI tests

Hybrid scenarios use the API for deterministic setup and the browser for user-facing
verification:

```text
Create user -> seed collection through API -> log in through UI -> verify UI -> clean up
```

DemoQA may invalidate a browser session when API mutations occur after login.
Therefore, API setup must complete before UI authentication. The
[architecture](architecture.md) shows this sequence and the separate static-session
flow.

### Accessibility check

The login page is scanned with Axe against WCAG A and AA rules. Third-party ad
iframes and the upstream ToolsQA banner are excluded by selector; application markup
remains in scope. The scan currently fails only on critical violations and attaches
the full violation payload for review.

## Test-data strategy

### Isolated users

Mutating tests use the `apiTestUser` fixture. Each test:

1. generates unique credentials;
2. creates the account and token through the API;
3. owns all mutations made for the scenario;
4. attempts cleanup in a `finally` block.

Cleanup failures annotate the test rather than replacing the scenario result. The
user is recorded and `globalTeardown` retries deletion.

### Static authenticated user

An environment-configured static user creates Playwright `storageState` for
non-mutating authenticated smoke paths. CI receives its credentials from repository
secrets. The static user must not be used for tests that change shared collection
state.

### Known catalog data

Tests use known ISBN and title values because DemoQA does not provide an environment
owned by this repository. A catalog reset can therefore invalidate test assumptions
and should be classified as an environment/data change before modifying assertions.

## Execution and CI policy

| Trigger                  | Required checks                                                | Live DemoQA traffic |
| ------------------------ | -------------------------------------------------------------- | ------------------- |
| Pull request / push      | Lint, typecheck, formatting, offline project                   | No                  |
| Manual API run           | Quality checks and API project                                 | Yes                 |
| Manual smoke run         | Quality checks, API smoke, Chromium smoke, authenticated smoke | Yes                 |
| Weekly regression        | Quality checks, API, and two Chromium/authenticated E2E shards | Yes                 |
| Manual cross-browser run | Firefox and WebKit E2E                                         | Yes                 |

CI forbids committed `test.only`, uses bounded workers, and retains Playwright
diagnostics according to the configured retry/failure policy.

Chromium and authenticated end-to-end tests are the only sharded suite. Two jobs
each run half of that list. The selected worker budget is divided by two for each
shard, with a floor of one: a budget of 2 keeps one browser per shard, a budget of
4 keeps two, and a budget of 1 still uses one per shard. Each shard uploads a blob
report. A merge job rebuilds one HTML report and one JUnit file when at least one
shard finishes, including after a shard failure. The pull request gate, API, smoke,
and cross-browser jobs are not sharded. The `setup` project is a dependency, so
each shard that contains authenticated tests logs in the static user again.

## Entry and exit criteria

### Pull request gate

A change is eligible to merge when:

- lint, typecheck, and formatting checks pass;
- all offline contract and client tests pass;
- no focused tests are committed;
- intentional skips or known limitations are documented.

Live DemoQA availability is not a pull request prerequisite.

### Live regression

A live run is considered successful when all selected projects pass after configured
retries and cleanup completes or records recoverable leaked users.

A retry that turns a failure into a pass is still reliability evidence and should be
reviewed rather than treated as equivalent to a first-attempt pass.

## Failure classification

Failures should be classified before changing tests:

| Classification           | Examples                                                         | Response                                                    |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Product/API defect       | Wrong response, failed mutation, broken UI behavior              | Preserve evidence and report the behavior                   |
| Test defect              | Incorrect locator, race condition, invalid setup, weak assertion | Fix the test and add regression coverage                    |
| Environment/data issue   | DemoQA outage, catalog reset, expired static user                | Restore prerequisites or rerun when healthy                 |
| Third-party interference | Advertisement overlay or upstream banner violation               | Exclude narrowly or capture as environmental evidence       |
| Contract drift           | Added, removed, or retyped API field                             | Review whether the contract or setup envelope should change |

Tests must not weaken assertions merely to make an external failure pass.

## Diagnostics

The framework uses:

- HTML and JUnit reports;
- traces on the first CI retry and retained traces for local failures;
- screenshots and CI videos on failure;
- JSON attachments for scenario context and accessibility violations;
- cleanup annotations and a leaked-user registry.

Secrets and authentication tokens must not be attached or printed.

## Explicit exclusions

The current strategy does not cover:

- UI registration submission, because reCAPTCHA blocks automation;
- database validation, because no database access is available;
- production monitoring or log correlation;
- load, stress, or endurance testing of the shared DemoQA service;
- visual-regression baselines for third-party-controlled pages;
- mobile-device coverage;
- exhaustive accessibility certification;
- security penetration testing.

These exclusions are deliberate boundaries, not claims that the associated risks do
not exist.

## Review triggers

Review this strategy when:

- a new project, environment, browser, or test layer is introduced;
- CI execution or retry policy changes;
- test data becomes shared or persistent;
- DemoQA behavior changes an existing assumption;
- a recurring flaky failure is identified;
- credentials, reports, or artifacts change their security exposure.
