import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export type FakeTurnstileMode = 'success' | 'invalid' | 'unavailable';

export interface FakeTurnstile {
  url: string;
  setMode: (mode: FakeTurnstileMode) => void;
  close: () => Promise<void>;
}

// The real Cloudflare test endpoint is intentionally not used by the e2e
// suite: it intermittently times out when many requests are sent in a row.
// The application still receives a form-encoded POST and parses the same JSON
// contract, so the guard/service integration is exercised deterministically.
export async function startFakeTurnstile(
  initialMode: FakeTurnstileMode = 'success',
): Promise<FakeTurnstile> {
  let mode = initialMode;

  const server: Server = createServer((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      body += chunk;
    });
    request.on('end', () => {
      if (mode === 'unavailable') {
        response.writeHead(500, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ success: false, 'error-codes': ['internal-error'] }));
        return;
      }

      const token = new URLSearchParams(body).get('response') ?? '';
      const success = mode === 'success' && token.trim() !== '';
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify(
          success
            ? { success: true }
            : { success: false, 'error-codes': ['invalid-input-response'] },
        ),
      );
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${address.port}/siteverify`,
    setMode: (next) => {
      mode = next;
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error === undefined ? resolve() : reject(error)));
      }),
  };
}
