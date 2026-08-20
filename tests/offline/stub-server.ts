import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { AddressInfo } from 'net';

export type RecordedRequest = {
    method: string;
    path: string;
    query: URLSearchParams;
    authorization?: string;
    body: unknown;
};

export type StubResponse = {
    status: number;
    /** Omit to send an empty body (e.g. a 204). */
    body?: unknown;
};

export class StubServer {
    private readonly server: Server;
    private readonly queued: StubResponse[] = [];
    private port = 0;

    readonly requests: RecordedRequest[] = [];

    private constructor() {
        this.server = createServer((req, res) => this.handle(req, res));
    }

    static async start(): Promise<StubServer> {
        const stub = new StubServer();
        await new Promise<void>((resolve) => stub.server.listen(0, '127.0.0.1', resolve));
        stub.port = (stub.server.address() as AddressInfo).port;
        return stub;
    }

    get baseUrl(): string {
        return `http://127.0.0.1:${this.port}`;
    }

    get lastRequest(): RecordedRequest {
        const last = this.requests[this.requests.length - 1];
        if (!last) {
            throw new Error('Stub server received no requests');
        }
        return last;
    }

    queueResponse(response: StubResponse): this {
        this.queued.push(response);
        return this;
    }

    async stop(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.server.close((error) => (error ? reject(error) : resolve()));
        });
    }

    private handle(req: IncomingMessage, res: ServerResponse): void {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
            const url = new URL(req.url ?? '/', this.baseUrl);
            this.requests.push({
                method: req.method ?? '',
                path: url.pathname,
                query: url.searchParams,
                authorization: req.headers.authorization,
                body: parseJsonBody(Buffer.concat(chunks).toString()),
            });

            const next = this.queued.shift() ?? { status: 200, body: {} };
            res.statusCode = next.status;

            if (next.body === undefined) {
                res.end();
                return;
            }

            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(next.body));
        });
    }
}

function parseJsonBody(raw: string): unknown {
    if (!raw) {
        return undefined;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}
