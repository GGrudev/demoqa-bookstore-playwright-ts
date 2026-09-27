const DEFAULT_BASE_URL = 'https://demoqa.com';
const CATALOG_PATH = '/BookStore/v1/Books';
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_ATTEMPTS = 2;
const RETRY_DELAY_MS = 2_000;

export type CatalogAssessment = { ok: true; bookCount: number } | { ok: false; reason: string };

export type HealthCheckOptions = {
    baseUrl?: string;
    timeoutMs?: number;
    attempts?: number;
    fetchImpl?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
};

export function assessCatalogResponse(
    status: number,
    body: unknown,
    bodyWasJson: boolean
): CatalogAssessment {
    if (status !== 200) {
        return { ok: false, reason: `DemoQA catalog returned HTTP ${status}` };
    }

    if (!bodyWasJson) {
        return { ok: false, reason: 'DemoQA catalog returned invalid JSON' };
    }

    if (!body || typeof body !== 'object' || !('books' in body) || !Array.isArray(body.books)) {
        return { ok: false, reason: 'DemoQA catalog JSON has no books array' };
    }

    if (body.books.length === 0) {
        return { ok: false, reason: 'DemoQA catalog returned no books' };
    }

    return { ok: true, bookCount: body.books.length };
}

function describeFetchError(error: unknown): string {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        return 'DemoQA catalog request timed out';
    }

    return error instanceof Error ? error.message : String(error);
}

export async function checkDemoQaHealth(
    options: HealthCheckOptions = {}
): Promise<CatalogAssessment> {
    const baseUrl = options.baseUrl ?? process.env.DEMOQA_BASE_URL ?? DEFAULT_BASE_URL;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
    const fetchImpl = options.fetchImpl ?? fetch;
    const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const url = new URL(CATALOG_PATH, baseUrl).href;

    let lastFailure: CatalogAssessment = {
        ok: false,
        reason: 'DemoQA catalog was not checked',
    };

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
            const text = await response.text();
            let body: unknown;
            let bodyWasJson = false;

            try {
                body = JSON.parse(text) as unknown;
                bodyWasJson = true;
            } catch {
                bodyWasJson = false;
            }

            const assessment = assessCatalogResponse(response.status, body, bodyWasJson);
            if (assessment.ok) {
                return assessment;
            }

            lastFailure = assessment;
        } catch (error) {
            lastFailure = { ok: false, reason: describeFetchError(error) };
        }

        if (attempt < attempts) {
            await sleep(RETRY_DELAY_MS);
        }
    }

    return lastFailure;
}
