import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ConfigService } from '@nestjs/config';
import type { RedisService } from '../../infrastructure/cache/cache.module';
import { OrderAttemptService } from './order-attempt.service';

function setup(options: { limit?: number; fail?: boolean } = {}) {
  const counters = new Map<string, number>();
  const redis = {
    incr: vi.fn(async (key: string) => {
      if (options.fail === true) throw new Error('redis down');
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    }),
    expire: vi.fn(async () => 1),
  };
  const config = {
    get: vi.fn(() => ({ orders: { rateLimitPerHour: options.limit ?? 10 } })),
  };
  const service = new OrderAttemptService(
    config as unknown as ConfigService,
    { redis } as unknown as RedisService,
  );
  return { service, redis, counters };
}

describe('OrderAttemptService', () => {
  it('autorise les tentatives sous la limite', async () => {
    const { service, redis } = setup({ limit: 3 });

    await expect(service.assertWithinLimit('+237699000001')).resolves.toBeUndefined();
    expect(redis.expire).toHaveBeenCalledWith(expect.any(String), 3600);
  });

  it('refuse au-delà de la limite horaire', async () => {
    const { service } = setup({ limit: 2 });
    await service.assertWithinLimit('+237699000001');
    await service.assertWithinLimit('+237699000001');

    const error = await service
      .assertWithinLimit('+237699000001')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((error as HttpException).getResponse()).toMatchObject({
      code: 'ORDER_RATE_LIMIT_EXCEEDED',
    });
  });

  it('ne stocke jamais le numéro en clair', async () => {
    const { service } = setup();

    const key = service.buildKey('+237 699 00 00 01');

    expect(key).not.toContain('237');
    expect(key).not.toContain('699');
    expect(key).toMatch(/^order:attempts:[a-f0-9]{64}$/);
  });

  it('normalise le numéro : même compteur avec ou sans espaces', async () => {
    const { service, counters } = setup({ limit: 1 });

    await service.assertWithinLimit('+237699000001');
    await expect(service.assertWithinLimit('+237 699 00 00 01')).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(counters.size).toBe(1);
  });

  it('reste tolérant quand Redis est indisponible', async () => {
    const { service } = setup({ fail: true });

    await expect(service.assertWithinLimit('+237699000001')).resolves.toBeUndefined();
  });
});

describe('OrderAttemptService tracking (ORD-05)', () => {
  it('pose INCR et TTL sur recordTrackingAttempt', async () => {
    const counters = new Map<string, number>();
    const redis = {
      incr: vi.fn(async (key: string) => {
        const next = (counters.get(key) ?? 0) + 1;
        counters.set(key, next);
        return next;
      }),
      expire: vi.fn(async () => 1),
      get: vi.fn(async (key: string) => String(counters.get(key) ?? 0)),
    };
    const config = { get: vi.fn(() => ({ orders: { rateLimitPerHour: 10 } })) };
    const service = new OrderAttemptService(
      config as unknown as never,
      { redis } as unknown as never,
    );

    await service.recordTrackingAttempt('hash-1');
    expect(redis.incr).toHaveBeenCalled();
    expect(redis.expire).toHaveBeenCalledWith('order:track:attempts:hash-1', 3600);
  });

  it('isTrackingRateLimited true après 10 tentatives', async () => {
    const redis = {
      incr: vi.fn(),
      expire: vi.fn(),
      get: vi.fn().mockResolvedValue('10'),
    };
    const config = { get: vi.fn(() => ({ orders: { rateLimitPerHour: 10 } })) };
    const service = new OrderAttemptService(
      config as unknown as never,
      { redis } as unknown as never,
    );

    await expect(service.isTrackingRateLimited('hash-1')).resolves.toBe(true);
  });

  it('hash de l’identifiant (pas de PII en clair)', async () => {
    const redis = { incr: vi.fn(), expire: vi.fn(), get: vi.fn() };
    const config = { get: vi.fn(() => ({ orders: { rateLimitPerHour: 10 } })) };
    const service = new OrderAttemptService(
      config as unknown as never,
      { redis } as unknown as never,
    );

    // isTrackingRateLimited utilise la clé fournie telle quelle (hash attendu).
    await service.isTrackingRateLimited('a'.repeat(64));
    expect(redis.get).toHaveBeenCalledWith(`order:track:attempts:${'a'.repeat(64)}`);
  });
});
