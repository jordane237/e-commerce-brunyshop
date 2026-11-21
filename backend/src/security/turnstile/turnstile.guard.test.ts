import {
  BadRequestException,
  ServiceUnavailableException,
  type ExecutionContext,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { TurnstileGuard } from './turnstile.guard';
import type { TurnstileService } from './turnstile.service';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function guardWith(verifyToken: ReturnType<typeof vi.fn>, enabled = true): TurnstileGuard {
  return new TurnstileGuard({
    verifyToken,
    isEnabled: vi.fn().mockReturnValue(enabled),
  } as unknown as TurnstileService);
}

describe('TurnstileGuard (AUT-11)', () => {
  it('refuse sans jeton avec CAPTCHA_REQUIRED quand CAPTCHA est actif', async () => {
    const guard = guardWith(vi.fn());

    await expect(guard.canActivate(contextFor({ body: {}, headers: {} }))).rejects.toMatchObject({
      response: { code: 'CAPTCHA_REQUIRED' },
    });
  });

  it('laisse passer sans jeton quand CAPTCHA est désactivé', async () => {
    const verifyToken = vi.fn();
    const guard = guardWith(verifyToken, false);

    await expect(guard.canActivate(contextFor({ body: {}, headers: {} }))).resolves.toBe(true);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('lit le jeton depuis le body et le transmet avec l’IP', async () => {
    const verifyToken = vi.fn().mockResolvedValue({ success: true });
    const guard = guardWith(verifyToken);

    await expect(
      guard.canActivate(
        contextFor({ body: { turnstileToken: ' body-token ' }, headers: {}, ip: '10.0.0.1' }),
      ),
    ).resolves.toBe(true);
    expect(verifyToken).toHaveBeenCalledWith('body-token', '10.0.0.1');
  });

  it('lit le jeton depuis cf-turnstile-response', async () => {
    const verifyToken = vi.fn().mockResolvedValue({ success: true });
    const guard = guardWith(verifyToken);

    await expect(
      guard.canActivate(
        contextFor({
          body: {},
          headers: { 'cf-turnstile-response': 'header-token' },
          ip: '127.0.0.1',
        }),
      ),
    ).resolves.toBe(true);
    expect(verifyToken).toHaveBeenCalledWith('header-token', '127.0.0.1');
  });

  it('mappe un jeton invalide en 400 CAPTCHA_INVALID', async () => {
    const guard = guardWith(vi.fn().mockResolvedValue({ success: false }));

    await expect(
      guard.canActivate(contextFor({ body: { turnstileToken: 'bad' }, headers: {} })),
    ).rejects.toMatchObject({
      response: { code: 'CAPTCHA_INVALID' },
    });
  });

  it('mappe indisponibilité/timeout en 503 CAPTCHA_UNAVAILABLE', async () => {
    const guard = guardWith(vi.fn().mockResolvedValue({ success: false, unavailable: true }));

    let error: unknown;
    try {
      await guard.canActivate(contextFor({ body: { turnstileToken: 'token' }, headers: {} }));
    } catch (caught: unknown) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
      code: 'CAPTCHA_UNAVAILABLE',
    });
  });

  it('propage une exception de service sans la transformer', async () => {
    const guard = guardWith(vi.fn().mockRejectedValue(new BadRequestException('boom')));

    await expect(
      guard.canActivate(contextFor({ body: { turnstileToken: 'token' }, headers: {} })),
    ).rejects.toThrow('boom');
  });
});
