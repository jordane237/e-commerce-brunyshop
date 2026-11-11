import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApplicationConfig } from '../../config/configuration';
import { TurnstileService } from './turnstile.service';

const SECRET = 'unit-test-turnstile-secret';

function serviceWith(overrides: Partial<ApplicationConfig['turnstile']> = {}): {
  service: TurnstileService;
  logger: { debug: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
} {
  const config = {
    get: vi.fn().mockReturnValue({
      turnstile: {
        enabled: true,
        siteKey: '1x00000000000000000000BB',
        secretKey: SECRET,
        verifyUrl: 'https://turnstile.test/siteverify',
        timeoutMs: 5000,
        ...overrides,
      },
    }),
  } as unknown as ConfigService;
  const logger = { debug: vi.fn(), error: vi.fn() };
  return {
    service: new TurnstileService(config, logger as unknown as PinoLogger),
    logger,
  };
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('TurnstileService (AUT-11)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('accepte un jeton validé par Cloudflare', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ success: true }));
    const { service } = serviceWith();

    await expect(service.verifyToken('valid-token', '127.0.0.1')).resolves.toEqual({
      success: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://turnstile.test/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = vi.mocked(fetch).mock.calls[0][1]?.body as URLSearchParams;
    expect(body.get('secret')).toBe(SECRET);
    expect(body.get('response')).toBe('valid-token');
    expect(body.get('remoteip')).toBe('127.0.0.1');
  });

  it('refuse un jeton rejeté par Cloudflare sans le logger en clair', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({ success: false, 'error-codes': ['invalid-input-response'] }),
    );
    const { service, logger } = serviceWith();

    const result = await service.verifyToken('invalid-secret-token');

    expect(result).toMatchObject({ success: false, reason: 'invalid-token' });
    expect(JSON.stringify(logger.debug.mock.calls)).toContain('invalid-');
    expect(JSON.stringify(logger.debug.mock.calls)).not.toContain('invalid-secret-token');
  });

  it('retourne une indisponibilité et alerte sur une erreur HTTP', async () => {
    vi.mocked(fetch).mockResolvedValue(response({}, 500));
    const { service, logger } = serviceWith();

    const result = await service.verifyToken('token');

    expect(result).toMatchObject({
      success: false,
      unavailable: true,
      reason: 'http-error',
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ alert: 'TURNSTILE_UNAVAILABLE' }),
      expect.any(String),
    );
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(SECRET);
  });

  it('traite une réponse JSON invalide comme indisponible', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('not-json', { status: 200 }));
    const { service } = serviceWith();

    await expect(service.verifyToken('token')).resolves.toMatchObject({
      success: false,
      unavailable: true,
      reason: 'invalid-response',
    });
  });

  it('traite internal-error comme indisponible', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({ success: false, 'error-codes': ['internal-error'] }),
    );
    const { service } = serviceWith();

    await expect(service.verifyToken('token')).resolves.toMatchObject({
      success: false,
      unavailable: true,
      reason: 'internal-error',
    });
  });

  it('annule la vérification après le timeout configuré', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        }),
    );
    const { service } = serviceWith({ timeoutMs: 5000 });

    const pending = service.verifyToken('token');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(pending).resolves.toMatchObject({
      success: false,
      unavailable: true,
      reason: 'timeout',
    });
  });

  it('ne contacte pas Cloudflare quand CAPTCHA est désactivé', async () => {
    const { service } = serviceWith({ enabled: false });

    await expect(service.verifyToken('')).resolves.toEqual({
      success: false,
      reason: 'empty-token',
    });
    await expect(service.verifyToken('anything')).resolves.toEqual({
      success: true,
      skipped: true,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
