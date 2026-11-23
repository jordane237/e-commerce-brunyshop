import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { sha256hex } from '../../common/utils/crypto';
import type { ApplicationConfig } from '../../config/configuration';
import { RedisService } from '../../infrastructure/cache/cache.module';

const ATTEMPT_TTL_SECONDS = 60 * 60;

/**
 * Anti-abus par numéro de téléphone (CA #5).
 *
 * Compteur Redis à fenêtre glissante d'une heure : `INCR` puis `EXPIRE` à la
 * première tentative. Le numéro n'est jamais stocké en clair, seulement son
 * empreinte SHA-256.
 *
 * Le service est volontairement tolérant aux pannes Redis (fail-open) : une
 * indisponibilité du cache ne doit pas empêcher une vente, le throttler IP
 * restant actif en amont. L'incident est journalisé.
 */
@Injectable()
export class OrderAttemptService {
  private readonly logger = new Logger(OrderAttemptService.name);
  private readonly limit: number;

  constructor(
    config: ConfigService,
    private readonly redisService: RedisService,
  ) {
    const application = config.get<ApplicationConfig>('app');
    this.limit = application?.orders.rateLimitPerHour ?? 10;
  }

  async assertWithinLimit(phone: string): Promise<void> {
    const key = this.buildKey(phone);
    try {
      const attempts = await this.redisService.redis.incr(key);
      if (attempts === 1) {
        await this.redisService.redis.expire(key, ATTEMPT_TTL_SECONDS);
      }
      if (attempts > this.limit) {
        throw new HttpException(
          {
            code: 'ORDER_RATE_LIMIT_EXCEEDED',
            message:
              'Trop de commandes pour ce numéro. Réessayez plus tard ou contactez-nous sur WhatsApp.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.warn(
        { cause: error instanceof Error ? error.message : String(error) },
        'Compteur anti-abus téléphone indisponible, requête autorisée',
      );
    }
  }

  private readonly trackingLimit = 10;
  private readonly TRACKING_TTL_SECONDS = 60 * 60;

  buildKey(phone: string): string {
    return `order:attempts:${sha256hex(normalizePhone(phone))}`;
  }

  async isTrackingRateLimited(identifierHash: string): Promise<boolean> {
    const key = `order:track:attempts:${identifierHash}`;
    try {
      const raw = await this.redisService.redis.get(key);
      const count = parseInt((raw as string | null) ?? '0', 10);
      return count >= this.trackingLimit;
    } catch (error: unknown) {
      this.logger.warn(
        { cause: error instanceof Error ? error.message : String(error) },
        'Compteur anti-abus suivi indisponible, requête autorisée',
      );
      return false;
    }
  }

  async recordTrackingAttempt(identifierHash: string): Promise<void> {
    const key = `order:track:attempts:${identifierHash}`;
    try {
      const count = await this.redisService.redis.incr(key);
      if (count === 1) {
        await this.redisService.redis.expire(key, this.TRACKING_TTL_SECONDS);
      }
    } catch (error: unknown) {
      this.logger.warn(
        { cause: error instanceof Error ? error.message : String(error) },
        'Compteur anti-abus suivi indisponible, tentative non enregistrée',
      );
    }
  }

  get limitPerHour(): number {
    return this.limit;
  }
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s.-]/g, '').trim();
}
